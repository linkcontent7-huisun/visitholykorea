import { supabase } from '@/shared/api/supabase';

const TABLE = 'program_applications';

export interface NewApplication {
  programSlug: string;
  course: string;
  visitDate: string;
  contactName: string;
  contactPhone: string;
  adults: number;
  children: number;
  seniors: number;
  needsMobilityHelp: boolean;
  requestNote: string;
  /** 선택 동의 — 다음 관련 행사 안내 받기(1년 보관) */
  noticeConsent: boolean;
}

export interface ProgramApplication extends NewApplication {
  id: string;
  createdAt: string;
}

/**
 * 접수 한 건 저장. 비로그인 방문자는 읽기 권한이 없어 insert 뒤 select 를 못 하므로
 * 접수번호(id)를 여기서 만들어 넣고 그대로 돌려준다.
 */
export async function submitApplication(input: NewApplication): Promise<string> {
  const id = crypto.randomUUID();
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from(TABLE).insert({
    id,
    user_id: auth.user?.id ?? null,
    program_slug: input.programSlug,
    course: input.course,
    visit_date: input.visitDate,
    contact_name: input.contactName.trim(),
    contact_phone: input.contactPhone.replace(/\s/g, ''),
    adults: input.adults,
    children: input.children,
    seniors: input.seniors,
    needs_mobility_help: input.needsMobilityHelp,
    request_note: input.requestNote.trim() || null,
    privacy_consent: true,
    // 동의했을 때만 칸을 보낸다 — 칸이 아직 없는 DB 에서도 기본 접수는 되도록
    ...(input.noticeConsent ? { notice_consent: true } : {}),
  });
  if (error) throw new Error(error.message);
  return id;
}

/** 관리자용 — RLS 가 관리자에게만 행을 돌려준다 */
export async function fetchApplications(): Promise<ProgramApplication[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id as string,
    createdAt: r.created_at as string,
    programSlug: r.program_slug as string,
    course: r.course as string,
    visitDate: r.visit_date as string,
    contactName: r.contact_name as string,
    contactPhone: r.contact_phone as string,
    adults: r.adults as number,
    children: r.children as number,
    seniors: r.seniors as number,
    needsMobilityHelp: r.needs_mobility_help as boolean,
    requestNote: (r.request_note as string | null) ?? '',
    noticeConsent: r.notice_consent === true,
  }));
}

export async function deleteApplication(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** 「나의 체험 링크」에 보이는 접수 한 건 — 연락처 없음, 이름은 가림 */
export interface MyApplication {
  id: string;
  programSlug: string;
  course: string;
  visitDate: string;
  nameMasked: string;
  adults: number;
  children: number;
  seniors: number;
  noticeConsent: boolean;
  createdAt: string;
}

/** 접수 id 를 아는 사람(링크를 가진 참가자)만 — DB 함수가 필요한 칸만 돌려준다 */
export async function fetchMyApplication(id: string): Promise<MyApplication | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabase.rpc('get_my_program_application', { p_id: id });
  if (error) throw new Error(error.message);
  const r = (data as Record<string, unknown>[] | null)?.[0];
  if (!r) return null;
  return {
    id: r.id as string,
    programSlug: r.program_slug as string,
    course: r.course as string,
    visitDate: r.visit_date as string,
    nameMasked: r.name_masked as string,
    adults: r.adults as number,
    children: r.children as number,
    seniors: r.seniors as number,
    noticeConsent: r.notice_consent === true,
    createdAt: r.created_at as string,
  };
}

/** 접수번호 — 사람이 부르기 쉽게 앞 8자리만 */
export function receiptCode(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export interface ApplicationSummary {
  count: number;
  people: number;
  adults: number;
  children: number;
  seniors: number;
  mobility: number;
  byCourse: Record<string, number>;
  byDate: { date: string; people: number }[];
}

export function summarize(rows: ProgramApplication[]): ApplicationSummary {
  const s: ApplicationSummary = {
    count: rows.length,
    people: 0,
    adults: 0,
    children: 0,
    seniors: 0,
    mobility: 0,
    byCourse: {},
    byDate: [],
  };
  const dates = new Map<string, number>();
  for (const r of rows) {
    const n = r.adults + r.children + r.seniors;
    s.people += n;
    s.adults += r.adults;
    s.children += r.children;
    s.seniors += r.seniors;
    if (r.needsMobilityHelp) s.mobility += 1;
    s.byCourse[r.course] = (s.byCourse[r.course] ?? 0) + n;
    dates.set(r.visitDate, (dates.get(r.visitDate) ?? 0) + n);
  }
  s.byDate = [...dates]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, people]) => ({ date, people }));
  return s;
}

const SHEET_HEAD = [
  '접수번호',
  '접수일시',
  '방문일',
  '코스',
  '대표자',
  '연락처',
  '성인',
  '아동',
  '어르신',
  '총 인원',
  '이동 도움',
  '요청 사항',
  '다음 행사 안내 동의',
];

function hyphenPhone(p: string): string {
  const m = /^(\d{3})(\d{3,4})(\d{4})$/.exec(p);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : p;
}

/**
 * 엑셀 시트에 넣을 표(머리줄 + 한 줄에 접수 한 건). 기관이 내려받아 기록·다음 행사 안내에 쓴다.
 * 연락처는 글자로 넣어 앞의 0 이 지워지지 않게 한다.
 */
export function applicationsToSheet(rows: ProgramApplication[]): (string | number)[][] {
  return [
    SHEET_HEAD,
    ...rows.map((r) => [
      receiptCode(r.id),
      new Date(r.createdAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      r.visitDate,
      r.course,
      r.contactName,
      hyphenPhone(r.contactPhone),
      r.adults,
      r.children,
      r.seniors,
      r.adults + r.children + r.seniors,
      r.needsMobilityHelp ? '필요' : '',
      r.requestNote,
      r.noticeConsent ? '동의' : '',
    ]),
  ];
}

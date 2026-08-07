/**
 * 번역 작업 파일의 형식 — 내보내기와 넣기가 같은 약속을 보게 한다.
 *
 * 206곳을 한 번에 번역할 수는 없다. 그래서 교구 단위로 끊어 파일로 내보내고,
 * 채운 다음 다시 넣는다. 중간에 끊겨도 파일이 남아 있어 이어서 할 수 있고,
 * 사람이 감수할 때도 이 파일을 그대로 고치면 된다.
 */

/** 번역이 필요한 원문 (참고용, 넣을 때는 쓰지 않는다) */
export interface SourceText {
  name: string;
  description: string | null;
  history: string | null;
  location: string | null;
}

/** 채워 넣을 번역. 빈 문자열·null 은 "아직 안 함"으로 보고 건너뛴다. */
export interface TargetText {
  name: string;
  description: string | null;
  history: string | null;
  /** 주소 로마자 표기. 주소 자체는 번역하지 않는다 — 택시 기사에게 통해야 한다. */
  addressRomanized: string | null;
}

export interface TranslationItem {
  siteId: string;
  /** 사람이 파일을 볼 때 어디인지 알아보라고 넣는다. DB 에는 쓰지 않는다. */
  diocese: string | null;
  source: SourceText;
  target: TargetText;
}

export interface TranslationFile {
  language: string;
  /** 어떤 교구를 뽑았는지. 전체면 null. */
  diocese: string | null;
  generatedAt: string;
  items: TranslationItem[];
}

/**
 * 파일 형식 검사. 손으로 고치는 파일이라 깨진 채로 DB 에 들어가는 걸 막는다.
 * 넣기 전에 통과해야 한다.
 */
export function parseTranslationFile(raw: unknown): TranslationFile {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('최상위가 객체가 아닙니다.');
  }
  const file = raw as Partial<TranslationFile>;

  if (typeof file.language !== 'string' || file.language.trim() === '') {
    throw new Error('language 가 없습니다.');
  }
  if (!Array.isArray(file.items)) {
    throw new Error('items 배열이 없습니다.');
  }

  file.items.forEach((item, i) => {
    const where = `items[${i}]`;
    if (typeof item?.siteId !== 'string' || item.siteId.trim() === '') {
      throw new Error(`${where}.siteId 가 없습니다.`);
    }
    if (typeof item?.target !== 'object' || item.target === null) {
      throw new Error(`${where}.target 이 없습니다.`);
    }
  });

  return file as TranslationFile;
}

/** 실제로 넣을 값이 하나라도 있는가. 빈 껍데기 행이 쌓이는 걸 막는다. */
export function hasContent(target: TargetText): boolean {
  return [target.name, target.description, target.history, target.addressRomanized].some(
    (v) => typeof v === 'string' && v.trim() !== '',
  );
}

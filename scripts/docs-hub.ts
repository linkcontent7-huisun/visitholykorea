/**
 * 문서 허브 생성기 — `npm run docs:hub` → `docs/index.html`
 *
 * 왜 손으로 안 쓰고 만들어 내는가: 손으로 쓴 목차는 2주면 낡는다.
 * 2026-09-14 점검에서 `70-agent-workspace/README.md` 의 작업 표가 T-013 에서 멈춰
 * 실제 T-020 까지 중 7개가 빠져 있었고, 없는 파일을 가리키는 경로가 23곳 있었다.
 * 허브를 또 하나의 손글씨 문서로 만들면 같은 일이 반복되므로,
 * **각 폴더 README 의 "확인하고 싶은 것 → 파일" 표를 원본으로 읽어** 그린다.
 * 표를 고치면 허브가 따라온다.
 *
 * 같은 이유로 이 스크립트는 숫자를 스스로 세지 않는다.
 * 「지금 상태」 숫자는 `docs/이어서-할-일.md` 한 곳에서만 읽어 온다.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(import.meta.dirname, '..');
const DOCS = join(ROOT, 'docs');
const OUT = join(DOCS, 'index.html');

/**
 * 마크다운 판도 같이 낸다.
 *
 * `index.html` 은 브라우저로 열어야 보이고 GitHub 웹에서는 원본 코드로만 보인다.
 * 저장소에서 바로 읽히는 목차가 하나 필요해서 같은 원본으로 두 벌을 낸다.
 * 두 파일 다 **손으로 고치지 않는다** — 폴더 README 표를 고치면 따라온다.
 */
const OUT_MD = join(DOCS, 'DSH', '문서-허브.md');

/** 허브에 싣는 문서 확장자. pptx 같은 첨부는 목록에만 나오고 링크는 걸지 않는다. */
const DOC_EXT = ['.md', '.html', '.txt', '.gs'];

interface DocFile {
  /** docs/ 기준 상대 경로 (슬래시) */
  path: string;
  folder: string;
  name: string;
  kb: number;
  /** 폴더 README 표에 등장하는가 */
  listed: boolean;
}

interface Entry {
  /** 표의 첫 칸 — "확인하고 싶은 것" */
  label: string;
  /** 나머지 칸을 이어 붙인 설명 */
  note: string;
  /** index.html 기준 링크 주소. 저장소에 없으면 null */
  href: string | null;
  /** 저장소에 없는 경로를 가리키고 있었다 */
  missing: boolean;
  /** 표에 적혀 있던 원래 경로 */
  rawPath: string;
  /** docs/ 밖의 저장소 파일 (예: .claude/rules/…) */
  outside: boolean;
}

interface Section {
  folder: string;
  title: string;
  /** docs/README.md 의 첫 표가 그 폴더를 한 줄로 설명한 것 */
  blurb: string;
  /** 폴더 README 의 소제목별 묶음 */
  groups: { heading: string; entries: Entry[] }[];
}

// ─────────────────────────────────────────────────────────── 파일 훑기

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function toDocsPath(absolute: string): string {
  return relative(DOCS, absolute).split(sep).join('/');
}

function exists(docsPath: string): boolean {
  try {
    statSync(join(DOCS, docsPath));
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────── 마크다운 표 읽기

interface Table {
  heading: string;
  rows: string[][];
}

/** `| a | b |` 줄을 칸으로 쪼갠다. 구분줄(`| --- |`)은 버린다. */
function splitRow(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return null;
  const cells = trimmed
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
  if (cells.every((c) => /^:?-{2,}:?$/.test(c))) return null;
  return cells;
}

/** 문서에서 표를 모두 뽑는다. 각 표에는 바로 위 소제목을 붙인다. */
function parseTables(markdown: string): Table[] {
  const tables: Table[] = [];
  let heading = '';
  let current: string[][] | null = null;

  for (const line of markdown.split(/\r?\n/)) {
    const headingMatch = /^#{2,4}\s+(.*)$/.exec(line);
    if (headingMatch) {
      heading = (headingMatch[1] ?? '').trim();
      current = null;
      continue;
    }
    const cells = splitRow(line);
    if (cells) {
      if (!current) {
        current = [];
        tables.push({ heading, rows: current });
      }
      current.push(cells);
    } else if (!line.trim().startsWith('|')) {
      current = null;
    }
  }
  return tables;
}

interface Candidate {
  raw: string;
  /** 확장자가 없어 "파일일지도 모르는" 값 — 못 찾으면 조용히 버린다 */
  uncertain: boolean;
  /** 경로가 들어 있던 칸 번호. 설명에서 경로를 빼는 데 쓴다 */
  cellIndex: number;
}

/**
 * 칸 안의 첫 번째 백틱 경로를 꺼낸다.
 *
 * 폴더마다 표기가 다르다 — `프로젝트-개요.md`(확장자 있음), `docs/…`(docs 부터),
 * 그리고 40-knowledge 처럼 **확장자를 떼고** `한국천주교회의_탄생과_성장` 이라고만 쓰는 곳도 있다.
 * 마지막 것은 `image_url` 같은 코드 조각과 구분이 안 되므로, 실제 파일을 찾았을 때만 링크로 친다.
 */
function pickPath(cells: string[]): Candidate | null {
  let fallback: Candidate | null = null;
  for (let i = 0; i < cells.length; i++) {
    for (const match of (cells[i] ?? '').matchAll(/`([^`]+)`/g)) {
      const raw = (match[1] ?? '').trim();
      if (raw.includes(' ') || raw.includes('*') || raw.endsWith('/')) continue;
      if (DOC_EXT.some((ext) => raw.toLowerCase().endsWith(ext))) {
        return { raw, uncertain: false, cellIndex: i };
      }
      if (!fallback && /^[^.]+$/.test(raw)) fallback = { raw, uncertain: true, cellIndex: i };
    }
  }
  return fallback;
}

function existsAtRoot(repoPath: string): boolean {
  try {
    statSync(join(ROOT, repoPath));
    return true;
  } catch {
    return false;
  }
}

interface Target {
  href: string | null;
  docsPath: string | null;
  outside: boolean;
}

/**
 * 표에 적힌 경로가 실제로 어디를 가리키는지 찾는다.
 *
 * 폴더 README 는 세 가지 방식을 섞어 쓴다 — 같은 폴더 안 상대 경로(`프로젝트-개요.md`),
 * docs/ 부터 쓴 경로(`docs/20-architecture/adr/…`), 그리고 **저장소 루트 기준 경로**
 * (`.claude/rules/orchestrator.md`). 마지막 것을 못 알아보면 멀쩡한 파일이
 * "저장소에 없음"으로 표시된다.
 */
function resolveTarget(raw: string, folder: string, subFolder: string): Target {
  const cleaned = raw.replace(/^\.\//, '');

  const bases: string[] = [];
  if (cleaned.startsWith('docs/')) bases.push(cleaned.slice('docs/'.length));
  else {
    // README 소제목이 `## 공모전/` 또는 `## 03-교회사-개요` 면 그 아래 표는 그 하위 폴더 기준이다
    if (folder && subFolder) bases.push(`${folder}/${subFolder}/${cleaned}`);
    if (folder) bases.push(`${folder}/${cleaned}`);
    bases.push(cleaned);
  }
  // 확장자를 떼고 적는 폴더(40-knowledge)를 위해 `.md` 를 붙여서도 찾아본다
  const candidates = bases.flatMap((b) =>
    DOC_EXT.some((ext) => b.toLowerCase().endsWith(ext)) ? [b] : [b, `${b}.md`],
  );
  for (const candidate of candidates) {
    if (exists(candidate)) return { href: candidate, docsPath: candidate, outside: false };
  }

  // 마지막 수단: 같은 폴더 안에서 파일 이름이 같은 것을 찾는다.
  // 표가 하위 폴더를 안 적고 파일 이름만 쓴 경우를 구해 준다.
  if (!cleaned.includes('/') && folder) {
    const matches = docFiles.filter((f) => f.folder === folder && f.name === cleaned);
    const only = matches.length === 1 ? matches[0] : undefined;
    if (only) return { href: only.path, docsPath: only.path, outside: false };
  }

  // docs/ 밖의 저장소 파일 — index.html 이 docs/ 안에 있으므로 한 단계 올라간다
  if (!cleaned.startsWith('docs/') && existsAtRoot(cleaned)) {
    return { href: `../${cleaned}`, docsPath: null, outside: true };
  }

  return { href: null, docsPath: null, outside: false };
}

/** 마크다운 강조·링크 문법을 지우고 사람이 읽을 문장만 남긴다. */
function plain(text: string): string {
  return text
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<([^>]*)>/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─────────────────────────────────────────────────────────── 모으기

const allFiles = walk(DOCS)
  .map(toDocsPath)
  .filter((p) => p !== 'index.html')
  .sort();

function toDocFile(path: string, kb: number): DocFile {
  const parts = path.split('/');
  return {
    path,
    folder: parts.length > 1 ? (parts[0] ?? '') : '',
    name: parts[parts.length - 1] ?? path,
    kb,
    listed: false,
  };
}

const docFiles: DocFile[] = allFiles.map((path) =>
  toDocFile(path, Math.round(statSync(join(DOCS, path)).size / 1024)),
);

// 이 스크립트가 만들 마크다운 판은 목록을 훑는 지금 시점엔 아직 없을 수 있다
// (첫 실행이거나 파일 이름을 바꾼 직후). 넣어 두지 않으면 허브가 **자기 자신을**
// "저장소에 없는 문서"로 표시한다.
const selfPath = toDocsPath(OUT_MD);
if (!docFiles.some((f) => f.path === selfPath)) {
  docFiles.push(toDocFile(selfPath, 0));
  docFiles.sort((a, b) => a.path.localeCompare(b.path));
}

const byPath = new Map(docFiles.map((f) => [f.path, f]));

function isFolder(name: string): boolean {
  try {
    return statSync(join(DOCS, name)).isDirectory();
  } catch {
    return false;
  }
}

/**
 * 폴더 순서와 이름은 docs/README.md 의 「폴더 → 담는 것」 표에서 가져온다.
 *
 * "첫 표"로 찾으면 안 된다 — 그 문서에 다른 표(예: 허브 보는 법)가 위에 하나 더 생기는
 * 순간 폴더를 0개로 읽는다. 실제로 2026-09-14 에 그렇게 깨졌다.
 * 그래서 **실제 폴더를 가장 많이 가리키는 표**를 고른다.
 */
function folderOrder(): { folder: string; blurb: string }[] {
  const rootReadme = readFileSync(join(DOCS, 'README.md'), 'utf8');

  let best: { folder: string; blurb: string }[] = [];
  for (const table of parseTables(rootReadme)) {
    const rows: { folder: string; blurb: string }[] = [];
    for (const row of table.rows.slice(1)) {
      const raw = pickPath(row)?.raw ?? (row[0] ?? '').replace(/`/g, '').trim();
      const folder = raw.replace(/^docs\//, '').replace(/\/$/, '');
      if (!folder || !isFolder(folder)) continue;
      rows.push({ folder, blurb: plain(row.slice(1).join(' — ')) });
    }
    if (rows.length > best.length) best = rows;
  }
  return best;
}

/**
 * 폴더의 안내 문서. 대부분 README.md 지만 40-knowledge 는 `00-색인.md` 를 쓴다 —
 * 폴더마다 관례가 다른 것을 허브가 알아서 흡수한다.
 */
function indexFileOf(folder: string): string | null {
  for (const name of ['README.md', '00-색인.md', '색인.md']) {
    if (exists(`${folder}/${name}`)) return `${folder}/${name}`;
  }
  return null;
}

/**
 * 소제목이 하위 폴더를 밝히고 있으면 그 이름을 돌려준다.
 * `## 공모전/ — 2026 한국관광공사…` · `## 03-교회사-개요 (전체 흐름…)` 두 관례를 모두 받는다.
 * 실제로 그 하위 폴더가 있을 때만 인정한다 — 제목 문장을 폴더로 오해하지 않기 위해.
 */
function subFolderOf(folder: string, heading: string): string {
  const token = (heading.trim().split(/[\s(—·]/)[0] ?? '').replace(/\/$/, '');
  if (!token || !folder) return '';
  try {
    return statSync(join(DOCS, folder, token)).isDirectory() ? token : '';
  } catch {
    return '';
  }
}

function buildSection(folder: string, blurb: string): Section | null {
  const readmePath = indexFileOf(folder);
  if (!readmePath) return null;
  const markdown = readFileSync(join(DOCS, readmePath), 'utf8');
  const title = (/^#\s+(.*)$/m.exec(markdown)?.[1] ?? folder).trim();

  const groups = new Map<string, Entry[]>();
  for (const table of parseTables(markdown)) {
    for (const row of table.rows.slice(1)) {
      const candidate = pickPath(row);
      if (!candidate) continue;
      const target = resolveTarget(candidate.raw, folder, subFolderOf(folder, table.heading));
      // 확장자 없이 적힌 값은 실제 파일을 찾았을 때만 항목으로 친다
      if (candidate.uncertain && target.href === null) continue;
      if (target.docsPath) {
        const found = byPath.get(target.docsPath);
        if (found) found.listed = true;
      }
      // 설명에서 경로 자체를 뺀다 — 안 그러면 "프로젝트-개요.md — 프로젝트-개요.md" 가 된다.
      // 경로를 빼고 나면 앞에 구분 기호가 남는다(`…md — 일부는 해결됨` → `— 일부는 해결됨`).
      // 그걸 그대로 두면 표에서 "— — 일부는 해결됨" 이 된다.
      const noteCells = row
        .map((text, i) =>
          i === candidate.cellIndex
            ? text
                .replace(`\`${candidate.raw}\``, '')
                .replace(/^[\s—·,:-]+/, '')
                .trim()
            : text,
        )
        .slice(1)
        .filter((text) => text.length > 0);

      const heading = table.heading || '주요 문서';
      const list = groups.get(heading) ?? [];
      list.push({
        label: plain(row[0] ?? '') || candidate.raw,
        note: plain(noteCells.join(' · ')),
        href: target.href,
        missing: target.href === null,
        rawPath: target.docsPath ?? candidate.raw,
        outside: target.outside,
      });
      groups.set(heading, list);
    }
  }
  // README 자신도 문서다
  const readmeFile = byPath.get(readmePath);
  if (readmeFile) readmeFile.listed = true;

  return {
    folder,
    title: title || folder,
    blurb,
    groups: [...groups].map(([heading, entries]) => ({ heading, entries })),
  };
}

const sections = folderOrder()
  .map(({ folder, blurb }) => buildSection(folder, blurb))
  .filter((s): s is Section => s !== null);

/** 70-agent-workspace README 의 T-번호 표 */
function taskBoard(): { id: string; what: string; owner: string; status: string }[] {
  const path = '70-agent-workspace/README.md';
  if (!exists(path)) return [];
  const markdown = readFileSync(join(DOCS, path), 'utf8');
  const out: { id: string; what: string; owner: string; status: string }[] = [];
  for (const table of parseTables(markdown)) {
    for (const row of table.rows) {
      const id = plain(row[0] ?? '');
      if (!/^T-\d/.test(id)) continue;
      out.push({
        id,
        what: plain(row[1] ?? ''),
        owner: plain(row[2] ?? '') || '—',
        status: plain(row[3] ?? ''),
      });
    }
  }
  return out;
}

/** 「지금 상태」 숫자는 이어서-할-일.md 한 곳에서만 읽는다. */
function statusTables(): Table[] {
  const markdown = readFileSync(join(DOCS, '이어서-할-일.md'), 'utf8');
  const start = markdown.indexOf('## 지금 상태');
  if (start < 0) return [];
  const rest = markdown.slice(start + 3);
  const end = rest.indexOf('\n## ');
  return parseTables(markdown.slice(start, end < 0 ? undefined : start + 3 + end));
}

/** 문서 곳곳에서 가리키지만 저장소에 없는 경로 (대부분 .gitignore 로컬 전용) */
function missingRefs(): { path: string; from: string[] }[] {
  const found = new Map<string, Set<string>>();
  for (const file of docFiles) {
    if (!file.path.endsWith('.md')) continue;
    // 아직 만들어지지 않은 자기 자신은 읽을 수 없다 (위 selfPath 참고)
    if (!exists(file.path)) continue;
    const text = readFileSync(join(DOCS, file.path), 'utf8');
    for (const match of text.matchAll(/`(docs\/[^`]+?\.(?:md|html|txt|gs))`/g)) {
      const target = (match[1] ?? '').slice('docs/'.length);
      // 글롭 표기(`2026-08-13-*.md`)는 실제 경로가 아니다
      if (target.includes('*')) continue;
      if (exists(target)) continue;
      const set = found.get(target) ?? new Set<string>();
      set.add(file.path);
      found.set(target, set);
    }
  }
  return [...found]
    .map(([path, from]) => ({ path, from: [...from].sort() }))
    .sort((a, b) => b.from.length - a.from.length);
}

// ─────────────────────────────────────────────────────────── HTML 그리기

function statusClass(status: string): string {
  if (/완료|끝|통과/.test(status)) return 'done';
  if (/대기|미|없음|모름|충돌/.test(status)) return 'todo';
  if (/남음|확인|진행/.test(status)) return 'wip';
  return 'off';
}

function renderTable(table: Table): string {
  const [header, ...rows] = table.rows;
  if (!header) return '';
  return `<table><thead><tr>${header
    .map((c) => `<th>${escapeHtml(plain(c))}</th>`)
    .join('')}</tr></thead><tbody>${rows
    .map((row) => `<tr>${row.map((c) => `<td>${escapeHtml(plain(c))}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
}

function renderEntry(entry: Entry): string {
  const label = escapeHtml(entry.label);
  const find = escapeHtml(`${entry.label} ${entry.note} ${entry.rawPath}`);
  // 설명이 경로를 되풀이할 뿐이면 줄을 낭비하지 않는다
  const noteText = plain(entry.note).replace(/\s+/g, ' ');
  const redundant = noteText === '' || noteText === plain(entry.rawPath);
  const note = redundant ? '' : `<p class="note">${escapeHtml(noteText)}</p>`;

  if (entry.missing) {
    return `<li class="entry missing" data-find="${find}"><span class="title">${label}</span><span class="badge todo">로컬 전용 · 저장소에 없음</span><p class="path">${escapeHtml(
      entry.rawPath,
    )}</p>${note}</li>`;
  }
  const badge = entry.outside ? '<span class="badge off">docs 밖</span>' : '';
  return `<li class="entry" data-find="${find}"><a class="title" href="${escapeHtml(
    entry.href ?? '',
  )}">${label}</a>${badge}<p class="path">${escapeHtml(entry.rawPath)}</p>${note}</li>`;
}

function renderSections(): string {
  return sections
    .map((section) => {
      const groups = section.groups
        .map(
          (group) =>
            `<h3 class="group">${escapeHtml(group.heading)}</h3><ul class="entries">${group.entries
              .map(renderEntry)
              .join('')}</ul>`,
        )
        .join('');
      const blurb = section.blurb ? `<p class="blurb">${escapeHtml(section.blurb)}</p>` : '';
      return `<section class="folder" id="${escapeHtml(section.folder)}" data-folder="${escapeHtml(
        section.folder,
      )}"><header class="folder-head"><h2>${escapeHtml(section.title)}</h2><code>docs/${escapeHtml(
        section.folder,
      )}/</code></header>${blurb}${groups}</section>`;
    })
    .join('');
}

/**
 * 전체 문서 찾아보기 — README 표에 안 실린 것까지 전부.
 *
 * 표는 "무엇을 알고 싶은가"로 고른 목록이라 40-knowledge 의 순교자 34편이나
 * tasks/ 의 지시서 49편처럼 **묶음으로만 설명되는 문서**는 빠진다.
 * 그것들도 이름으로는 찾을 수 있어야 하므로 여기서 전부 펼친다.
 */
function renderTree(): string {
  const byFolder = new Map<string, Map<string, DocFile[]>>();
  for (const file of docFiles) {
    if (file.name === '.gitkeep') continue;
    const parts = file.path.split('/');
    const top = parts.length > 1 ? (parts[0] ?? '') : '(최상위)';
    const sub = parts.length > 2 ? parts.slice(1, -1).join('/') : '';
    const subs = byFolder.get(top) ?? new Map<string, DocFile[]>();
    const list = subs.get(sub) ?? [];
    list.push(file);
    subs.set(sub, list);
    byFolder.set(top, subs);
  }

  return [...byFolder]
    .map(([top, subs]) => {
      const count = [...subs.values()].reduce((n, list) => n + list.length, 0);
      const body = [...subs]
        .map(([sub, files]) => {
          const items = files
            .map((f) => {
              const mark = f.listed ? '' : '<span class="badge off">표에 없음</span>';
              return `<li class="entry" data-find="${escapeHtml(
                f.path,
              )}"><a class="title" href="${escapeHtml(f.path)}">${escapeHtml(
                f.name,
              )}</a>${mark} <span class="dim">${f.kb}KB</span></li>`;
            })
            .join('');
          const label = sub ? `<h4 class="sub-folder">${escapeHtml(sub)}/</h4>` : '';
          return `${label}<ul class="entries flat">${items}</ul>`;
        })
        .join('');
      return `<details class="tree" data-folder="${escapeHtml(
        top,
      )}"><summary><code>${escapeHtml(top)}</code> <span class="dim">— ${count}개</span></summary>${body}</details>`;
    })
    .join('');
}

const tasks = taskBoard();
const missing = missingRefs();
const totalKb = docFiles.reduce((sum, f) => sum + f.kb, 0);
const stamp = new Date().toISOString().slice(0, 10);

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Visit Holy Korea 문서 허브</title>
<style>
:root{
  --bg:#F5F6FA; --paper:#FFFFFF; --ink:#141C33; --ink-2:#4A5570; --ink-3:#7C86A0;
  --line:#DDE1EC; --line-2:#EEF0F6; --accent:#1E3A8A; --accent-soft:#E8EDFB;
  --done:#1B7F4C; --done-bg:#E4F4EA; --wip:#A8650F; --wip-bg:#FBEFD9;
  --todo:#B42318; --todo-bg:#FBE4E1; --off:#6B7280; --off-bg:#ECEEF3;
  --sans:"IBM Plex Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif;
  --serif:"Noto Serif KR","Apple Myungjo","Batang",serif;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --bg:#0F1424; --paper:#171D31; --ink:#EEF1F8; --ink-2:#B6BDD0; --ink-3:#8C95AE;
    --line:#2A3350; --line-2:#222A44; --accent:#8FA6F0; --accent-soft:#1E2A52;
    --done:#6CD39A; --done-bg:#163425; --wip:#F0B45A; --wip-bg:#3A2A10;
    --todo:#F58A7C; --todo-bg:#3F1A16; --off:#9AA3B8; --off-bg:#232A40;
  }
}
:root[data-theme="dark"]{
  --bg:#0F1424; --paper:#171D31; --ink:#EEF1F8; --ink-2:#B6BDD0; --ink-3:#8C95AE;
  --line:#2A3350; --line-2:#222A44; --accent:#8FA6F0; --accent-soft:#1E2A52;
  --done:#6CD39A; --done-bg:#163425; --wip:#F0B45A; --wip-bg:#3A2A10;
  --todo:#F58A7C; --todo-bg:#3F1A16; --off:#9AA3B8; --off-bg:#232A40;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.65;padding:0 20px 80px}
.wrap{max-width:1060px;margin:0 auto}
a{color:var(--accent)}
header.top{padding:44px 0 24px;border-bottom:1px solid var(--line)}
.eyebrow{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);font-weight:600}
h1{font-family:var(--serif);font-size:clamp(28px,4vw,40px);line-height:1.2;margin:8px 0 10px;font-weight:700}
.lede{color:var(--ink-2);max-width:64ch;margin:0}
.meta{display:flex;flex-wrap:wrap;gap:8px 20px;margin-top:16px;font-size:13px;color:var(--ink-3)}
.meta b{color:var(--ink-2);font-weight:600}
h2{font-family:var(--serif);font-size:22px;margin:0;font-weight:700}
h3.group{font-size:13px;letter-spacing:.04em;color:var(--ink-3);margin:22px 0 8px;font-weight:600}
section.block{margin-top:44px}
section.block > h2{margin-bottom:6px}
.sub{color:var(--ink-3);font-size:13px;margin:0 0 14px}
.controls{position:sticky;top:0;z-index:5;background:var(--bg);padding:14px 0;border-bottom:1px solid var(--line);display:flex;gap:10px;flex-wrap:wrap;align-items:center}
input[type=search]{flex:1 1 260px;min-width:0;padding:10px 14px;border:1px solid var(--line);border-radius:10px;background:var(--paper);color:var(--ink);font:inherit}
button.chip{padding:7px 13px;border:1px solid var(--line);border-radius:999px;background:var(--paper);color:var(--ink-2);font:inherit;font-size:13px;cursor:pointer}
button.chip[aria-pressed=true]{background:var(--accent-soft);border-color:var(--accent);color:var(--accent);font-weight:600}
.folder{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:20px 22px;margin-top:18px}
.folder-head{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline;border-bottom:1px solid var(--line-2);padding-bottom:10px}
.folder-head code{color:var(--ink-3);font-size:12.5px}
p.blurb{margin:10px 0 0;color:var(--ink-2);font-size:13.5px}
ul.entries{list-style:none;margin:0;padding:0;display:grid;gap:10px}
ul.plain{margin:8px 0 0;padding-left:20px}
.entry{border-left:2px solid var(--line);padding:2px 0 2px 12px}
.entry .title{font-weight:600;text-decoration:none}
.entry a.title:hover{text-decoration:underline}
.entry .path{margin:1px 0 0;font-size:12px;color:var(--ink-3);font-family:ui-monospace,monospace;word-break:break-all}
.entry .note{margin:3px 0 0;font-size:13.5px;color:var(--ink-2)}
.entry.missing{border-left-color:var(--todo);opacity:.85}
.entry.missing .title{color:var(--ink-2)}
.badge{display:inline-block;margin-left:8px;padding:1px 8px;border-radius:999px;font-size:11.5px;font-weight:600;vertical-align:middle}
.badge.done{background:var(--done-bg);color:var(--done)}
.badge.wip{background:var(--wip-bg);color:var(--wip)}
.badge.todo{background:var(--todo-bg);color:var(--todo)}
.badge.off{background:var(--off-bg);color:var(--off)}
table{width:100%;border-collapse:collapse;margin:10px 0 18px;font-size:14px}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line-2);vertical-align:top}
th{color:var(--ink-3);font-size:12.5px;font-weight:600;white-space:nowrap}
.scroll{overflow-x:auto}
details{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin-top:8px}
summary{cursor:pointer;font-weight:600;font-size:14px}
h4.sub-folder{margin:14px 0 4px;font-size:12.5px;color:var(--ink-3);font-family:ui-monospace,monospace;font-weight:600}
ul.entries.flat{gap:2px;margin-top:6px}
ul.entries.flat .entry{border-left:none;padding-left:0;font-size:14px}
.dim{color:var(--ink-3);font-size:12px}
.ok{color:var(--done);font-weight:600}
.callout{background:var(--paper);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:10px;padding:14px 18px;margin-top:14px}
.callout p{margin:0 0 6px}
.callout p:last-child{margin:0}
.hidden{display:none !important}
footer{margin-top:56px;padding-top:20px;border-top:1px solid var(--line);color:var(--ink-3);font-size:13px}
@media (max-width:640px){ .folder{padding:16px} body{padding:0 14px 60px} }
</style>
</head>
<body>
<div class="wrap">

<header class="top">
  <p class="eyebrow">Visit Holy Korea · 문서 허브</p>
  <h1>무엇을 알고 싶은가부터 찾는다</h1>
  <p class="lede">각 폴더 README 의 &ldquo;확인하고 싶은 것 → 파일&rdquo; 표를 그대로 읽어 그린 목차다.
  손으로 고치지 않는다 — <code>npm run docs:hub</code> 를 다시 돌리면 표를 따라 갱신된다.</p>
  <p class="meta"><span>문서 <b>${docFiles.length}</b>개</span><span>합계 <b>${totalKb.toLocaleString()}</b> KB</span><span>폴더 <b>${sections.length}</b>개</span><span>생성 <b>${stamp}</b></span></p>
</header>

<div class="controls">
  <input type="search" id="q" placeholder="문서 이름·설명으로 찾기 (예: 도슨트, ADR, 공모전)" aria-label="문서 검색">
  <button class="chip" id="only-missing" aria-pressed="false">로컬 전용만</button>
  <button class="chip" id="theme">밝게 / 어둡게</button>
</div>

<section class="block">
  <h2>지금 상태</h2>
  <p class="sub">숫자의 원본은 <code>docs/이어서-할-일.md</code> 한 곳이다. 이 표는 거기서 읽어 온 것이라 따로 낡지 않는다.</p>
  <div class="callout">
    <p><b>오늘 뭘 해야 하나</b> → <a href="이어서-할-일.md">이어서-할-일.md</a> 의 「지금 최우선」</p>
    <p><b>지난 기록</b> → <a href="00-overview/일지/">00-overview/일지/</a> · <b>그날의 경위</b> → <a href="00-overview/인수인계/">00-overview/인수인계/</a></p>
  </div>
  <div class="scroll">${statusTables().map(renderTable).join('')}</div>
</section>

<section class="block">
  <h2>에이전트 작업 (T-번호)</h2>
  <p class="sub">원본은 <code>docs/70-agent-workspace/README.md</code> 의 표다. 지시서만 있고 개발기록이 없으면 아직 시작 전이다.</p>
  <div class="scroll"><table><thead><tr><th>번호</th><th>작업</th><th>담당</th><th>상태</th></tr></thead><tbody>
  ${tasks
    .map(
      (t) =>
        `<tr><td><a href="70-agent-workspace/README.md">${escapeHtml(
          t.id,
        )}</a></td><td>${escapeHtml(t.what)}</td><td>${escapeHtml(
          t.owner,
        )}</td><td><span class="badge ${statusClass(t.status)}">${escapeHtml(
          t.status,
        )}</span></td></tr>`,
    )
    .join('')}
  </tbody></table></div>
</section>

<section class="block">
  <h2>폴더별 문서</h2>
  <p class="sub">번호는 &ldquo;성격&rdquo;이다. 위 검색창에 입력하면 아래 항목이 걸러진다.</p>
  ${renderSections()}
</section>

<section class="block">
  <h2>🔒 저장소에 없는 문서를 가리키는 곳 — ${missing.length}종</h2>
  <p class="sub">창업 지원사업 서류·사업계획서는 <code>.gitignore</code> 로 로컬 전용이다.
  링크가 안 열려도 파일이 사라진 것이 아니다 — 사장님 노트북의 원래 작업 폴더에는 있다.</p>
  ${missing
    .map(
      (m) =>
        `<details><summary><code>${escapeHtml(m.path)}</code> <span class="dim">— ${
          m.from.length
        }곳에서 가리킴</span></summary><ul class="plain">${m.from
          .map((f) => `<li><a href="${escapeHtml(f)}">${escapeHtml(f)}</a></li>`)
          .join('')}</ul></details>`,
    )
    .join('')}
</section>

<section class="block">
  <h2>전체 문서 찾아보기</h2>
  <p class="sub">위 목차는 &ldquo;무엇을 알고 싶은가&rdquo;로 고른 것이라 묶음으로만 설명되는 문서는 빠진다.
  여기는 <b>${docFiles.length}개 전부</b>다. <span class="badge off">표에 없음</span> 은 폴더 README 표에 아직 한 줄이 없다는 뜻이다.</p>
  ${renderTree()}
</section>

<footer>
  <p><code>npm run docs:hub</code> 로 다시 만든다 · 생성기 <code>scripts/docs-hub.ts</code></p>
  <p>이 파일을 손으로 고치지 말 것 — 다음 실행에서 덮어써진다. 내용을 바꾸려면 각 폴더의 <code>README.md</code> 표를 고친다.</p>
</footer>

</div>
<script>
(function () {
  var q = document.getElementById('q');
  var onlyMissing = document.getElementById('only-missing');
  var theme = document.getElementById('theme');

  function apply() {
    var term = q.value.trim().toLowerCase();
    var missingOnly = onlyMissing.getAttribute('aria-pressed') === 'true';
    document.querySelectorAll('section.folder').forEach(function (folder) {
      var shown = 0;
      folder.querySelectorAll('li.entry').forEach(function (entry) {
        var hay = (entry.getAttribute('data-find') || '').toLowerCase();
        var ok = (!term || hay.indexOf(term) >= 0) &&
                 (!missingOnly || entry.classList.contains('missing'));
        entry.classList.toggle('hidden', !ok);
        if (ok) shown++;
      });
      folder.querySelectorAll('h3.group').forEach(function (heading) {
        var list = heading.nextElementSibling;
        var any = list && list.querySelector('li.entry:not(.hidden)');
        heading.classList.toggle('hidden', !any);
        if (list) list.classList.toggle('hidden', !any);
      });
      folder.classList.toggle('hidden', shown === 0);
    });

    // 전체 찾아보기 트리 — 검색 중에는 걸린 폴더를 자동으로 펼친다
    document.querySelectorAll('details.tree').forEach(function (tree) {
      var shown = 0;
      tree.querySelectorAll('li.entry').forEach(function (entry) {
        var hay = (entry.getAttribute('data-find') || '').toLowerCase();
        var ok = (!term || hay.indexOf(term) >= 0) && !missingOnly;
        entry.classList.toggle('hidden', !ok);
        if (ok) shown++;
      });
      tree.querySelectorAll('h4.sub-folder').forEach(function (heading) {
        var list = heading.nextElementSibling;
        var any = list && list.querySelector('li.entry:not(.hidden)');
        heading.classList.toggle('hidden', !any);
      });
      tree.classList.toggle('hidden', shown === 0);
      if (term) tree.open = shown > 0;
    });
  }

  q.addEventListener('input', apply);
  onlyMissing.addEventListener('click', function () {
    var on = onlyMissing.getAttribute('aria-pressed') === 'true';
    onlyMissing.setAttribute('aria-pressed', String(!on));
    apply();
  });
  theme.addEventListener('click', function () {
    var root = document.documentElement;
    var dark = getComputedStyle(root).getPropertyValue('--bg').trim().indexOf('#0F') === 0;
    root.setAttribute('data-theme', dark ? 'light' : 'dark');
  });
})();
</script>
</body>
</html>
`;

writeFileSync(OUT, html, 'utf8');

// ─────────────────────────────────────────────────────────── 마크다운 그리기

/**
 * 마크다운 표 칸.
 *
 * 원본이 이미 마크다운이므로 백틱·굵게 표기는 **그대로 둔다** (HTML 판과 달리 그대로 렌더된다).
 * 칸 안의 `|` 와 줄바꿈만 표를 깨뜨리므로 그 둘을 손본다.
 */
function cell(text: string): string {
  return text.replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|');
}

/** `docs/DSH/문서 허브.md` 기준 링크. 공백·한글이 있어도 열리게 인코딩한다. */
function mdLink(label: string, docsPath: string): string {
  const safe = docsPath
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `[${label.replace(/([[\]])/g, '\\$1')}](../${safe})`;
}

function mdTable(table: Table): string {
  const [header, ...rows] = table.rows;
  if (!header) return '';
  const width = header.length;
  const line = (cells: string[]): string => {
    const padded = [...cells];
    while (padded.length < width) padded.push('');
    return `| ${padded.slice(0, width).map(cell).join(' | ')} |`;
  };
  return [line(header), `| ${header.map(() => '---').join(' | ')} |`, ...rows.map(line)].join('\n');
}

/**
 * 폴더 README 와 같은 두 칸 표의 한 줄을 만든다 — `| 확인하고 싶은 것 | 파일 |`.
 *
 * **원시 HTML(`<sub>`·`<details>`)을 쓰지 않는다.** 넣으면 편집기가
 * "HTML/JSX/MDX 가 들어 있어 코드 모드에서만 편집할 수 있습니다" 하고 렌더를 포기한다
 * (2026-09-14 실측). 사람이 보라고 만든 문서가 코드로 보이면 뜻이 없다.
 *
 * 링크 글자는 폴더 README 관례대로 **docs/ 기준 경로**를 그대로 쓴다.
 */
function mdRow(entry: Entry): string {
  const label = cell(entry.label);
  const note = cell(entry.note);
  const tail = note ? ` — ${note}` : '';

  if (entry.missing) {
    return `| ${label} | \`${cell(entry.rawPath)}\` 🔒 **로컬 전용 · 저장소에 없음**${tail} |`;
  }
  if (entry.outside) {
    // docs/ 밖 파일은 한 단계 더 올라간다
    const repoPath = (entry.href ?? '').replace(/^\.\.\//, '');
    return `| ${label} | [${cell(repoPath)}](../../${repoPath})${tail} |`;
  }
  const path = entry.href ?? '';
  return `| ${label} | ${mdLink(path, path)}${tail} |`;
}

const md: string[] = [
  '# 문서 허브',
  '',
  '> 🤖 **이 파일은 `npm run docs:hub` 이 만들어 낸다. 손으로 고치지 말 것** — 다음 실행에서 덮어써진다.',
  '> 내용을 바꾸려면 각 폴더의 `README.md` 안 「확인하고 싶은 것 → 파일」 표를 고친다.',
  '> 브라우저로 보는 판은 `docs/index.html` (검색·필터·다크모드). 생성기는 `scripts/docs-hub.ts`.',
  '',
  `생성 **${stamp}** · 문서 **${docFiles.length}개** · 합계 **${totalKb.toLocaleString()} KB** · 폴더 **${sections.length}개**`,
  '',
  '| 알고 싶은 것 | 어디로 |',
  '| --- | --- |',
  `| 오늘 뭘 해야 하나 | ${mdLink('이어서-할-일.md', '이어서-할-일.md')} 의 「지금 최우선」 |`,
  `| 지난 기록 | ${mdLink('00-overview/일지/', '00-overview/일지')} |`,
  `| 그날의 경위 | ${mdLink('00-overview/인수인계/', '00-overview/인수인계')} |`,
  '',
  '---',
  '',
  '## 지금 상태',
  '',
  '숫자의 원본은 `docs/이어서-할-일.md` 한 곳이다. 이 표는 거기서 읽어 온 것이라 따로 낡지 않는다.',
  '',
  ...statusTables().flatMap((t) => [mdTable(t), '']),
  '---',
  '',
  '## 에이전트 작업 (T-번호)',
  '',
  '원본은 `docs/70-agent-workspace/README.md` 의 표다. 지시서만 있고 개발기록이 없으면 아직 시작 전이다.',
  '',
  '| 번호 | 작업 | 담당 | 상태 |',
  '| --- | --- | --- | --- |',
  ...tasks.map((t) => `| ${cell(t.id)} | ${cell(t.what)} | ${cell(t.owner)} | ${cell(t.status)} |`),
  '',
  '---',
  '',
  '## 폴더별 문서',
  '',
  ...sections.flatMap((section) => [
    `### ${cell(section.title)}`,
    '',
    `\`docs/${section.folder}/\`${section.blurb ? ` — ${cell(section.blurb)}` : ''}`,
    '',
    ...section.groups.flatMap((group) => [
      `**${cell(group.heading)}**`,
      '',
      '| 확인하고 싶은 것 | 파일 |',
      '| --- | --- |',
      ...group.entries.map(mdRow),
      '',
    ]),
  ]),
  '---',
  '',
  `## 🔒 저장소에 없는 문서를 가리키는 곳 — ${missing.length}종`,
  '',
  '창업 지원사업 서류·사업계획서는 `.gitignore` 로 로컬 전용이다.',
  '**링크가 안 열려도 파일이 사라진 것이 아니다** — 원래 작업 폴더(노트북)에는 있다.',
  '',
  '| 없는 경로 | 가리키는 곳 |',
  '| --- | --- |',
  ...missing.map(
    (m) => `| \`${m.path}\` | ${m.from.length}곳 — ${m.from.map((f) => `\`${f}\``).join(', ')} |`,
  ),
  '',
  '---',
  '',
  '## 전체 문서 찾아보기',
  '',
  `위 목차는 "무엇을 알고 싶은가"로 고른 것이라 묶음으로만 설명되는 문서는 빠진다. 여기는 **${docFiles.length}개 전부**다.`,
  '`표에 없음` 은 폴더 README 표에 아직 한 줄이 없다는 뜻이다.',
  '',
];

{
  const byFolder = new Map<string, DocFile[]>();
  for (const file of docFiles) {
    if (file.name === '.gitkeep') continue;
    const top = file.folder || '(최상위)';
    const list = byFolder.get(top) ?? [];
    list.push(file);
    byFolder.set(top, list);
  }
  for (const [top, files] of byFolder) {
    // `<details>` 로 접으면 편집기가 이 파일을 HTML 로 보고 렌더를 포기한다 (mdRow 주석 참고)
    md.push(`### ${top} — ${files.length}개`, '');
    md.push('| 파일 | 크기 | 메모 |', '| --- | --- | --- |');
    for (const file of files) {
      const mark = file.listed ? '' : '*표에 없음*';
      md.push(`| ${mdLink(file.path, file.path)} | ${file.kb}KB | ${mark} |`);
    }
    md.push('');
  }
}

md.push('---', '', '`npm run docs:hub` 로 다시 만든다 · 생성기 `scripts/docs-hub.ts`', '');

const markdown = md.join('\n');

/**
 * 마크다운 판에 원시 HTML 이 섞이면 편집기가 렌더를 포기하고 코드로만 보여준다
 * ("HTML, JSX 또는 MDX가 포함되어 있으므로 코드 모드에서만 편집할 수 있습니다").
 * 사람이 보라고 만든 문서라 그건 실패다. 다시 섞이면 바로 알아채도록 재어 둔다.
 */
const RAW_HTML = /<\/?[a-zA-Z][a-zA-Z0-9]*[\s/>]/;
// 백틱 안의 `<details>` 는 글자일 뿐 HTML 이 아니다. 코드 구간을 걷어내고 잰다 —
// 안 그러면 "HTML 쓰지 말 것"이라고 적은 문장 자체가 경고에 걸린다.
const hasRawHtml = RAW_HTML.test(markdown.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, ''));

writeFileSync(OUT_MD, markdown, 'utf8');

console.log(`문서 허브를 만들었습니다 → ${relative(ROOT, OUT)}`);
console.log(`                        → ${relative(ROOT, OUT_MD)}`);

/**
 * `npm run docs` 로 만들고 바로 연다.
 *
 * 마크다운 판은 편집기·Orca 에서 원본 글자로만 보인다(GitHub 웹에서만 렌더된다).
 * 사람이 눈으로 볼 판은 `index.html` 인데, 매번 탐색기에서 찾아 여는 게 번거로워
 * 기본 브라우저로 띄우는 길을 둔다.
 */
function openInBrowser(target: string): void {
  const url = pathToFileURL(target).href;
  const [command, args] =
    process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', url]]
      : process.platform === 'darwin'
        ? ['open', [url]]
        : ['xdg-open', [url]];

  const child = spawn(command, args, { detached: true, stdio: 'ignore' });
  // 브라우저가 없는 환경(CI·웹 세션)에서 생성까지 실패로 만들지 않는다
  child.on('error', () => {
    console.log(`  브라우저를 열지 못했습니다. 직접 여세요 → ${url}`);
  });
  child.unref();
}

console.log(`  문서 ${docFiles.length}개 · 폴더 ${sections.length}개 · 작업 ${tasks.length}건`);
if (missing.length > 0) {
  console.log(`  ⚠️ 저장소에 없는 경로를 가리키는 참조 ${missing.length}종 (허브에 배지로 표시)`);
}
const unlisted = docFiles.filter((f) => !f.listed && f.name !== '.gitkeep');
console.log(
  `  폴더 README 표에 오른 문서 ${docFiles.length - unlisted.length}개 · 표에 없는 문서 ${unlisted.length}개`,
);
console.log('  (표에 없는 문서도 허브의 「전체 문서 찾아보기」 에서 이름으로 찾을 수 있습니다)');

if (hasRawHtml) {
  console.log(
    '\n  🔴 마크다운 판에 원시 HTML 이 섞였습니다 — 편집기가 "코드 모드"로만 열게 됩니다.',
  );
  console.log('     `<details>`·`<sub>` 같은 태그를 쓰지 말고 순수 마크다운으로 바꾸세요.');
}

if (process.argv.includes('--open')) {
  console.log(`\n브라우저로 엽니다 → ${pathToFileURL(OUT).href}`);
  openInBrowser(OUT);
} else {
  console.log(
    '\n눈으로 보려면 → npm run docs   (검색·필터가 되는 docs/index.html 을 브라우저로 연다)',
  );
  console.log(
    '마크다운 판(docs/DSH/문서-허브.md)은 순수 마크다운이라 GitHub·미리보기에서 표로 보인다.',
  );
}

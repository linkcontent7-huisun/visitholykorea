// node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BIBLE_NAMES, NAME_MAX, cleanName, initialName, isSelfName, randomPilgrimName } from '../src/pilgrim-name.ts';

const store = (o: Record<string, string>) => ({ getItem: (k: string) => (k in o ? o[k]! : null) });

test('계정 이름이 있으면 칸에 넣는다', () => {
  assert.equal(initialName(store({ 'vhk.pilgrimName': '마리아' })), '마리아');
});
test('계정 이름이 없으면 전에 쓴 이름, 그것도 없으면 빈칸', () => {
  assert.equal(initialName(store({ 'vhk.nick': '요셉' })), '요셉');
  assert.equal(initialName(store({})), '');
  assert.equal(initialName(null), '');
});
test('3D 칸에서 직접 고친 이름이 계정 이름보다 먼저', () => {
  assert.equal(initialName(store({ 'vhk.pilgrimName': '마리아', 'vhk.nick': '데레사', 'vhk.nickSelf': '1' })), '데레사');
  // 고친 적 없이 전에 계정 이름으로 들어갔으면 계정 이름(계정에서 이름을 바꾸면 따라간다)
  assert.equal(initialName(store({ 'vhk.pilgrimName': '마리아 막달레나', 'vhk.nick': '마리아' })), '마리아 막달레나');
});
test('9자 넘음·이상한 글자는 3D 규칙으로 다듬는다', () => {
  assert.equal(cleanName('가나다라마바사아자차카'), '가나다라마바사아자');
  assert.equal(cleanName('<b>안나</b>!!😀'), 'b안나b');
  assert.equal(cleanName('  안   나  '), '안 나');
  assert.equal(initialName(store({ 'vhk.pilgrimName': '🙏🙏' })), '');
});
test('저장소가 오류를 내도 멈추지 않는다', () => {
  assert.equal(initialName({ getItem: () => { throw new Error('막힘'); } }), '');
});
test('입장할 때 계정 이름과 같으면 직접 고친 것이 아니다', () => {
  const s = store({ 'vhk.pilgrimName': '마리아' });
  assert.equal(isSelfName('마리아', s), false);
  assert.equal(isSelfName('데레사', s), true);
  assert.equal(isSelfName('요셉', store({})), true);
});

test('무작위 이름은 성경 인물이고 9자를 넘지 않으며 별칭 규칙에 맞는다', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 2000; i++) {
    const n = randomPilgrimName();
    assert.ok(n.length >= 1 && n.length <= NAME_MAX, n);
    assert.equal(cleanName(n), n, `별칭 규칙에 맞아야 한다: ${n}`);
    assert.ok(BIBLE_NAMES.some((b) => n === b || n.startsWith(`${b} `)), n);
    seen.add(n);
  }
  assert.ok(seen.size > 40, `다양해야 한다(${seen.size})`);
  assert.ok([...seen].some((n) => n.includes(' ')), '덧말이 붙는 이름도 나와야 한다');
});
test('무작위 이름 목록에 열두 사도와 예언자·사제가 들어 있다', () => {
  for (const n of ['베드로', '안드레아', '야고보', '요한', '필립보', '바르톨로메오', '토마스', '마태오', '타대오', '시몬', '마티아', '이사야', '엘리야', '아론']) assert.ok(BIBLE_NAMES.includes(n), n);
});

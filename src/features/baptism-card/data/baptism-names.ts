/**
 * 세례명 카드 43종의 언어별 표기. design/세례명-공유카드/export_to_app.py 가 만든 파일이라 손으로 고치지 않는다.
 * 영어 외 표기는 검수 전이다(가톨릭 용어는 신자·번역자 확인 필요).
 */
import type { Language } from '@/shared/i18n/dictionary';

export interface BaptismName {
  /** 카드 이미지 파일 이름(영어 세례명) */
  slug: string;
  names: Record<Language, string>;
}

export const BAPTISM_NAMES: readonly BaptismName[] = [
  { slug: 'Charles', names: { ko: '가롤로', en: 'Charles', es: 'Carlos', fr: 'Charles', pt: 'Carlos', it: 'Carlo' } },
  { slug: 'Catherine', names: { ko: '가타리나', en: 'Catherine', es: 'Catalina', fr: 'Catherine', pt: 'Catarina', it: 'Caterina' } },
  { slug: 'Columba', names: { ko: '골룸바', en: 'Columba', es: 'Columba', fr: 'Colombe', pt: 'Columba', it: 'Colomba' } },
  { slug: 'Damian', names: { ko: '다미아노', en: 'Damian', es: 'Damián', fr: 'Damien', pt: 'Damião', it: 'Damiano' } },
  { slug: 'Teresa', names: { ko: '데레사', en: 'Teresa', es: 'Teresa', fr: 'Thérèse', pt: 'Teresa', it: 'Teresa' } },
  { slug: 'Lawrence', names: { ko: '라우렌시오', en: 'Lawrence', es: 'Lorenzo', fr: 'Laurent', pt: 'Lourenço', it: 'Lorenzo' } },
  { slug: 'Rose', names: { ko: '로사', en: 'Rose', es: 'Rosa', fr: 'Rose', pt: 'Rosa', it: 'Rosa' } },
  { slug: 'Louis', names: { ko: '루도비코', en: 'Louis', es: 'Luis', fr: 'Louis', pt: 'Luís', it: 'Luigi' } },
  { slug: 'Lucy', names: { ko: '루치아', en: 'Lucy', es: 'Lucía', fr: 'Lucie', pt: 'Luzia', it: 'Lucia' } },
  { slug: 'Luke', names: { ko: '루카', en: 'Luke', es: 'Lucas', fr: 'Luc', pt: 'Lucas', it: 'Luca' } },
  { slug: 'Mark', names: { ko: '마르코', en: 'Mark', es: 'Marcos', fr: 'Marc', pt: 'Marcos', it: 'Marco' } },
  { slug: 'Martha', names: { ko: '마르타', en: 'Martha', es: 'Marta', fr: 'Marthe', pt: 'Marta', it: 'Marta' } },
  { slug: 'Mary', names: { ko: '마리아', en: 'Mary', es: 'María', fr: 'Marie', pt: 'Maria', it: 'Maria' } },
  { slug: 'Magdalene', names: { ko: '막달레나', en: 'Magdalene', es: 'Magdalena', fr: 'Madeleine', pt: 'Madalena', it: 'Maddalena' } },
  { slug: 'Barbara', names: { ko: '바르바라', en: 'Barbara', es: 'Bárbara', fr: 'Barbe', pt: 'Bárbara', it: 'Barbara' } },
  { slug: 'Bartholomew', names: { ko: '바르톨로메오', en: 'Bartholomew', es: 'Bartolomé', fr: 'Barthélemy', pt: 'Bartolomeu', it: 'Bartolomeo' } },
  { slug: 'Paul', names: { ko: '바오로', en: 'Paul', es: 'Pablo', fr: 'Paul', pt: 'Paulo', it: 'Paolo' } },
  { slug: 'Benedicta', names: { ko: '베네딕타', en: 'Benedicta', es: 'Benedicta', fr: 'Bénédicte', pt: 'Benedita', it: 'Benedetta' } },
  { slug: 'Peter', names: { ko: '베드로', en: 'Peter', es: 'Pedro', fr: 'Pierre', pt: 'Pedro', it: 'Pietro' } },
  { slug: 'Sebastian', names: { ko: '세바스티아노', en: 'Sebastian', es: 'Sebastián', fr: 'Sébastien', pt: 'Sebastião', it: 'Sebastiano' } },
  { slug: 'Susanna', names: { ko: '수산나', en: 'Susanna', es: 'Susana', fr: 'Suzanne', pt: 'Susana', it: 'Susanna' } },
  { slug: 'Stephen', names: { ko: '스테파노', en: 'Stephen', es: 'Esteban', fr: 'Étienne', pt: 'Estêvão', it: 'Stefano' } },
  { slug: 'Simeon', names: { ko: '시메온', en: 'Simeon', es: 'Simeón', fr: 'Siméon', pt: 'Simeão', it: 'Simeone' } },
  { slug: 'Agatha', names: { ko: '아가타', en: 'Agatha', es: 'Águeda', fr: 'Agathe', pt: 'Ágata', it: 'Agata' } },
  { slug: 'Agnes', names: { ko: '아녜스', en: 'Agnes', es: 'Inés', fr: 'Agnès', pt: 'Inês', it: 'Agnese' } },
  { slug: 'Augustine', names: { ko: '아우구스티노', en: 'Augustine', es: 'Agustín', fr: 'Augustin', pt: 'Agostinho', it: 'Agostino' } },
  { slug: 'Anne', names: { ko: '안나', en: 'Anne', es: 'Ana', fr: 'Anne', pt: 'Ana', it: 'Anna' } },
  { slug: 'Andrew', names: { ko: '안드레아', en: 'Andrew', es: 'Andrés', fr: 'André', pt: 'André', it: 'Andrea' } },
  { slug: 'Anthony', names: { ko: '안토니오', en: 'Anthony', es: 'Antonio', fr: 'Antoine', pt: 'António', it: 'Antonio' } },
  { slug: 'Alexis', names: { ko: '알렉시오', en: 'Alexis', es: 'Alejo', fr: 'Alexis', pt: 'Aleixo', it: 'Alessio' } },
  { slug: 'James', names: { ko: '야고보', en: 'James', es: 'Santiago', fr: 'Jacques', pt: 'Tiago', it: 'Giacomo' } },
  { slug: 'Elizabeth', names: { ko: '엘리사벳', en: 'Elizabeth', es: 'Isabel', fr: 'Élisabeth', pt: 'Isabel', it: 'Elisabetta' } },
  { slug: 'Joseph', names: { ko: '요셉', en: 'Joseph', es: 'José', fr: 'Joseph', pt: 'José', it: 'Giuseppe' } },
  { slug: 'John', names: { ko: '요한', en: 'John', es: 'Juan', fr: 'Jean', pt: 'João', it: 'Giovanni' } },
  { slug: 'Justus', names: { ko: '유스토', en: 'Justus', es: 'Justo', fr: 'Juste', pt: 'Justo', it: 'Giusto' } },
  { slug: 'Juliette', names: { ko: '율리에타', en: 'Juliette', es: 'Julieta', fr: 'Juliette', pt: 'Julieta', it: 'Giulietta' } },
  { slug: 'Ignatius', names: { ko: '이냐시오', en: 'Ignatius', es: 'Ignacio', fr: 'Ignace', pt: 'Inácio', it: 'Ignazio' } },
  { slug: 'Cecilia', names: { ko: '체칠리아', en: 'Cecilia', es: 'Cecilia', fr: 'Cécile', pt: 'Cecília', it: 'Cecilia' } },
  { slug: 'Thomas', names: { ko: '토마스', en: 'Thomas', es: 'Tomás', fr: 'Thomas', pt: 'Tomás', it: 'Tommaso' } },
  { slug: 'Perpetua', names: { ko: '페르페투아', en: 'Perpetua', es: 'Perpetua', fr: 'Perpétue', pt: 'Perpétua', it: 'Perpetua' } },
  { slug: 'Francis', names: { ko: '프란치스코', en: 'Francis', es: 'Francisco', fr: 'François', pt: 'Francisco', it: 'Francesco' } },
  { slug: 'Protase', names: { ko: '프로타시오', en: 'Protase', es: 'Protasio', fr: 'Protais', pt: 'Protásio', it: 'Protasio' } },
  { slug: 'Henry', names: { ko: '헨리코', en: 'Henry', es: 'Enrique', fr: 'Henri', pt: 'Henrique', it: 'Enrico' } },
];

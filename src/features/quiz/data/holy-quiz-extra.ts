import type { HolyQuiz } from './holy-quiz';

type Pair = [ko: string, en: string];

function q(
  id: string,
  question: Pair,
  choices: [Pair, Pair, Pair, Pair],
  answer: number,
  hint: Pair,
  explanation: Pair,
): HolyQuiz {
  const text = ([ko, en]: Pair) => ({ ko, en });
  return {
    id,
    question: text(question),
    choices: choices.map(text),
    answer,
    hint: text(hint),
    explanation: text(explanation),
  };
}

/**
 * 퀴즈 11~40번. 문제·정답·해설은 docs/40-knowledge (박해 사건·주요 순교자·시성과 시복 문서)에
 * 적힌 내용에서만 가져왔다(2026-10-29). 문서에 없는 내용은 넣지 않았다.
 */
export const EXTRA_QUIZZES: HolyQuiz[] = [
  q(
    'grammont',
    ['1784년 북경에서 이승훈에게 세례를 준 신부는?', 'Which priest baptized Yi Seung-hun in Beijing in 1784?'],
    [
      ['그라몽 신부', 'Fr. de Grammont'],
      ['주문모 신부', 'Fr. Zhou Wenmo'],
      ['모방 신부', 'Fr. Maubant'],
      ['구베아 주교', 'Bishop de Gouvea'],
    ],
    0,
    ['북경 북천주당의 예수회 선교사였습니다.', 'He was a Jesuit missionary at the North Church in Beijing.'],
    [
      '이승훈은 북천주당에서 선교사들과 필담으로 교리를 배우고, 1784년 그라몽 신부에게 세례를 받았습니다.',
      'Yi Seung-hun studied doctrine by written conversation at the North Church and was baptized by Fr. de Grammont in 1784.',
    ],
  ),
  q(
    'peter-meaning',
    ['이승훈이 받은 세례명 「베드로」에 담긴 뜻은?', 'What meaning lay behind the baptismal name “Peter” given to Yi Seung-hun?'],
    [
      ['빛', 'Light'],
      ['반석(주춧돌)', 'Rock (cornerstone)'],
      ['평화', 'Peace'],
      ['사랑', 'Love'],
    ],
    1,
    ['조선 교회의 기초가 되라는 뜻이었습니다.', 'It meant he should be the foundation of the Church in Joseon.'],
    [
      '「조선 교회의 주춧돌(반석)이 되라」는 뜻에서 베드로라는 세례명을 받았습니다.',
      'He was given the name Peter, meaning “be the rock (cornerstone) of the Church in Joseon.”',
    ],
  ),
  q(
    'yi-byeok',
    ['조선 천주교회 창립 성조의 한 사람인 이벽 요한 세례자의 호는?', 'What was the pen name of Yi Byeok (John the Baptist), a founding father of the Church in Joseon?'],
    [
      ['다산', 'Dasan'],
      ['광암', 'Gwangam'],
      ['고산', 'Gosan'],
      ['추사', 'Chusa'],
    ],
    1,
    ['이승훈에게 북경에 가서 세례를 받으라고 권한 사람입니다.', 'He urged Yi Seung-hun to go to Beijing and be baptized.'],
    [
      '이벽의 호는 광암입니다. 천진암·주어사에서 서학을 연구하는 강학회를 열었고, 이승훈의 북경행을 권했습니다.',
      'Yi Byeok’s pen name was Gwangam. He held study circles on Western learning at Cheonjinam and Jueosa and urged Yi Seung-hun to go to Beijing.',
    ],
  ),
  q(
    'jugyo-yoji',
    ['한글 교리서 『주교요지』를 쓴 사람은?', 'Who wrote the Korean-language catechism “Jugyo Yoji”?'],
    [
      ['정약종 아우구스티노', 'Augustine Jeong Yak-jong'],
      ['정하상 바오로', 'Paul Jeong Ha-sang'],
      ['황사영 알렉시오', 'Alexius Hwang Sa-yeong'],
      ['이벽 요한', 'John Yi Byeok'],
    ],
    0,
    ['명도회의 회장이었고, 정약용의 형입니다.', 'He led the Myeongdohoe and was the elder brother of Jeong Yak-yong.'],
    [
      '정약종은 한문을 모르는 백성과 부녀자도 읽을 수 있도록 쉬운 한글로 『주교요지』를 썼습니다.',
      'Jeong Yak-jong wrote Jugyo Yoji in plain Hangul so that commoners and women who did not know Chinese characters could read it.',
    ],
  ),
  q(
    'leo-xii',
    ['1825년 정하상이 조선에 독립된 교구를 세워 달라고 편지를 보낸 교황은?', 'To which pope did Jeong Ha-sang write in 1825, asking for an independent diocese in Joseon?'],
    [
      ['비오 11세', 'Pius XI'],
      ['바오로 6세', 'Paul VI'],
      ['레오 12세', 'Leo XII'],
      ['요한 바오로 2세', 'John Paul II'],
    ],
    2,
    ['19세기 초의 교황입니다.', 'He was a pope of the early 19th century.'],
    [
      '정하상은 여러 차례 북경을 오가며 노력했고, 1825년 레오 12세 교황에게 직접 서한을 보냈습니다.',
      'Jeong Ha-sang travelled to Beijing many times and in 1825 wrote directly to Pope Leo XII.',
    ],
  ),
  q(
    'vicariate-1831',
    ['정하상 등의 노력으로 조선대목구(독립된 교구)가 설정된 해는?', 'In what year was the Vicariate of Joseon established, thanks to the efforts of Jeong Ha-sang and others?'],
    [
      ['1784년', '1784'],
      ['1801년', '1801'],
      ['1831년', '1831'],
      ['1866년', '1866'],
    ],
    2,
    ['신유박해 뒤 30년쯤 지난 때입니다.', 'About thirty years after the Sinyu Persecution.'],
    [
      '1831년 조선대목구가 승인되어 파리외방전교회 선교사들이 조선에 들어올 길이 열렸습니다.',
      'The Vicariate of Joseon was approved in 1831, opening the way for Paris Foreign Missions priests to enter Korea.',
    ],
  ),
  q(
    'imbert-surrender',
    ['기해박해 때 앵베르 주교가 신자들의 피해를 막으려고 한 일은?', 'During the Gihae Persecution, what did Bishop Imbert do to spare the faithful further harm?'],
    [
      ['외국으로 피신했다', 'He fled abroad'],
      ['스스로 관아에 자수했다', 'He gave himself up to the authorities'],
      ['임금에게 상소를 올렸다', 'He petitioned the king'],
      ['깊은 산속에 숨었다', 'He hid deep in the mountains'],
    ],
    1,
    ['자신을 숨겨 준 사람들이 다치지 않게 하려는 선택이었습니다.', 'He did not want those who sheltered him to suffer.'],
    [
      '앵베르 주교는 모방·샤스탕 신부에게도 자수를 권했고, 세 사람은 체포되어 새남터에서 순교했습니다.',
      'Bishop Imbert urged Frs. Maubant and Chastan to surrender too; all three were arrested and martyred at Saenamteo.',
    ],
  ),
  q(
    'yu-daecheol',
    ['103위 성인 가운데 가장 나이 어린 소년 순교자 유대철 베드로는 몇 살에 순교했을까?', 'How old was Peter Yu Dae-cheol, the youngest of the 103 saints, when he was martyred?'],
    [
      ['9살', '9'],
      ['13살', '13'],
      ['17살', '17'],
      ['20살', '20'],
    ],
    1,
    ['지금으로 치면 중학교 1학년쯤입니다.', 'About the age of a first-year middle school student.'],
    [
      '유대철은 1839년 기해박해 때 스스로 관아에 자수했고, 혹독한 고문에도 신앙을 지켜 13세에 순교했습니다.',
      'Yu Dae-cheol gave himself up during the 1839 Gihae Persecution and held to his faith through harsh torture, dying at 13.',
    ],
  ),
  q(
    'yu-jingil',
    ['유대철의 아버지 유진길은 어떤 일을 하던 사람이었을까?', 'What was the occupation of Yu Jin-gil, father of Yu Dae-cheol?'],
    [
      ['역관(통역관)', 'Interpreter'],
      ['농부', 'Farmer'],
      ['의원', 'Physician'],
      ['승지', 'Royal secretary'],
    ],
    0,
    ['조선 교회와 북경 교회를 잇는 데 도움이 된 직업입니다.', 'A job that helped link the Churches of Joseon and Beijing.'],
    [
      '유진길은 역관 출신으로 조선 교회와 북경 교회를 잇고 성직자 영입 운동에 기여했으며, 같은 박해 때 참수형으로 순교했습니다.',
      'Yu Jin-gil, an interpreter, linked the Joseon and Beijing Churches and helped bring in clergy; he was beheaded in the same persecution.',
    ],
  ),
  q(
    'yun-seondo',
    ['윤지충은 어느 유명한 시인(문신)의 6대손일까?', 'Yun Ji-chung was a sixth-generation descendant of which famous poet-scholar?'],
    [
      ['고산 윤선도', 'Gosan Yun Seon-do'],
      ['다산 정약용', 'Dasan Jeong Yak-yong'],
      ['율곡 이이', 'Yulgok Yi I'],
      ['추사 김정희', 'Chusa Kim Jeong-hui'],
    ],
    0,
    ['「어부사시사」를 지은 분으로 알려져 있습니다.', 'Known as the author of “Eobu Sasisa.”'],
    [
      '윤지충은 전라도 진산 출신의 양반으로 고산 윤선도의 6대손이었고, 1783년 진사시에 합격한 지식인이었습니다.',
      'Yun Ji-chung, a yangban from Jinsan, was a sixth-generation descendant of Yun Seon-do and passed the jinsa exam in 1783.',
    ],
  ),
  q(
    'first-executed',
    ['윤지충과 권상연은 한국 천주교회에서 어떤 최초의 기록을 갖고 있을까?', 'What “first” do Yun Ji-chung and Kwon Sang-yeon hold in the history of the Church in Korea?'],
    [
      ['최초의 사제', 'The first priests'],
      ['최초의 주교', 'The first bishops'],
      ['최초의 영세자', 'The first baptized'],
      ['공식적으로 처형된 최초의 순교자', 'The first officially executed martyrs'],
    ],
    3,
    ['1791년 신해박해(진산사건) 때의 일입니다.', 'This happened in the Sinhae Persecution of 1791.'],
    [
      '두 사람은 한국 천주교회 역사상 공식적으로 처형된 최초의 순교자이며, 2014년 나란히 복자품에 올랐습니다.',
      'They were the first martyrs officially executed in the history of the Korean Church, and were beatified together in 2014.',
    ],
  ),
  q(
    'kang-wansuk',
    ['조선 천주교회 최초의 여성 회장 강완숙은 중국인 주문모 신부를 몇 년 동안 숨겨 주었을까?', 'For how many years did Kang Wan-suk, the first woman leader of the Joseon Church, hide the Chinese priest Zhou Wenmo?'],
    [
      ['1년', '1 year'],
      ['3년', '3 years'],
      ['약 6년', 'About 6 years'],
      ['10년', '10 years'],
    ],
    2,
    ['1795년부터 1801년까지입니다.', 'From 1795 to 1801.'],
    [
      '1795년 을묘박해 뒤 강완숙은 주문모 신부를 자기 집에 숨기고 약 6년간 사목 활동을 도왔습니다.',
      'After the 1795 Eulmyo persecution, Kang Wan-suk hid Fr. Zhou in her home and supported his ministry for about six years.',
    ],
  ),
  q(
    'zhou-wenmo',
    ['1795년 조선에 들어온 최초의 사제 주문모 신부는 어느 나라 사람일까?', 'Fr. Zhou Wenmo, the first priest to enter Joseon in 1795, was from which country?'],
    [
      ['프랑스', 'France'],
      ['중국', 'China'],
      ['일본', 'Japan'],
      ['포르투갈', 'Portugal'],
    ],
    1,
    ['북경교구 주교가 파견했습니다.', 'He was sent by the Bishop of Beijing.'],
    [
      '중국인 주문모 신부는 북경교구 구베아 주교의 파견으로 1795년 1월 서울에 도착했습니다.',
      'The Chinese priest Zhou Wenmo reached Seoul in January 1795, sent by Bishop de Gouvea of Beijing.',
    ],
  ),
  q(
    'baeron',
    ['황사영이 숨어서 「백서」를 쓴 충청도의 옹기 마을 토굴이 있는 곳은?', 'Where is the potters’ village cave in which Hwang Sa-yeong hid and wrote his “Silk Letter”?'],
    [
      ['배론', 'Baeron'],
      ['솔뫼', 'Solmoe'],
      ['미리내', 'Mirinae'],
      ['초남이', 'Chonam-i'],
    ],
    0,
    ['충북 제천에 있는 성지입니다.', 'It is a shrine in Jecheon, North Chungcheong.'],
    [
      '신유박해 때 황사영은 제천 배론의 토굴에 숨어 북경 주교에게 박해의 실상을 알리는 밀서를 썼습니다.',
      'During the Sinyu Persecution, Hwang Sa-yeong hid in a cave at Baeron in Jecheon and wrote a secret letter to the Bishop of Beijing.',
    ],
  ),
  q(
    'silk-letter',
    ['황사영 백서는 흰 비단에 약 몇 자를 깨알같이 적은 것일까?', 'Roughly how many characters were written on the white silk of Hwang Sa-yeong’s Silk Letter?'],
    [
      ['300자', '300'],
      ['1,300자', '1,300'],
      ['1만 3천여 자', 'Over 13,000'],
      ['10만 자', '100,000'],
    ],
    2,
    ['가로 38cm, 세로 62cm의 비단입니다.', 'The silk measured 38 cm by 62 cm.'],
    [
      '가로 38cm·세로 62cm 비단에 1만 3천여 자를 적었지만, 북경으로 전달되기 전에 발각되었습니다.',
      'Over 13,000 characters were written on a 38 × 62 cm silk, but it was discovered before reaching Beijing.',
    ],
  ),
  q(
    'solmoe',
    ['김대건 신부가 태어난 곳으로, 오늘날 충남 당진에 있는 성지는?', 'Which shrine in present-day Dangjin, South Chungcheong, is the birthplace of Fr. Andrew Kim?'],
    [
      ['솔뫼', 'Solmoe'],
      ['미리내', 'Mirinae'],
      ['배론', 'Baeron'],
      ['초남이', 'Chonam-i'],
    ],
    0,
    ['소나무 산이라는 뜻의 이름입니다.', 'The name means “pine hill.”'],
    [
      '김대건은 1821년 8월 21일 충청도 솔뫼(현 당진시 우강면)의 천주교 집안에서 태어났습니다.',
      'Andrew Kim was born on 21 August 1821 into a Catholic family at Solmoe (now Ugang-myeon, Dangjin).',
    ],
  ),
  q(
    'mirinae',
    ['김대건 신부의 유해가 안장된 곳으로, 경기도 안성에 있는 성지는?', 'Which shrine in Anseong, Gyeonggi Province, holds the remains of Fr. Andrew Kim?'],
    [
      ['절두산', 'Jeoldusan'],
      ['해미', 'Haemi'],
      ['서소문', 'Seosomun'],
      ['미리내', 'Mirinae'],
    ],
    3,
    ['「용의 내」, 곧 은하수를 뜻하는 순우리말 이름입니다.', 'Its name is a native Korean word for the Milky Way.'],
    [
      '안성 미리내성지에 김대건 신부의 유해가 모셔져 있습니다.',
      'The remains of Fr. Andrew Kim rest at Mirinae Shrine in Anseong.',
    ],
  ),
  q(
    'maubant-students',
    ['1836년 김대건 등 신학생 세 명을 뽑아 마카오로 유학 보낸 선교사는?', 'Which missionary chose three seminarians, including Andrew Kim, and sent them to Macau in 1836?'],
    [
      ['모방 신부', 'Fr. Maubant'],
      ['샤스탕 신부', 'Fr. Chastan'],
      ['앵베르 주교', 'Bishop Imbert'],
      ['페레올 주교', 'Bishop Ferréol'],
    ],
    0,
    ['1836년 처음 조선에 입국한 파리외방전교회 신부입니다.', 'The Paris Foreign Missions priest who first entered Joseon in 1836.'],
    [
      '모방 신부는 조선인 성직자 양성이 필요하다고 보고, 15세의 김대건·최양업·최방제를 마카오로 보냈습니다.',
      'Fr. Maubant saw the need for Korean clergy and sent Kim (aged 15), Choe Yang-eop and Choe Bang-je to Macau.',
    ],
  ),
  q(
    'choe-yangeop',
    ['김대건과 함께 마카오에서 유학했고, 두 번째 한국인 사제가 된 사람은?', 'Who studied in Macau with Andrew Kim and became the second Korean priest?'],
    [
      ['정하상', 'Jeong Ha-sang'],
      ['최양업 토마스', 'Thomas Choe Yang-eop'],
      ['유대철', 'Yu Dae-cheol'],
      ['남종삼', 'Nam Jong-sam'],
    ],
    1,
    ['세례명은 토마스입니다.', 'His baptismal name is Thomas.'],
    [
      '최양업(토마스)은 김대건의 순교 뒤 두 번째 한국인 사제로서 조선 교회를 이끌었습니다.',
      'After Kim’s martyrdom, Thomas Choe Yang-eop led the Church in Joseon as its second Korean priest.',
    ],
  ),
  q(
    'byeongo-count',
    ['1846년 병오박해로 처형된 사람은 김대건 신부를 포함해 모두 몇 명으로 전해질까?', 'Including Fr. Andrew Kim, how many people are said to have been executed in the Byeong-o Persecution of 1846?'],
    [
      ['3명', '3'],
      ['9명', '9'],
      ['30명', '30'],
      ['90명', '90'],
    ],
    1,
    ['기해박해나 병인박해보다 훨씬 작은 규모입니다.', 'Far smaller than the Gihae or Byeongin persecutions.'],
    [
      '신자 8명 등 총 9명이 처형된 것으로 전해집니다. 규모는 작지만 최초의 조선인 사제가 순교했다는 상징성이 큽니다.',
      'Nine people, including eight lay believers, are said to have been executed. The scale was small, but the martyrdom of the first Korean priest carried great symbolism.',
    ],
  ),
  q(
    'sunwido',
    ['김대건 신부가 체포된 곳으로, 황해도 연안에 있는 섬은?', 'On which island off the coast of Hwanghae Province was Fr. Andrew Kim arrested?'],
    [
      ['순위도', 'Sunwido'],
      ['강화도', 'Ganghwado'],
      ['제주도', 'Jejudo'],
      ['백령도', 'Baengnyeongdo'],
    ],
    0,
    ['서해 뱃길을 살피던 중이었습니다.', 'He was surveying sea routes along the west coast.'],
    [
      '김대건은 서해 뱃길을 답사하던 중 순위도 부근에서 관장과 시비가 붙어 신원이 드러나 체포되었습니다.',
      'While surveying sea routes, Kim got into a dispute with an official near Sunwido, was identified and arrested.',
    ],
  ),
  q(
    'pius-xi',
    ['1925년 로마에서 기해·병오박해 순교자 79위를 복자로 선포한 교황은?', 'Which pope declared 79 martyrs of the Gihae and Byeong-o persecutions blessed in Rome in 1925?'],
    [
      ['프란치스코', 'Francis'],
      ['비오 11세', 'Pius XI'],
      ['요한 바오로 2세', 'John Paul II'],
      ['레오 12세', 'Leo XII'],
    ],
    1,
    ['7월 5일 성 베드로 광장에서였습니다.', 'On 5 July, in St. Peter’s Square.'],
    [
      '1925년 7월 5일 비오 11세 교황이 김대건·정하상·앵베르 주교 등 79위를 복자로 선포했습니다.',
      'On 5 July 1925 Pope Pius XI declared 79 martyrs, including Kim Taegon, Jeong Ha-sang and Bishop Imbert, blessed.',
    ],
  ),
  q(
    'paul-vi',
    ['1968년 병인박해 순교자 24위를 복자로 선포한 교황은?', 'Which pope declared 24 martyrs of the Byeongin Persecution blessed in 1968?'],
    [
      ['요한 바오로 2세', 'John Paul II'],
      ['프란치스코', 'Francis'],
      ['바오로 6세', 'Paul VI'],
      ['비오 11세', 'Pius XI'],
    ],
    2,
    ['10월 6일이었고, 남종삼 요한이 이 명단에 있었습니다.', 'It was 6 October, and John Nam Jong-sam was on the list.'],
    [
      '1968년 10월 6일 바오로 6세 교황이 병인박해 시기 순교자 24위를 복자로 선포했습니다.',
      'On 6 October 1968 Pope Paul VI declared 24 martyrs of the Byeongin Persecution blessed.',
    ],
  ),
  q(
    'korean-saints',
    ['103위 성인 가운데 한국인은 몇 명이고, 나머지는 프랑스인 성직자일까?', 'Of the 103 saints, how many were Korean (the rest being French clergy)?'],
    [
      ['73명', '73'],
      ['83명', '83'],
      ['93명', '93'],
      ['103명', '103'],
    ],
    2,
    ['프랑스인 성직자는 10명입니다.', 'There are 10 French clergymen.'],
    [
      '103위 가운데 한국인이 93명, 파리외방전교회 소속 프랑스인 성직자가 10명입니다.',
      'Of the 103, 93 were Koreans and 10 were French clergy of the Paris Foreign Missions.',
    ],
  ),
  q(
    'feast-day',
    ['「윤지충 바오로와 동료 순교자 124위」의 축일은 언제일까?', 'When is the feast day of “Paul Yun Ji-chung and His 123 Companions”?'],
    [
      ['5월 6일', '6 May'],
      ['5월 29일', '29 May'],
      ['8월 16일', '16 August'],
      ['10월 6일', '6 October'],
    ],
    1,
    ['시복식 날짜와는 다릅니다.', 'It is not the date of the beatification ceremony.'],
    [
      '124위 순교자의 축일은 5월 29일입니다. 시복식은 2014년 8월 16일에 열렸습니다.',
      'Their feast day is 29 May; the beatification itself took place on 16 August 2014.',
    ],
  ),
  q(
    'byeongin-yangyo',
    ['병인박해 때 프랑스인 선교사들이 처형된 소식이 계기가 되어, 그해 가을 프랑스 함대가 강화도를 침공한 사건은?', 'News of the execution of French missionaries during the Byeongin Persecution led to a French fleet attacking Ganghwa Island that autumn. What was it called?'],
    [
      ['병인양요', 'Byeongin Yangyo'],
      ['신미양요', 'Sinmi Yangyo'],
      ['임오군란', 'Imo Mutiny'],
      ['운요호 사건', 'Unyo Incident'],
    ],
    0,
    ['박해가 일어난 해의 간지가 그대로 이름에 들어 있습니다.', 'Its name contains the same sexagenary year as the persecution.'],
    [
      '조선을 탈출한 리델 신부가 톈진의 로즈 제독에게 소식을 전했고, 이것이 병인양요의 직접적인 계기가 되었습니다.',
      'Fr. Ridel escaped Joseon and told Admiral Roze in Tianjin, which directly triggered the French campaign of 1866.',
    ],
  ),
  q(
    'seosomun',
    ['병인박해 때 경기도 고양에서 체포된 남종삼이 처형된 곳은?', 'Where was Nam Jong-sam, arrested in Goyang, Gyeonggi, executed during the Byeongin Persecution?'],
    [
      ['서소문 밖', 'Outside Seosomun Gate'],
      ['새남터', 'Saenamteo'],
      ['절두산', 'Jeoldusan'],
      ['해미읍성', 'Haemi Fortress'],
    ],
    0,
    ['서울 성곽의 서쪽 문 바깥입니다.', 'Outside the western gate of Seoul’s city wall.'],
    [
      '남종삼은 서소문 밖에서 처형되었고, 1984년 103위 성인 중 한 사람으로 시성되었습니다.',
      'Nam Jong-sam was executed outside Seosomun Gate and was canonized in 1984 among the 103 saints.',
    ],
  ),
  q(
    'nam-proposal',
    ['남종삼이 흥선대원군에게 건의했던 방안은?', 'What did Nam Jong-sam propose to Heungseon Daewongun?'],
    [
      ['프랑스·영국과 동맹해 러시아를 견제하자', 'An alliance with France and Britain to check Russia'],
      ['청나라에 조공을 늘리자', 'Increasing tribute to Qing China'],
      ['일본과 통상을 시작하자', 'Opening trade with Japan'],
      ['서양 무기를 직접 만들자', 'Manufacturing Western weapons at home'],
    ],
    0,
    ['러시아가 두만강 유역까지 내려와 통상을 요구하던 때였습니다.', 'Russia had come down to the Tumen River basin demanding trade.'],
    [
      '이 제안이 성사되지 못하고 천주교 반감이 겹치면서, 대원군은 오히려 탄압으로 돌아서 병인박해가 시작되었습니다.',
      'The plan came to nothing and, amid hostility to Catholicism, the Daewongun turned to repression, beginning the Byeongin Persecution.',
    ],
  ),
  q(
    'ogajaktongbeop',
    ['1801년 정순왕후가 신자를 색출하려고 동원한, 다섯 집을 한 묶음으로 묶는 제도는?', 'In 1801 Queen Jeongsun used a system that bound five households together to root out believers. What was it?'],
    [
      ['오가작통법', 'Ogajaktongbeop'],
      ['호패법', 'The ID-tag system'],
      ['대동법', 'Land-tax reform'],
      ['균역법', 'Military-tax reform'],
    ],
    0,
    ['한 집에서 신자가 나오면 이웃도 처벌받았습니다.', 'If one house had a believer, neighbors were punished too.'],
    [
      '정순왕후는 천주교를 「아비도 임금도 없는 사학」으로 규정하고 오가작통법으로 신자를 찾아내게 했습니다.',
      'Queen Jeongsun branded Catholicism a “heresy with neither father nor king” and had believers hunted through the five-household system.',
    ],
  ),
  q(
    'chonam',
    ['윤지충·권상연의 순교지이자 유해가 발굴된 전주의 성지는?', 'Which shrine in Jeonju is both the martyrdom site of Yun Ji-chung and Kwon Sang-yeon and the place where their remains were found?'],
    [
      ['초남이성지', 'Chonam-i Shrine'],
      ['새남터', 'Saenamteo'],
      ['절두산', 'Jeoldusan'],
      ['솔뫼성지', 'Solmoe Shrine'],
    ],
    0,
    ['전주 초남이에 있습니다.', 'It is at Chonam-i in Jeonju.'],
    [
      '전주 초남이성지는 1791년 신해박해로 순교한 윤지충과 권상연의 순교지이자 유해 발굴지입니다.',
      'Chonam-i Shrine in Jeonju is where Yun and Kwon were martyred in the Sinhae Persecution of 1791, and where their remains were excavated.',
    ],
  ),
];

import type { HolyQuiz } from './holy-quiz';
import { q } from './holy-quiz-extra';

/**
 * 퀴즈 41~100번 — 촬영지 · 교황 방문 · 유명 인물 · 성당 건축 · 성지 이야기(2026-11-19, 사장님 지시).
 * 근거는 docs/40-knowledge/07-퀴즈근거/퀴즈-41-100-근거.md 에 문항별로 적었다.
 * 「최초」「유래」처럼 자료마다 표현이 갈리는 것은 해설에서 「~로 알려져 있습니다」「~라고 전해집니다」로 쓴다.
 */
export const FUN_QUIZZES: HolyQuiz[] = [
  q(
    'film-fiery-priest',
    [
      '드라마 「열혈사제」에서 「구담성당」으로 나온 서울 중림동의 성당은?',
      'Which church in Jungnim-dong, Seoul, appeared as “Gudam Church” in the TV drama “The Fiery Priest”?',
    ],
    [
      ['약현성당', 'Yakhyeon Catholic Church'],
      ['명동대성당', 'Myeongdong Cathedral'],
      ['혜화동성당', 'Hyehwa-dong Catholic Church'],
      ['가회동성당', 'Gahoe-dong Catholic Church'],
    ],
    0,
    ['1892년에 지어진 붉은 벽돌 성당입니다.', 'It is a red-brick church built in 1892.'],
    [
      '「열혈사제」의 구담성당은 서울 중림동 약현성당에서 촬영했습니다. 약현성당은 1892년에 지어진 우리나라 첫 서양식 벽돌 성당으로 알려져 있습니다.',
      '“Gudam Church” in “The Fiery Priest” was filmed at Yakhyeon Catholic Church in Jungnim-dong. Built in 1892, it is known as Korea’s first Western-style brick church.',
    ],
  ),
  q(
    'jp2-sorokdo',
    [
      '1984년 한국을 찾은 교황 요한 바오로 2세가 한센인들을 만나러 직접 찾아간 섬은?',
      'Which island did Pope John Paul II visit in 1984 to meet people living with Hansen’s disease?',
    ],
    [
      ['제주도', 'Jeju Island'],
      ['소록도', 'Sorok Island'],
      ['강화도', 'Ganghwa Island'],
      ['추자도', 'Chuja Island'],
    ],
    1,
    ['전라남도 고흥에 있는 작은 섬입니다.', 'It is a small island in Goheung, South Jeolla Province.'],
    [
      '요한 바오로 2세는 1984년 5월 4일 광주에서 미사를 드린 뒤 소록도를 찾아 한센인들을 만났습니다.',
      'On 4 May 1984, after celebrating Mass in Gwangju, John Paul II went to Sorok Island and met the patients there.',
    ],
  ),
  q(
    'jamdubong',
    [
      '절두산 순교성지가 있는 봉우리의 옛 이름은? 누에가 머리를 든 모양이라는 뜻이다.',
      'What was the old name of the peak where Jeoldusan Martyrs’ Shrine stands? It means “silkworm’s head.”',
    ],
    [
      ['용두봉', 'Yongdubong'],
      ['와우산', 'Wausan'],
      ['잠두봉', 'Jamdubong'],
      ['응봉', 'Eungbong'],
    ],
    2,
    ['「누에 잠(蠶)」 자를 씁니다.', 'The name uses the Chinese character for “silkworm” (蠶, jam).'],
    [
      '한강 가의 이 봉우리는 원래 누에 머리를 닮았다 하여 잠두봉이라 불렸습니다. 1866년 병인박해 때 많은 신자가 이곳에서 처형된 뒤 「머리를 자른 산」이라는 뜻의 절두산으로 불리게 되었습니다.',
      'This peak by the Han River was called Jamdubong because it looked like a silkworm’s head. After many Catholics were executed here in the 1866 persecution, it came to be called Jeoldusan, “the mountain of beheading.”',
    ],
  ),
  q(
    'coste',
    [
      '약현성당과 명동대성당을 둘 다 설계한 파리외방전교회 선교사는?',
      'Which Paris Foreign Missions priest designed both Yakhyeon Church and Myeongdong Cathedral?',
    ],
    [
      ['모방 신부', 'Fr. Maubant'],
      ['드비즈 신부', 'Fr. Devise'],
      ['다블뤼 주교', 'Bishop Daveluy'],
      ['코스트 신부', 'Fr. Coste'],
    ],
    3,
    [
      '그는 명동대성당이 다 지어지기 전인 1896년에 세상을 떠났습니다.',
      'He died in 1896, before Myeongdong Cathedral was finished.',
    ],
    [
      '코스트 신부는 1892년 약현성당을 짓고 명동대성당도 설계했습니다. 그가 1896년에 세상을 떠나자 프와넬 신부가 공사를 이어받아 1898년에 마쳤습니다.',
      'Fr. Coste built Yakhyeon Church in 1892 and also designed Myeongdong Cathedral. After he died in 1896, Fr. Poisnel took over and completed it in 1898.',
    ],
  ),
  q(
    'francis-solmoe',
    [
      '2014년 8월 프란치스코 교황이 김대건 신부의 고향 솔뫼성지에서 만난 사람들은?',
      'Whom did Pope Francis meet at Solmoe, the birthplace of St. Andrew Kim, in August 2014?',
    ],
    [
      ['아시아청년대회에 온 청년들', 'Young people attending the Asian Youth Day'],
      ['한국의 주교들', 'The bishops of Korea'],
      ['각 나라 대사들', 'Ambassadors from many countries'],
      ['다른 종교의 지도자들', 'Leaders of other religions'],
    ],
    0,
    ['교황 방한의 계기가 된 행사가 그때 충청도에서 열리고 있었습니다.', 'The event that occasioned his visit was being held in the Chungcheong region.'],
    [
      '프란치스코 교황은 2014년 8월 15일 당진 솔뫼성지에서 제6회 아시아청년대회에 참가한 청년들을 만났습니다.',
      'On 15 August 2014 Pope Francis met the young participants of the 6th Asian Youth Day at Solmoe Shrine in Dangjin.',
    ],
  ),
  q(
    'mirinae-meaning',
    [
      '김대건 신부의 묘가 있는 「미리내」 성지의 이름은 무슨 뜻일까?',
      'What does “Mirinae,” the name of the shrine where St. Andrew Kim is buried, mean?',
    ],
    [
      ['깊은 골짜기', 'Deep valley'],
      ['은하수', 'The Milky Way'],
      ['맑은 샘', 'Clear spring'],
      ['소나무 숲', 'Pine forest'],
    ],
    1,
    ['밤하늘과 관계있는 순우리말입니다.', 'It is a native Korean word connected with the night sky.'],
    [
      '미리내는 은하수를 뜻하는 우리말입니다. 박해를 피해 숨어 살던 신자들의 집 불빛이 냇물에 비쳐 은하수 같았다는 데서 붙은 이름이라고 전해집니다.',
      'Mirinae is a native Korean word for the Milky Way. Tradition says the lights from the hidden Catholics’ houses, reflected in the stream, looked like the Milky Way.',
    ],
  ),
  q(
    'film-taegukgi',
    [
      '영화 「태극기 휘날리며」, 드라마 「모래시계」 등 여러 작품의 배경이 된 충남 아산의 성당은?',
      'Which church in Asan, South Chungcheong Province, served as a backdrop for the film “Taegukgi” and the drama “Sandglass,” among many others?',
    ],
    [
      ['합덕성당', 'Hapdeok Catholic Church'],
      ['공주 중동성당', 'Jungdong Catholic Church, Gongju'],
      ['공세리성당', 'Gongseri Catholic Church'],
      ['예산성당', 'Yesan Catholic Church'],
    ],
    2,
    ['1922년에 완공된 붉은 벽돌 성당으로, 오래된 나무들에 둘러싸여 있습니다.', 'It is a red-brick church completed in 1922, surrounded by old trees.'],
    [
      '아산 공세리성당은 「태극기 휘날리며」, 「모래시계」를 비롯한 여러 영화와 드라마의 배경으로 알려져 있습니다. 지금의 성당은 1922년에 완공되었습니다.',
      'Gongseri Catholic Church in Asan is known as a backdrop for many films and dramas, including “Taegukgi” and “Sandglass.” The present church was completed in 1922.',
    ],
  ),
  q(
    'jp2-1989',
    [
      '교황 요한 바오로 2세가 1989년 두 번째로 한국을 찾은 것은 서울에서 열린 어떤 행사 때문일까?',
      'For which event held in Seoul did Pope John Paul II make his second visit to Korea in 1989?',
    ],
    [
      ['세계청년대회', 'World Youth Day'],
      ['아시아청년대회', 'Asian Youth Day'],
      ['103위 시성식', 'The canonization of the 103 martyrs'],
      ['제44차 세계성체대회', 'The 44th International Eucharistic Congress'],
    ],
    3,
    ['성체를 중심으로 온 세계 신자들이 모이는 대회입니다.', 'It is a worldwide gathering centered on the Eucharist.'],
    [
      '1989년 10월 서울에서 제44차 세계성체대회가 열렸고, 요한 바오로 2세는 10월 8일 여의도광장에서 폐막 미사를 집전했습니다.',
      'The 44th International Eucharistic Congress was held in Seoul in October 1989, and John Paul II celebrated its closing Mass at Yeouido Plaza on 8 October.',
    ],
  ),
  q(
    'jonghyeon',
    [
      '명동대성당이 1898년 완공되었을 때 불리던 이름은?',
      'What was Myeongdong Cathedral called when it was completed in 1898?',
    ],
    [
      ['종현성당', 'Jonghyeon Church'],
      ['명례방성당', 'Myeongnyebang Church'],
      ['한양성당', 'Hanyang Church'],
      ['남산성당', 'Namsan Church'],
    ],
    0,
    ['성당이 선 언덕의 옛 이름에서 왔습니다.', 'It came from the old name of the hill on which it stands.'],
    [
      '명동대성당은 1898년 5월 29일 축성되었고, 그때 이름은 종현성당이었습니다. 「명동성당」이라는 이름은 1945년부터 쓰였습니다.',
      'Myeongdong Cathedral was consecrated on 29 May 1898 under the name Jonghyeon Church. The name “Myeongdong” came into use in 1945.',
    ],
  ),
  q(
    'yeosutgol',
    [
      '해미순교성지의 다른 이름 「여숫골」은 어디에서 나온 말이라고 전해질까?',
      'According to tradition, where does “Yeosutgol,” another name for Haemi Martyrs’ Shrine, come from?',
    ],
    [
      ['여우가 많이 살던 골짜기', 'A valley where many foxes lived'],
      ['순교자들이 외친 「예수 마리아」', 'The martyrs’ cry of “Jesus, Mary”'],
      ['여섯 개의 골짜기', 'Six valleys'],
      ['옛 고을 원님의 이름', 'The name of an old magistrate'],
    ],
    1,
    ['끌려가던 신자들이 끝까지 부르던 기도 소리였습니다.', 'It was the prayer the Catholics kept calling out as they were led away.'],
    [
      '생매장 터로 끌려가던 신자들이 「예수 마리아」를 부르자, 사람들이 이를 「여수(여우) 머리」로 알아들어 여숫골이라 부르게 되었다고 전해집니다.',
      'It is said that as the Catholics were led to be buried alive they called out “Yesu Maria,” which onlookers misheard as “yeosu meori” (fox’s head), giving the place the name Yeosutgol.',
    ],
  ),
  q(
    'francis-haemi-closing',
    [
      '2014년 프란치스코 교황이 아시아청년대회 폐막 미사를 집전한 곳은?',
      'Where did Pope Francis celebrate the closing Mass of the Asian Youth Day in 2014?',
    ],
    [
      ['광화문광장', 'Gwanghwamun Square'],
      ['대전월드컵경기장', 'Daejeon World Cup Stadium'],
      ['해미읍성', 'Haemi Fortress'],
      ['여의도광장', 'Yeouido Plaza'],
    ],
    2,
    ['충남 서산에 있는 조선 시대 성곽입니다.', 'It is a Joseon-era walled town in Seosan, South Chungcheong Province.'],
    [
      '교황은 2014년 8월 17일 충남 서산 해미읍성에서 제6회 아시아청년대회 폐막 미사를 집전했습니다.',
      'On 17 August 2014 the Pope celebrated the closing Mass of the 6th Asian Youth Day at Haemi Fortress in Seosan.',
    ],
  ),
  q(
    'gyesan-wedding',
    [
      '1950년 12월 대구 계산성당에서 결혼식을 올린 사람은?',
      'Who was married at Gyesan Cathedral in Daegu in December 1950?',
    ],
    [
      ['이승만과 프란체스카', 'Syngman Rhee and Franziska Donner'],
      ['김구와 최준례', 'Kim Gu and Choe Jun-rye'],
      ['윤보선과 공덕귀', 'Yun Bo-seon and Gong Deok-gwi'],
      ['박정희와 육영수', 'Park Chung-hee and Yuk Young-soo'],
    ],
    3,
    ['신랑은 뒷날 대통령이 되었습니다.', 'The groom later became president.'],
    [
      '박정희와 육영수는 1950년 12월 12일 대구 계산성당에서 결혼식을 올렸습니다. 계산성당은 1902년에 지어진 영남 지역 첫 고딕 성당으로 알려져 있습니다.',
      'Park Chung-hee and Yuk Young-soo were married at Gyesan Cathedral on 12 December 1950. Built in 1902, it is known as the first Gothic church in the Yeongnam region.',
    ],
  ),
  q(
    'seosomun-44',
    [
      '103위 성인 가운데 서소문 밖 네거리에서 순교한 분은 몇 분일까?',
      'How many of the 103 saints were martyred at Seosomun (outside the Small West Gate)?',
    ],
    [
      ['44위', '44'],
      ['10위', '10'],
      ['24위', '24'],
      ['79위', '79'],
    ],
    0,
    ['103위의 절반에 조금 못 미칩니다.', 'A little under half of the 103.'],
    [
      '서소문 밖 네거리에서는 103위 성인 가운데 44위가 순교했습니다. 한 곳에서 가장 많은 성인이 나온 순교지입니다.',
      'At Seosomun, 44 of the 103 saints were martyred — more than at any other single site.',
    ],
  ),
  q(
    'film-fiery-priest-2',
    [
      '드라마 「열혈사제 2」에 부산의 「우마성당」으로 나온 곳의 실제 촬영지는?',
      'Where was “Uma Church,” set in Busan in the drama “The Fiery Priest 2,” actually filmed?',
    ],
    [
      ['부산 남천성당', 'Namcheon Cathedral, Busan'],
      ['인천 답동성당', 'Dapdong Cathedral, Incheon'],
      ['대구 계산성당', 'Gyesan Cathedral, Daegu'],
      ['전주 전동성당', 'Jeondong Cathedral, Jeonju'],
    ],
    1,
    ['부산이 아니라 서해의 항구 도시에 있습니다.', 'It is not in Busan but in a port city on the west coast.'],
    [
      '드라마에서는 부산의 성당으로 나오지만, 실제로 촬영한 곳은 인천 중구의 답동성당입니다.',
      'Although it appears as a church in Busan, it was actually filmed at Dapdong Cathedral in Jung-gu, Incheon.',
    ],
  ),
  q(
    'haemi-international',
    [
      '2020년 교황청이 「국제 성지」로 승인한 충남의 성지는?',
      'Which shrine in South Chungcheong Province did the Holy See recognize as an international shrine in 2020?',
    ],
    [
      ['솔뫼성지', 'Solmoe Shrine'],
      ['갈매못 순교성지', 'Galmaemot Martyrs’ Shrine'],
      ['해미순교성지', 'Haemi Martyrs’ Shrine'],
      ['신리성지', 'Sinri Shrine'],
    ],
    2,
    ['이름이 전해지지 않는 순교자가 매우 많은 곳입니다.', 'It is a place with a great many martyrs whose names are unknown.'],
    [
      '교황청은 2020년 11월 29일 해미순교성지를 국제 성지로 승인했습니다. 한 곳의 성지로는 우리나라에서 처음입니다.',
      'On 29 November 2020 the Holy See recognized Haemi Martyrs’ Shrine as an international shrine — the first single shrine in Korea to receive this status.',
    ],
  ),
  q(
    'jeong-gyu-ha',
    [
      '강원도 횡성 풍수원성당은 「한국인 신부가 지은 첫 성당」으로 알려져 있다. 이 성당을 지은 신부는?',
      'Pungsuwon Church in Hoengseong is known as the first church built by a Korean priest. Who built it?',
    ],
    [
      ['김대건 신부', 'Fr. Andrew Kim Taegon'],
      ['최양업 신부', 'Fr. Thomas Choe Yang-eop'],
      ['르메르 신부', 'Fr. Le Merre'],
      ['정규하 신부', 'Fr. Augustine Jeong Gyu-ha'],
    ],
    3,
    ['1896년 서울 약현성당에서 사제품을 받은 분입니다.', 'He was ordained at Yakhyeon Church in Seoul in 1896.'],
    [
      '정규하 아우구스티노 신부는 1896년 풍수원에 부임해 1907년 지금의 벽돌 성당을 완공했습니다.',
      'Fr. Augustine Jeong Gyu-ha came to Pungsuwon in 1896 and completed the present brick church in 1907.',
    ],
  ),
  q(
    'galmaemot',
    [
      '1866년 다블뤼 주교를 비롯한 다섯 성인이 순교한, 충남 보령 바닷가의 성지는?',
      'Which seaside shrine in Boryeong is where Bishop Daveluy and four other saints were martyred in 1866?',
    ],
    [
      ['갈매못', 'Galmaemot'],
      ['황새바위', 'Hwangsaebawi'],
      ['여사울', 'Yeosaul'],
      ['홍주', 'Hongju'],
    ],
    0,
    ['조선 시대 충청 수영(수군 본부) 가까이에 있던 모래사장입니다.', 'It was a sandy shore near the Joseon navy headquarters of Chungcheong.'],
    [
      '1866년 3월 30일 갈매못에서 다블뤼 주교, 위앵 신부, 오메트르 신부, 황석두 루카, 장주기 요셉이 순교했습니다. 다섯 분 모두 103위 성인입니다.',
      'On 30 March 1866 Bishop Daveluy, Fr. Huin, Fr. Aumaître, Luke Hwang Seok-du and Joseph Jang Ju-gi were martyred at Galmaemot. All five are among the 103 saints.',
    ],
  ),
  q(
    'wyd-lisbon',
    [
      '2027년 세계청년대회가 서울에서 열린다는 발표는 2023년 어느 도시의 대회에서 나왔을까?',
      'At the 2023 World Youth Day in which city was Seoul announced as host of the 2027 gathering?',
    ],
    [
      ['로마', 'Rome'],
      ['리스본', 'Lisbon'],
      ['파나마시티', 'Panama City'],
      ['크라쿠프', 'Kraków'],
    ],
    1,
    ['포르투갈의 수도입니다.', 'It is the capital of Portugal.'],
    [
      '2023년 8월 6일 포르투갈 리스본 세계청년대회 폐막 미사에서 프란치스코 교황이 다음 개최지로 서울을 발표했습니다.',
      'On 6 August 2023, at the closing Mass of World Youth Day in Lisbon, Pope Francis announced Seoul as the next host.',
    ],
  ),
  q(
    'ointment',
    [
      '아산 공세리성당의 드비즈 신부가 전해 준 비법에서 비롯되었다고 알려진 약은?',
      'Which remedy is said to have come from a recipe passed on by Fr. Devise of Gongseri Church in Asan?',
    ],
    [
      ['활명수', 'Hwalmyeongsu (digestive tonic)'],
      ['우황청심원', 'Uhwang Cheongsimwon'],
      ['이명래 고약', 'Yi Myeong-nae’s plaster (goyak)'],
      ['은단', 'Eundan (silver pills)'],
    ],
    2,
    ['종기에 붙이던 까만 약입니다.', 'It was a black plaster applied to boils.'],
    [
      '드비즈 신부가 만들어 쓰던 고약의 비법을 신자 이명래 요한에게 전해 주었고, 이것이 「이명래 고약」이 되었다고 전해집니다.',
      'Fr. Devise is said to have passed the recipe for his plaster to a parishioner, John Yi Myeong-nae, and it became the well-known “Yi Myeong-nae goyak.”',
    ],
  ),
  q(
    'unesco-2021',
    [
      '탄생 200주년을 맞아 「2021년 유네스코 세계기념인물」로 선정된 한국인은?',
      'Which Korean was honored by UNESCO in 2021 on the 200th anniversary of his birth?',
    ],
    [
      ['정약용', 'Jeong Yak-yong'],
      ['최양업 신부', 'Fr. Thomas Choe Yang-eop'],
      ['김수환 추기경', 'Cardinal Kim Sou-hwan'],
      ['김대건 신부', 'Fr. Andrew Kim Taegon'],
    ],
    3,
    ['1821년 충남 당진 솔뫼에서 태어났습니다.', 'He was born in 1821 at Solmoe in Dangjin.'],
    [
      '유네스코는 김대건 신부 탄생 200주년을 2021년 세계 기념의 해로 정했습니다. 정약용은 탄생 250주년인 2012년에 선정되었습니다.',
      'UNESCO marked the 200th anniversary of Fr. Andrew Kim’s birth in 2021. Jeong Yak-yong had been honored in 2012 for his 250th.',
    ],
  ),
  q(
    'francis-seosomun',
    [
      '2014년 8월 16일 프란치스코 교황이 광화문 시복식에 앞서 아침에 먼저 찾아 기도한 곳은?',
      'Where did Pope Francis go to pray on the morning of 16 August 2014, before the beatification Mass at Gwanghwamun?',
    ],
    [
      ['서소문 순교성지', 'Seosomun Martyrs’ Shrine'],
      ['절두산 순교성지', 'Jeoldusan Martyrs’ Shrine'],
      ['새남터 순교성지', 'Saenamteo Martyrs’ Shrine'],
      ['미리내성지', 'Mirinae Shrine'],
    ],
    0,
    ['103위 성인 가운데 44위가 순교한 곳입니다.', 'Forty-four of the 103 saints were martyred there.'],
    [
      '교황은 시복식 날 첫 일정으로 서소문 순교성지를 찾아 현양탑 앞에서 기도한 뒤 광화문으로 갔습니다.',
      'The Pope began the day of the beatification at Seosomun Martyrs’ Shrine, praying before the memorial before going on to Gwanghwamun.',
    ],
  ),
  q(
    'solmoe-meaning',
    ['김대건 신부가 태어난 「솔뫼」는 무슨 뜻일까?', 'What does “Solmoe,” the birthplace of St. Andrew Kim, mean?'],
    [
      ['솟아나는 샘', 'A bubbling spring'],
      ['소나무가 우거진 동산', 'A hill covered with pine trees'],
      ['소금을 굽는 마을', 'A salt-making village'],
      ['새가 모이는 들', 'A field where birds gather'],
    ],
    1,
    ['「솔」은 나무 이름, 「뫼」는 산의 옛말입니다.', '“Sol” is a kind of tree and “moe” is an old word for mountain.'],
    [
      '솔뫼는 소나무가 뫼(산)를 이룬 곳이라는 우리말입니다. 김대건 신부의 증조할아버지부터 신부까지 4대에 걸친 순교자가 살던 곳입니다.',
      'Solmoe is a native Korean name meaning “pine hill.” Four generations of martyrs, from St. Andrew Kim’s great-grandfather to himself, lived here.',
    ],
  ),
  q(
    'jeondong',
    [
      '윤지충과 권상연이 순교한 터에 세워졌고, 호남 지방 첫 서양식 건물로 알려진 성당은?',
      'Which church was built on the site where Yun Ji-chung and Kwon Sang-yeon were martyred, and is known as the first Western-style building in the Honam region?',
    ],
    [
      ['나바위성당', 'Nabawi Church'],
      ['수류성당', 'Suryu Church'],
      ['전동성당', 'Jeondong Cathedral'],
      ['되재성당', 'Doejae Church'],
    ],
    2,
    ['전주 한옥마을 들머리, 풍남문 가까이에 있습니다.', 'It stands at the entrance to Jeonju Hanok Village, near Pungnam Gate.'],
    [
      '전주 전동성당은 한국 교회 첫 순교자 윤지충·권상연이 순교한 풍남문 밖 터에 세워졌습니다. 1914년에 겉모습이 완성되었고, 호남 지방 첫 서양식 건물로 알려져 있습니다.',
      'Jeondong Cathedral in Jeonju stands on the site outside Pungnam Gate where Korea’s first martyrs died. Its exterior was finished in 1914, and it is known as the first Western-style building in Honam.',
    ],
  ),
  q(
    'jp2-gwangju',
    [
      '1984년 5월 4일 교황 요한 바오로 2세가 광주에서 미사를 집전한 곳은?',
      'Where in Gwangju did Pope John Paul II celebrate Mass on 4 May 1984?',
    ],
    [
      ['금남로', 'Geumnam-ro'],
      ['임동성당', 'Imdong Cathedral'],
      ['전남대학교 운동장', 'Chonnam National University field'],
      ['무등경기장', 'Mudeung Stadium'],
    ],
    3,
    ['광주를 대표하는 산의 이름이 붙은 곳입니다.', 'It is named after Gwangju’s best-known mountain.'],
    [
      '교황은 1984년 5월 4일 광주 무등경기장에서 세례·견진 성사와 함께 미사를 집전했습니다.',
      'On 4 May 1984 the Pope celebrated Mass, with baptisms and confirmations, at Mudeung Stadium in Gwangju.',
    ],
  ),
  q(
    'film-birth',
    [
      '2022년 개봉한 영화 「탄생」은 누구의 삶을 그렸을까?',
      'Whose life is told in the 2022 film “A Birth” (Tansaeng)?',
    ],
    [
      ['김대건 신부', 'Fr. Andrew Kim Taegon'],
      ['이승훈 베드로', 'Peter Yi Seung-hun'],
      ['김수환 추기경', 'Cardinal Kim Sou-hwan'],
      ['정약종 아우구스티노', 'Augustine Jeong Yak-jong'],
    ],
    0,
    ['한국인 첫 사제입니다.', 'He was the first Korean priest.'],
    [
      '「탄생」은 김대건 신부의 삶을 그린 영화로, 배우 윤시윤이 김대건 역을 맡았습니다. 개봉에 앞서 2022년 11월 바티칸 교황청에서 시사회가 열렸습니다.',
      '“A Birth” tells the life of Fr. Andrew Kim, played by Yoon Si-yoon. Before its release it was screened at the Vatican in November 2022.',
    ],
  ),
  q(
    'baeron-name',
    [
      '충북 제천 「배론」 성지의 이름은 어디에서 왔다고 전해질까?',
      'Where is the name of Baeron Shrine in Jecheon said to come from?',
    ],
    [
      ['배나무가 많은 골짜기', 'A valley full of pear trees'],
      ['골짜기 모양이 배 밑바닥 같아서', 'The valley is shaped like the bottom of a boat'],
      ['배를 타고 건너던 나루', 'A ferry crossing'],
      ['처음 들어온 신자의 이름', 'The name of the first Catholic who settled there'],
    ],
    1,
    ['물 위에 뜨는 「배」입니다.', 'Think of a boat on the water.'],
    [
      '배론은 둘레의 산과 골짜기 모양이 배 밑바닥처럼 생겼다 하여 붙은 이름으로 알려져 있습니다. 깊은 골짜기여서 박해 때 신자들이 숨어 살았습니다.',
      'Baeron is said to be named for its valley, shaped like the bottom of a boat. Deep in the mountains, it sheltered Catholics during the persecutions.',
    ],
  ),
  q(
    'jeoldusan-1967',
    [
      '절두산 순교성지의 기념 성당과 박물관은 1967년, 무엇의 100주년을 기념해 세워졌을까?',
      'The memorial church and museum at Jeoldusan were built in 1967 to mark the centenary of what?',
    ],
    [
      ['한국 천주교회 창설', 'The founding of the Church in Korea'],
      ['김대건 신부 순교', 'The martyrdom of Fr. Andrew Kim'],
      ['병인박해', 'The Byeongin Persecution'],
      ['조선대목구 설정', 'The establishment of the Vicariate of Joseon'],
    ],
    2,
    ['1866년에 시작된 박해입니다.', 'It was the persecution that began in 1866.'],
    [
      '병인박해(1866년) 때 많은 신자가 절두산에서 순교했습니다. 그 100주년을 기념해 1967년 기념 성당과 박물관이 세워졌습니다.',
      'Many Catholics were martyred at Jeoldusan in the Byeongin Persecution of 1866. The memorial church and museum were built in 1967 to mark its centenary.',
    ],
  ),
  q(
    'francis-daejeon',
    [
      '2014년 8월 15일 프란치스코 교황이 성모 승천 대축일 미사를 집전한 곳은?',
      'Where did Pope Francis celebrate Mass for the Solemnity of the Assumption on 15 August 2014?',
    ],
    [
      ['명동대성당', 'Myeongdong Cathedral'],
      ['서울월드컵경기장', 'Seoul World Cup Stadium'],
      ['솔뫼성지', 'Solmoe Shrine'],
      ['대전월드컵경기장', 'Daejeon World Cup Stadium'],
    ],
    3,
    ['2002년 월드컵이 열렸던 충청권의 경기장입니다.', 'It is a 2002 World Cup stadium in the Chungcheong region.'],
    [
      '교황은 8월 15일 대전월드컵경기장에서 성모 승천 대축일 미사를 집전했고, 그날 오후 솔뫼성지로 갔습니다.',
      'The Pope celebrated the Assumption Mass at Daejeon World Cup Stadium on 15 August and went on to Solmoe that afternoon.',
    ],
  ),
  q(
    'first-cardinal',
    ['1969년 한국인으로서 처음 추기경이 된 사람은?', 'Who became the first Korean cardinal in 1969?'],
    [
      ['김수환 스테파노', 'Stephen Kim Sou-hwan'],
      ['노기남 바오로', 'Paul Ro Ki-nam'],
      ['정진석 니콜라오', 'Nicholas Cheong Jin-suk'],
      ['염수정 안드레아', 'Andrew Yeom Soo-jung'],
    ],
    0,
    ['그때 나이 마흔일곱으로, 세계 추기경 가운데 가장 젊었습니다.', 'At forty-seven he was then the youngest cardinal in the world.'],
    [
      '교황 바오로 6세는 1969년 서울대교구장 김수환 대주교를 추기경으로 임명했습니다. 당시 47세로 세계 추기경 가운데 가장 젊었습니다.',
      'In 1969 Pope Paul VI named Archbishop Kim Sou-hwan of Seoul a cardinal. At 47 he was the youngest in the College of Cardinals.',
    ],
  ),
  q(
    'nabawi',
    [
      '1845년 사제가 되어 배를 타고 돌아온 김대건 신부가 조선 땅에 첫발을 디딘 곳으로, 오늘날 전북 익산에 있는 성지는?',
      'Which shrine in present-day Iksan marks where Fr. Andrew Kim first set foot in Korea after returning by boat as a priest in 1845?',
    ],
    [
      ['솔뫼', 'Solmoe'],
      ['나바위', 'Nabawi'],
      ['미리내', 'Mirinae'],
      ['새남터', 'Saenamteo'],
    ],
    1,
    ['금강 가 강경 황산포 가까이에 있습니다.', 'It is by the Geum River, near Hwangsanpo in Ganggyeong.'],
    [
      '김대건 신부 일행은 1845년 10월 12일 밤 강경 황산포 가까이에 닿았습니다. 이를 기념해 그 자리에 나바위성당이 세워졌습니다.',
      'Fr. Kim and his companions landed near Hwangsanpo in Ganggyeong on the night of 12 October 1845. Nabawi Church was later built there in memory of it.',
    ],
  ),
  q(
    'seoul-pilgrim-route',
    [
      '2018년 교황청이 아시아에서 처음으로 승인한 국제 순례지는?',
      'What did the Holy See approve in 2018 as the first international pilgrimage site in Asia?',
    ],
    [
      ['제주 올레길', 'Jeju Olle Trail'],
      ['버그내 순례길', 'Beogeunae Pilgrimage Route'],
      ['천주교 서울 순례길', 'The Catholic Pilgrimage Routes in Seoul'],
      ['한티 가는 길', 'The Way to Hanti'],
    ],
    2,
    ['명동대성당에서 삼성산 성지까지 24곳을 잇는 길입니다.', 'It links 24 sites, from Myeongdong Cathedral to Samseongsan.'],
    [
      '「천주교 서울 순례길」은 순례지 24곳을 세 코스, 44.1km로 잇습니다. 2018년 9월 교황청이 승인한 아시아 첫 국제 순례지입니다.',
      'The Catholic Pilgrimage Routes in Seoul link 24 sites over three courses totaling 44.1 km. In September 2018 they became the first Vatican-approved international pilgrimage site in Asia.',
    ],
  ),
  q(
    'virgin-couple',
    [
      '혼인한 뒤에도 오누이처럼 지내며 동정을 지킨 순교자 부부 유중철 요한과 이순이 루갈다가 묻힌 전주의 성지는?',
      'Which shrine in Jeonju holds the tomb of John Yu Jung-cheol and Lutgarda Yi Sun-i, the martyr couple who lived as brother and sister after marriage?',
    ],
    [
      ['숲정이', 'Supjeongi'],
      ['초록바위', 'Chorokbawi'],
      ['서천교', 'Seocheongyo'],
      ['치명자산', 'Chimyeongjasan'],
    ],
    3,
    ['「치명」은 순교를 뜻하는 옛말입니다.', '“Chimyeong” is an old Korean word for martyrdom.'],
    [
      '1801년 신유박해 때 순교한 유항검 가족 일곱 분이 전주 치명자산(승암산)에 함께 묻혀 있고, 동정 부부 유중철·이순이도 그 가운데 있습니다.',
      'Seven members of Yu Hang-geom’s family, martyred in 1801, are buried together on Chimyeongjasan in Jeonju — among them the virgin couple Yu Jung-cheol and Yi Sun-i.',
    ],
  ),
  q(
    'sinri',
    [
      '박해 시대에 가장 큰 교우촌으로 꼽혀 「조선의 카타콤바」라고 불리는 충남 당진의 성지는?',
      'Which shrine in Dangjin, once among the largest Catholic villages of the persecution era, is called “the Catacombs of Joseon”?',
    ],
    [
      ['솔뫼성지', 'Solmoe Shrine'],
      ['해미순교성지', 'Haemi Martyrs’ Shrine'],
      ['신리성지', 'Sinri Shrine'],
      ['갈매못 순교성지', 'Galmaemot Martyrs’ Shrine'],
    ],
    2,
    ['넓은 들판 한가운데, 합덕읍에 있습니다.', 'It lies in the middle of wide fields in Hapdeok.'],
    [
      '당진 합덕의 신리는 박해 시대의 큰 교우촌이었고, 병인박해 때 많은 순교자가 나왔습니다. 그래서 「조선의 카타콤바」라고 불립니다.',
      'Sinri in Hapdeok, Dangjin, was a large Catholic village in the persecution era and lost many to the Byeongin Persecution — hence “the Catacombs of Joseon.”',
    ],
  ),
  q(
    'kim-statue-vatican',
    [
      '2023년 9월 김대건 신부의 성상이 세워진 곳은?',
      'Where was a statue of St. Andrew Kim Taegon installed in September 2023?',
    ],
    [
      ['파리 노트르담 대성당', 'Notre-Dame Cathedral, Paris'],
      ['마카오 성 바오로 성당 유적', 'The Ruins of St. Paul’s, Macau'],
      ['상하이 서가회 성당', 'Xujiahui Cathedral, Shanghai'],
      ['바티칸 성 베드로 대성전', 'St. Peter’s Basilica, the Vatican'],
    ],
    3,
    ['가톨릭교회의 중심에 있는 성당의 바깥벽입니다.', 'It is on the outer wall of the church at the heart of the Catholic world.'],
    [
      '2023년 9월 16일 바티칸 성 베드로 대성전 바깥벽 벽감에 김대건 신부 성상이 축복되었습니다. 이곳에 동양 성인의 성상이 놓인 것은 처음입니다.',
      'On 16 September 2023 a statue of St. Andrew Kim was blessed in a niche on the outer wall of St. Peter’s Basilica — the first statue of an Asian saint to be placed there.',
    ],
  ),
  q(
    'francis-myeongdong',
    [
      '2014년 방한 마지막 날, 프란치스코 교황이 「평화와 화해를 위한 미사」를 집전한 곳은?',
      'Where did Pope Francis celebrate the “Mass for Peace and Reconciliation” on the last day of his 2014 visit?',
    ],
    [
      ['명동대성당', 'Myeongdong Cathedral'],
      ['광화문광장', 'Gwanghwamun Square'],
      ['임진각', 'Imjingak'],
      ['절두산 순교성지', 'Jeoldusan Martyrs’ Shrine'],
    ],
    0,
    ['서울대교구의 주교좌 성당입니다.', 'It is the cathedral of the Archdiocese of Seoul.'],
    [
      '교황은 2014년 8월 18일 명동대성당에서 평화와 화해를 위한 미사를 집전하고 한국을 떠났습니다.',
      'On 18 August 2014 the Pope celebrated the Mass for Peace and Reconciliation at Myeongdong Cathedral and then left Korea.',
    ],
  ),
  q(
    'juksan',
    [
      '병인박해 때 「끌려가면 살아 돌아오지 못하니 잊으라」는 뜻에서 「잊은 터」라고 불렸다는 경기도 안성의 성지는?',
      'Which shrine in Anseong was called “Ijeun-teo” (the forgotten place) in the 1866 persecution, because no one taken there came back?',
    ],
    [
      ['미리내성지', 'Mirinae Shrine'],
      ['죽산성지', 'Juksan Shrine'],
      ['손골성지', 'Songol Shrine'],
      ['남한산성 순교성지', 'Namhansanseong Martyrs’ Shrine'],
    ],
    1,
    ['본래 이름은 「이진터」였습니다.', 'Its original name was “Ijin-teo.”'],
    [
      '안성 죽산성지의 자리는 본래 이진터라 불렸습니다. 병인박해 때 이곳에 끌려가면 돌아오지 못한다 하여 「잊은 터」라 불렸다고 전해집니다.',
      'The site of Juksan Shrine in Anseong was originally called Ijin-teo. In the Byeongin Persecution it is said to have become “Ijeun-teo,” the place to forget, since no one returned from it.',
    ],
  ),
  q(
    'yongsu',
    [
      '1845년 김대건 신부가 탄 라파엘호가 풍랑을 만나 닿은 제주의 포구는? 지금은 표착 기념관이 있다.',
      'At which harbor in Jeju did Fr. Andrew Kim’s boat, the Raphael, come ashore after a storm in 1845? A memorial hall stands there today.',
    ],
    [
      ['성산포', 'Seongsanpo'],
      ['모슬포', 'Moseulpo'],
      ['용수리 포구', 'Yongsu-ri harbor'],
      ['화북 포구', 'Hwabuk harbor'],
    ],
    2,
    ['제주시 한경면, 차귀도가 보이는 바닷가입니다.', 'It is on the coast of Hangyeong-myeon, within sight of Chagwido.'],
    [
      '상하이에서 사제품을 받고 돌아오던 김대건 신부 일행은 풍랑을 만나 제주 용수리 바닷가에 닿았습니다. 이곳에 표착 기념관과 복원한 라파엘호가 있습니다.',
      'Returning from his ordination in Shanghai, Fr. Kim and his companions were driven by a storm to the shore at Yongsu-ri, Jeju. A memorial hall and a replica of the Raphael stand there.',
    ],
  ),
  q(
    'wyd-manila',
    [
      '2027년 서울 대회에 앞서, 아시아에서 세계청년대회가 열렸던 단 한 곳은?',
      'Before Seoul 2027, which is the only Asian city to have hosted World Youth Day?',
    ],
    [
      ['도쿄', 'Tokyo'],
      ['홍콩', 'Hong Kong'],
      ['뭄바이', 'Mumbai'],
      ['마닐라', 'Manila'],
    ],
    3,
    ['1995년, 가톨릭 신자가 많은 나라의 수도에서 열렸습니다.', 'It was held in 1995 in the capital of a largely Catholic country.'],
    [
      '세계청년대회가 아시아에서 열린 것은 1995년 필리핀 마닐라에 이어 2027년 서울이 두 번째입니다.',
      'Seoul 2027 will be only the second World Youth Day in Asia, after Manila in the Philippines in 1995.',
    ],
  ),
  q(
    'st-joseph-seminary',
    [
      '1855년 제천 배론에 세워진, 우리나라 첫 신학교의 이름은?',
      'What was the name of Korea’s first seminary, founded at Baeron in Jecheon in 1855?',
    ],
    [
      ['성 요셉 신학교', 'St. Joseph’s Seminary'],
      ['예수성심신학교', 'Sacred Heart Seminary'],
      ['성 베드로 신학교', 'St. Peter’s Seminary'],
      ['성 유스티노 신학교', 'St. Justin’s Seminary'],
    ],
    0,
    ['성모 마리아의 배필인 성인의 이름입니다.', 'It bears the name of the husband of the Virgin Mary.'],
    [
      '1855년 배론의 장주기 요셉 집에 성 요셉 신학교가 세워졌습니다. 1866년 병인박해 때까지 이어진 우리나라 첫 신학교입니다.',
      'St. Joseph’s Seminary was founded in 1855 in the house of Joseph Jang Ju-gi at Baeron. Korea’s first seminary, it lasted until the 1866 persecution.',
    ],
  ),
  q(
    'kim-statue-dress',
    [
      '바티칸 성 베드로 대성전 바깥벽에 선 김대건 신부 성상은 어떤 옷차림일까?',
      'How is St. Andrew Kim dressed in his statue on the outer wall of St. Peter’s Basilica?',
    ],
    [
      ['로만 칼라의 사제복', 'A clerical suit with Roman collar'],
      ['갓과 도포', 'A gat (horsehair hat) and dopo (robe)'],
      ['미사 때 입는 제의', 'Mass vestments'],
      ['순교 때의 죄수복', 'A prisoner’s garment'],
    ],
    1,
    ['조선 선비의 차림입니다.', 'It is the attire of a Joseon scholar.'],
    [
      '조각가 한진섭이 만든 이 성상은 갓을 쓰고 도포를 입은 채 두 팔을 벌린 모습입니다. 높이는 3.7m쯤입니다.',
      'Made by sculptor Han Jin-seop, the statue shows him in a gat and dopo with arms open. It stands about 3.7 meters tall.',
    ],
  ),
  q(
    'francis-kkottongnae',
    [
      '2014년 8월 16일 프란치스코 교황이 광화문 시복식을 마치고 찾아간 충북 음성의 복지 시설은?',
      'Which welfare community in Eumseong did Pope Francis visit after the beatification Mass on 16 August 2014?',
    ],
    [
      ['소록도', 'Sorok Island'],
      ['성가정 입양원', 'Holy Family Adoption Center'],
      ['꽃동네', 'Kkottongnae'],
      ['요셉의원', 'Joseph Clinic'],
    ],
    2,
    ['이름에 「꽃」이 들어갑니다.', 'Its name means “Flower Village.”'],
    [
      '교황은 시복식을 마친 뒤 충북 음성 꽃동네를 찾아 장애인들과 수도자들을 만났습니다.',
      'After the beatification the Pope went to Kkottongnae in Eumseong, where he met people with disabilities and members of religious communities.',
    ],
  ),
  q(
    'jeong-nanju',
    [
      '「백서」를 쓴 황사영의 아내 정난주 마리아가 관비로 유배되어 살다가 묻힌 곳은?',
      'Where was Maria Jeong Nan-ju, wife of Hwang Sa-yeong of the “Silk Letter,” exiled as a government slave and later buried?',
    ],
    [
      ['전남 흑산도', 'Heuksan Island'],
      ['경남 거제도', 'Geoje Island'],
      ['전남 강진', 'Gangjin'],
      ['제주 대정', 'Daejeong, Jeju'],
    ],
    3,
    ['지금은 「대정성지」라고 부릅니다.', 'Today it is called Daejeong Shrine.'],
    [
      '정난주 마리아는 1801년 남편이 처형된 뒤 제주 대정현의 관비로 유배되어 30년 넘게 살다가 그곳에 묻혔습니다. 그 묘가 오늘의 대정성지입니다.',
      'After her husband was executed in 1801, Maria Jeong Nan-ju was exiled as a slave to Daejeong in Jeju, where she lived for more than thirty years and was buried. Her tomb is today’s Daejeong Shrine.',
    ],
  ),
  q(
    'film-tangerines',
    [
      '2025년 드라마 「폭싹 속았수다」에서 금명이의 결혼식 장면을 찍은 성당 내부는 어디일까?',
      'In the 2025 drama “When Life Gives You Tangerines,” in which church was the interior of Geum-myeong’s wedding filmed?',
    ],
    [
      ['대구 계산성당', 'Gyesan Cathedral, Daegu'],
      ['서울 명동대성당', 'Myeongdong Cathedral, Seoul'],
      ['제주 중앙성당', 'Jungang Cathedral, Jeju'],
      ['전주 전동성당', 'Jeondong Cathedral, Jeonju'],
    ],
    0,
    ['제주가 아니라 대구 도심에 있습니다.', 'It is not in Jeju but in downtown Daegu.'],
    [
      '결혼식장 내부는 대구 계산성당에서, 겉모습은 경북 칠곡 가실성당에서 촬영했습니다.',
      'The interior of the wedding was filmed at Gyesan Cathedral in Daegu, and the exterior at Gasil Church in Chilgok.',
    ],
  ),
  q(
    'jinjiahang',
    [
      '1845년 김대건이 사제품을 받은 상하이의 성당은?',
      'In which church in Shanghai was Andrew Kim ordained a priest in 1845?',
    ],
    [
      ['북당(북천주당)', 'The North Church (Beitang)'],
      ['서가회 성당', 'Xujiahui Cathedral'],
      ['김가항 성당', 'Jinjiahang (Kim-ga-hang) Church'],
      ['성 바오로 성당', 'St. Paul’s Church'],
    ],
    2,
    ['제주 용수성지의 기념 성당은 이 성당의 모습을 본떠 지었습니다.', 'The memorial church at Yongsu Shrine in Jeju was modeled on it.'],
    [
      '김대건은 1845년 8월 상하이 김가항 성당에서 사제품을 받았습니다. 제주 용수성지 기념 성당은 이 성당의 모습을 되살려 지었습니다.',
      'Andrew Kim was ordained in August 1845 at Jinjiahang Church in Shanghai. The memorial church at Yongsu Shrine in Jeju recreates its appearance.',
    ],
  ),
  q(
    'solmoe-4gen',
    [
      '솔뫼는 김대건 신부 집안에서 몇 대에 걸친 순교자가 살던 곳일까?',
      'Solmoe was home to how many generations of martyrs in St. Andrew Kim’s family?',
    ],
    [
      ['1대', 'One'],
      ['2대', 'Two'],
      ['3대', 'Three'],
      ['4대', 'Four'],
    ],
    3,
    ['증조할아버지부터 김대건 신부까지입니다.', 'Count from his great-grandfather down to Fr. Kim himself.'],
    [
      '증조할아버지 김진후(1814년), 작은할아버지(1816년), 아버지 김제준(1839년), 김대건 신부(1846년)까지 4대의 순교자가 솔뫼에 살았습니다.',
      'His great-grandfather Kim Jin-hu (1814), a great-uncle (1816), his father Kim Je-jun (1839) and Fr. Kim himself (1846) — four generations of martyrs lived at Solmoe.',
    ],
  ),
  q(
    'non-rome-canonization',
    [
      '1984년 서울 여의도에서 열린 103위 시성식이 교회사에서 특별한 까닭은?',
      'Why was the 1984 canonization of the 103 martyrs in Seoul unusual in Church history?',
    ],
    [
      ['로마 밖에서 열린 시성식이어서', 'It was held outside Rome'],
      ['교황 없이 열린 시성식이어서', 'It was held without the pope'],
      ['밤에 열린 첫 시성식이어서', 'It was the first held at night'],
      ['한 사람만 시성되어서', 'Only one person was canonized'],
    ],
    0,
    ['시성식은 보통 바티칸에서 열립니다.', 'Canonizations are normally held at the Vatican.'],
    [
      '103위 시성식은 14세기 아비뇽 시기 이후 처음으로 로마(바티칸) 밖에서 열린 시성식으로 알려져 있습니다.',
      'It is known as the first canonization held outside Rome since the Avignon period of the 14th century.',
    ],
  ),
  q(
    'martyrs-month',
    [
      '한국 천주교회가 「순교자 성월」로 지내는 달은?',
      'Which month does the Church in Korea keep as the “Month of Martyrs”?',
    ],
    [
      ['5월', 'May'],
      ['9월', 'September'],
      ['10월', 'October'],
      ['11월', 'November'],
    ],
    1,
    ['103위 성인 대축일이 들어 있는 달입니다.', 'It is the month containing the feast of the 103 saints.'],
    [
      '한국 교회는 9월을 순교자 성월로 지냅니다. 9월 20일은 「성 김대건 안드레아 사제와 성 정하상 바오로와 동료 순교자들 대축일」입니다.',
      'The Church in Korea keeps September as the Month of Martyrs. 20 September is the Solemnity of Sts. Andrew Kim Taegon, Paul Chong Ha-sang and Companions.',
    ],
  ),
  q(
    'yakhyeon-ordination',
    [
      '1896년 우리나라 땅에서 처음으로 사제 서품식이 열린 성당은?',
      'In which church was the first priestly ordination on Korean soil held, in 1896?',
    ],
    [
      ['명동대성당', 'Myeongdong Cathedral'],
      ['용산 예수성심신학교 성당', 'The chapel of the Sacred Heart Seminary, Yongsan'],
      ['약현성당', 'Yakhyeon Church'],
      ['답동성당', 'Dapdong Cathedral'],
    ],
    2,
    ['그때 명동대성당은 아직 짓는 중이었습니다.', 'Myeongdong Cathedral was still under construction at the time.'],
    [
      '1896년 4월 26일 서울 약현성당에서 강도영, 정규하, 강성삼 세 사람이 사제품을 받았습니다. 우리나라 땅에서 열린 첫 사제 서품식입니다.',
      'On 26 April 1896 Kang Do-yeong, Jeong Gyu-ha and Kang Seong-sam were ordained at Yakhyeon Church in Seoul — the first priestly ordination held in Korea.',
    ],
  ),
  q(
    'francis-soul',
    [
      '2014년 한국에 온 프란치스코 교황이 「가장 작은 차를 타고 싶다」고 하여 탄 차는?',
      'Which car did Pope Francis ride in Korea in 2014, having asked for the smallest one available?',
    ],
    [
      ['에쿠스', 'Hyundai Equus'],
      ['카니발', 'Kia Carnival'],
      ['제네시스', 'Hyundai Genesis'],
      ['쏘울', 'Kia Soul'],
    ],
    3,
    ['상자처럼 생긴 작은 국산 차입니다.', 'It is a small, boxy Korean car.'],
    [
      '교황은 방한 기간에 국산 소형차 쏘울을 타고 다녔습니다. 큰 방탄차 대신 작은 차를 고른 일이 큰 화제가 되었습니다.',
      'During his visit the Pope travelled in a Kia Soul, a small Korean car. His choice of a compact over a large armored limousine drew wide attention.',
    ],
  ),
  q(
    'film-beyond-mountain',
    [
      '2020년 영화 「저 산 너머」는 누구의 어린 시절을 그렸을까?',
      'Whose childhood is portrayed in the 2020 film “Beyond That Mountain”?',
    ],
    [
      ['김수환 추기경', 'Cardinal Kim Sou-hwan'],
      ['김대건 신부', 'Fr. Andrew Kim Taegon'],
      ['이태석 신부', 'Fr. John Lee Tae-seok'],
      ['최양업 신부', 'Fr. Thomas Choe Yang-eop'],
    ],
    0,
    ['한국의 첫 추기경입니다.', 'He was Korea’s first cardinal.'],
    [
      '「저 산 너머」는 정채봉 작가의 원작을 바탕으로, 김수환 추기경의 일곱 살 무렵을 그린 영화입니다.',
      'Based on a book by Jeong Chae-bong, “Beyond That Mountain” portrays Cardinal Kim Sou-hwan at about seven years old.',
    ],
  ),
  q(
    'galmaemot-why',
    [
      '1866년 다블뤼 주교 일행이 서울이 아니라 멀리 보령 갈매못에서 처형된 까닭으로 전해지는 것은?',
      'Why, according to the records, were Bishop Daveluy and his companions executed far away at Galmaemot rather than in Seoul in 1866?',
    ],
    [
      ['서울에 큰 홍수가 나서', 'Because of a great flood in Seoul'],
      ['임금의 혼례를 앞두고 있어서', 'Because the king’s wedding was near'],
      ['프랑스 함대가 한강에 와 있어서', 'Because the French fleet was on the Han River'],
      ['주교가 그곳을 원해서', 'Because the bishop asked for it'],
    ],
    1,
    ['나라의 큰 경사를 앞두고 서울에서 피를 보는 일을 꺼렸습니다.', 'With a great royal celebration approaching, bloodshed in the capital was avoided.'],
    [
      '고종의 혼례를 앞두고 서울에서 처형하기를 꺼려, 충청 수영이 있던 보령으로 옮겨 처형했다고 전해집니다.',
      'With King Gojong’s wedding approaching, an execution in Seoul was avoided, and the prisoners were sent to Boryeong, where the Chungcheong naval headquarters stood.',
    ],
  ),
  q(
    'martyrs-feast-0920',
    [
      '103위 성인을 기리는 「성 김대건 안드레아 사제와 성 정하상 바오로와 동료 순교자들 대축일」은 언제일까?',
      'When is the Solemnity of Sts. Andrew Kim Taegon, Paul Chong Ha-sang and Companions, which honors the 103 saints?',
    ],
    [
      ['5월 6일', '6 May'],
      ['5월 29일', '29 May'],
      ['9월 20일', '20 September'],
      ['9월 16일', '16 September'],
    ],
    2,
    ['순교자 성월 안에 있습니다.', 'It falls within the Month of Martyrs.'],
    [
      '103위 성인 대축일은 9월 20일입니다. 124위 복자의 축일은 5월 29일입니다.',
      'The solemnity of the 103 saints is 20 September. The memorial of the 124 blesseds is 29 May.',
    ],
  ),
  q(
    'jp2-analects',
    [
      '교황 요한 바오로 2세는 한국을 찾아 「벗이 있어 먼 데서 찾아오면 이 또한 기쁘지 아니한가」라는 옛글을 인용했다. 이 구절이 실린 책은?',
      'Visiting Korea, Pope John Paul II quoted the old saying, “Is it not a joy to have friends come from afar?” Which book is it from?',
    ],
    [
      ['맹자', 'Mencius'],
      ['논어', 'The Analects of Confucius'],
      ['도덕경', 'Tao Te Ching'],
      ['명심보감', 'Myeongsim Bogam'],
    ],
    1,
    ['공자의 말씀을 모은 책입니다.', 'It is the collection of the sayings of Confucius.'],
    [
      '이 구절은 『논어』 첫머리에 나옵니다. 교황은 한국 사람들을 「먼 데 있는 벗」이라 부르며 이 말을 인용했습니다.',
      'The line opens the Analects. The Pope quoted it, calling the Korean people “friends from afar.”',
    ],
  ),
  q(
    'rain-kim-wedding',
    [
      '2017년 가수 비와 배우 김태희가 혼배 미사로 결혼식을 올린 서울 북촌의 성당은?',
      'In which church in Bukchon, Seoul, did singer Rain and actress Kim Tae-hee marry at a nuptial Mass in 2017?',
    ],
    [
      ['명동대성당', 'Myeongdong Cathedral'],
      ['가회동성당', 'Gahoe-dong Catholic Church'],
      ['약현성당', 'Yakhyeon Catholic Church'],
      ['혜화동성당', 'Hyehwa-dong Catholic Church'],
    ],
    1,
    ['한옥과 어우러진 성당으로 알려져 있습니다.', 'It is known for the hanok (traditional house) that forms part of it.'],
    [
      '두 사람은 2017년 1월 19일 서울 종로구 가회동성당에서 가족과 가까운 이들만 모인 가운데 혼배 미사를 올렸습니다.',
      'They were married on 19 January 2017 at Gahoe-dong Catholic Church in Jongno-gu, Seoul, at a Mass attended only by family and close friends.',
    ],
  ),
  q(
    'yuna-stella',
    [
      '「피겨 여왕」 김연아 선수가 2008년 세례를 받으며 고른 세례명은?',
      'What baptismal name did figure skater Kim Yuna choose when she was baptized in 2008?',
    ],
    [
      ['스텔라', 'Stella'],
      ['마리아', 'Maria'],
      ['아녜스', 'Agnes'],
      ['베로니카', 'Veronica'],
    ],
    0,
    ['라틴어로 「별」이라는 뜻입니다.', 'It means “star” in Latin.'],
    [
      '김연아 선수는 2008년 5월 세례를 받았고, 세례명은 「별」을 뜻하는 스텔라입니다.',
      'Kim Yuna was baptized in May 2008 and took the name Stella, meaning “star.”',
    ],
  ),
  q(
    'tonj',
    [
      '다큐멘터리 영화 「울지마 톤즈」의 주인공 이태석 신부가 의사이자 선생님으로 살았던 「톤즈」는 어느 나라에 있을까?',
      'Tonj, where Fr. John Lee Tae-seok of the documentary “Don’t Cry for Me, Sudan” served as doctor and teacher, is in which country?',
    ],
    [
      ['케냐', 'Kenya'],
      ['에티오피아', 'Ethiopia'],
      ['남수단', 'South Sudan'],
      ['탄자니아', 'Tanzania'],
    ],
    2,
    ['오랜 내전을 겪은 아프리카의 나라입니다.', 'It is an African country that endured a long civil war.'],
    [
      '살레시오회 이태석 신부는 2001년부터 남수단 톤즈에서 병원과 학교를 세우고 아이들을 돌보다 2010년 세상을 떠났습니다. 그 삶이 영화 「울지마 톤즈」(2010년)에 담겼습니다.',
      'Fr. Lee Tae-seok, a Salesian, built a clinic and a school in Tonj, South Sudan, from 2001 and cared for its children until his death in 2010. His life is told in the 2010 film.',
    ],
  ),
  q(
    'first-prefect',
    [
      '2021년 한국인으로서 처음 교황청 장관(성직자부)이 된 사람은?',
      'Who in 2021 became the first Korean to head a department of the Roman Curia (the Dicastery for the Clergy)?',
    ],
    [
      ['염수정 추기경', 'Cardinal Yeom Soo-jung'],
      ['정진석 추기경', 'Cardinal Cheong Jin-suk'],
      ['김수환 추기경', 'Cardinal Kim Sou-hwan'],
      ['유흥식 추기경', 'Cardinal You Heung-sik'],
    ],
    3,
    ['대전교구장을 지낸 분입니다.', 'He had been Bishop of Daejeon.'],
    [
      '대전교구장이던 유흥식 대주교는 2021년 교황청 성직자부 장관에 임명되었고, 이듬해 추기경이 되었습니다. 김대건 신부 성상을 바티칸에 세우자고 교황에게 제안한 사람이기도 합니다.',
      'Archbishop You Heung-sik of Daejeon was named prefect for the Clergy in 2021 and made a cardinal the following year. He was also the one who proposed to the Pope that a statue of St. Andrew Kim be placed at the Vatican.',
    ],
  ),
  q(
    'an-jung-geun',
    ['독립운동가 안중근 의사의 세례명은?', 'What was the baptismal name of the independence activist An Jung-geun?'],
    [
      ['토마스', 'Thomas'],
      ['베드로', 'Peter'],
      ['요한', 'John'],
      ['안드레아', 'Andrew'],
    ],
    0,
    ['그래서 「도마 안중근」이라고도 부릅니다.', 'This is why he is also called “Doma An Jung-geun.”'],
    [
      '안중근 의사의 세례명은 토마스이고, 옛 표기로 「도마」라고 합니다. 그의 신앙을 이끈 사람은 빌렘 신부입니다.',
      'An Jung-geun’s baptismal name was Thomas, written “Doma” in the old Korean style. Fr. Wilhelm was his spiritual guide.',
    ],
  ),
  q(
    'kim-dae-jung',
    [
      '노벨 평화상을 받은 김대중 대통령의 세례명은?',
      'What was the baptismal name of President Kim Dae-jung, the Nobel Peace Prize laureate?',
    ],
    [
      ['프란치스코', 'Francis'],
      ['토마스 모어', 'Thomas More'],
      ['아우구스티노', 'Augustine'],
      ['이냐시오', 'Ignatius'],
    ],
    1,
    ['임금의 뜻을 거스르고 신념을 지키다 순교한 영국의 성인입니다.', 'He was an English saint martyred for holding to his conscience against the king.'],
    [
      '김대중 대통령은 장면 박사를 대부로 세례를 받았고, 세례명은 토마스 모어입니다.',
      'Kim Dae-jung was baptized with Dr. Chang Myon as his godfather, taking the name Thomas More.',
    ],
  ),
  q(
    'film-tangerines-gasil',
    [
      '드라마 「폭싹 속았수다」에서 금명이의 결혼식장 겉모습으로 나온 경북 칠곡의 성당은?',
      'Which church in Chilgok appeared as the exterior of Geum-myeong’s wedding venue in “When Life Gives You Tangerines”?',
    ],
    [
      ['한티 순교성지', 'Hanti Martyrs’ Shrine'],
      ['왜관성당', 'Waegwan Catholic Church'],
      ['가실성당', 'Gasil Catholic Church'],
      ['계산성당', 'Gyesan Cathedral'],
    ],
    2,
    ['낙동강 가까이에 있는 오래된 붉은 벽돌 성당입니다.', 'It is an old red-brick church near the Nakdong River.'],
    [
      '결혼식장 겉모습은 칠곡 가실성당, 내부는 대구 계산성당에서 촬영했습니다.',
      'The exterior was filmed at Gasil Church in Chilgok, and the interior at Gyesan Cathedral in Daegu.',
    ],
  ),
];

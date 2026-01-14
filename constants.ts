import { HolySite, SiteCategory } from './types';

export const HOLY_SITES: HolySite[] = [
  {
    id: 'yakhyeon',
    name: '중림동 약현성당',
    category: SiteCategory.HISTORICAL,
    location: '서울특별시 중구 중림로 149',
    description: '한국 최초의 서양식 벽돌조 성당이자 사적 제252호로 지정된 건축적 보물입니다.',
    imageUrl: 'https://images.unsplash.com/photo-1548625361-9f93922f1636?auto=format&fit=crop&q=80&w=1200',
    history: '1892년 완공된 한국 최초의 서양식 성당입니다. 박해기 순교자들의 처형지였던 서소문 밖 네거리를 내려다보는 언덕에 세워져 순교자들의 넋을 기리는 상징적 의미를 담고 있습니다.',
    coordinates: { lat: 37.5588, lng: 126.9673 }
  },
  {
    id: 'yongsan-seminary',
    name: '원효로 예수성심 성당 (구 용산신학교)',
    category: SiteCategory.HISTORICAL,
    location: '서울특별시 용산구 원효로19길 25',
    description: '1887년 세워진 한국 최초의 신학교 건물이자 사적 제255호입니다.',
    imageUrl: 'https://images.unsplash.com/photo-1605281317010-fe5ffe798156?auto=format&fit=crop&q=80&w=1200',
    history: '프랑스 선교사 코스트 신부가 설계한 이 건물은 붉은 벽돌과 회색 벽돌의 조화가 아름다운 고딕 양식의 정수를 보여줍니다. 당시 신학생들이 사제 서품을 받기 위해 준비하던 신앙의 산실입니다.',
    coordinates: { lat: 37.5342, lng: 126.9601 }
  },
  {
    id: 'gahoedong',
    name: '가회동 성당',
    category: SiteCategory.HISTORICAL,
    location: '서울특별시 종로구 북촌로 57',
    description: '전통 한옥의 아름다움과 천주교 신앙이 결합된 역사적 사적지입니다.',
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-e94e270b4d82?auto=format&fit=crop&q=80&w=1200',
    history: '조선 시대 최초의 외국인 신부인 주문모 신부가 한국 땅에서 첫 미사를 봉헌한 장소로 추정되는 곳입니다. 한옥 스타일의 입구는 주변 북촌 한옥마을의 경관과 완벽한 조화를 이룹니다.',
    coordinates: { lat: 37.5828, lng: 126.9839 }
  },
  {
    id: 'namhansanseong',
    name: '남한산성 순교성지',
    category: SiteCategory.MARTYRDOM,
    location: '경기도 광주시 남한산성면 남한산성로 763',
    description: '수많은 무명 순교자들이 신앙을 증거하며 숨져간 험준한 산성 속 성지입니다.',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=1200',
    history: '박해 시기 도성 밖의 피난처이자 수용소였던 이곳에서 수많은 신자들이 고초를 겪고 순교했습니다. 현재는 성벽을 따라 걷는 순례길과 함께 경건한 소성당이 마련되어 있습니다.',
    coordinates: { lat: 37.4784, lng: 127.1843 }
  },
  {
    id: 'mirinae',
    name: '미리내 성지',
    category: SiteCategory.MARTYRDOM,
    location: '경기도 안성시 양성면 미리내성지로 420',
    description: '성 김대건 안드레아 신부님의 묘소가 있는 한국 천주교의 성소입니다.',
    imageUrl: 'https://images.unsplash.com/photo-1518391846015-55a96023bd13?auto=format&fit=crop&q=80&w=1200',
    history: '밤하늘의 은하수(미리내)처럼 신자들의 불빛이 끊이지 않았던 교우촌입니다. 김대건 신부님의 유해가 모셔져 있으며, 대성당과 103위 성인 기념성당이 웅장하게 서 있습니다.',
    coordinates: { lat: 37.1492, lng: 127.2458 }
  },
  {
    id: 'baeron',
    name: '배론 성지',
    category: SiteCategory.HISTORICAL,
    location: '충청북도 제천시 봉양읍 배론성지길 200',
    description: '황사영 백서가 쓰여진 토굴과 한국 최초의 신학교가 있던 곳입니다.',
    imageUrl: 'https://images.unsplash.com/photo-1471039497385-b6d6ba609f9c?auto=format&fit=crop&q=80&w=1200',
    history: '산골 깊숙한 지형이 배 밑창 모양을 닮아 배론이라 불렸습니다. 박해 시기 신자들의 피신처였으며, 한국 천주교 초기 신학 교육의 발판이 된 성 요셉 신학교가 복원되어 있습니다.',
    coordinates: { lat: 37.2185, lng: 128.0927 }
  },
  {
    id: 'seosomun',
    name: '서소문성지 역사박물관',
    category: SiteCategory.MARTYRDOM,
    location: '서울특별시 중구 칠패로 5',
    description: '한국 최대의 순교지 위에 세워진 침묵과 성찰의 현대적 건축물입니다.',
    imageUrl: 'https://images.unsplash.com/photo-1590076175571-4b5459308c73?auto=format&fit=crop&q=80&w=1200',
    history: "조선 시대 공식 처형장이었던 서소문 밖 네거리는 44분의 성인과 27분의 복자가 탄생한 곳입니다. 현대적인 붉은 벽돌과 빛의 설계로 이루어진 박물관은 그 자체로 예술적인 순례 공간입니다.",
    coordinates: { lat: 37.5594, lng: 126.9691 }
  },
  {
    id: 'myeongdong',
    name: '명동대성당',
    category: SiteCategory.CATHEDRAL,
    location: '서울특별시 중구 명동길 74',
    description: '한국 천주교를 대표하는 주교좌 성당이자 역사의 산 증인입니다.',
    imageUrl: 'https://images.unsplash.com/photo-1621251917173-ee6f7e446698?auto=format&fit=crop&q=80&w=1200',
    history: '1898년 완공된 고딕 양식의 성당으로, 박해기 순교자들의 유해를 안치하고 있습니다. 한국 근현대사에서 민주화와 인권의 보루 역할을 해온 특별한 의미를 지닌 곳입니다.',
    coordinates: { lat: 37.5632, lng: 126.9873 }
  },
  {
    id: 'saenamteo',
    name: '새남터 순교성지',
    category: SiteCategory.MARTYRDOM,
    location: '서울특별시 용산구 이촌로 71길 24',
    description: '김대건 신부님이 순교하신 한국 천주교 사제들의 성지입니다.',
    imageUrl: 'https://images.unsplash.com/photo-1528154291023-a6525fabe5b4?auto=format&fit=crop&q=80&w=1200',
    history: '조선 시대 군사 처형장이었으며, 김대건 안드레아 신부님을 포함한 수많은 성직자들이 처형된 곳입니다. 현재는 웅장한 기와지붕의 한옥 양식 성당이 그들의 정신을 기리고 있습니다.',
    coordinates: { lat: 37.5212, lng: 126.9631 }
  }
];

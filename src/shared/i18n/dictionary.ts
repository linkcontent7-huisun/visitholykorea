/**
 * 지원 언어 — 2027 서울 세계청년대회(WYD) 공식 언어에 맞췄다.
 * 해외 청년 20~30만 명이 오는데, 그들이 읽는 언어가 아니면 없는 정보와 같다.
 */
export type Language = 'ko' | 'en' | 'es' | 'fr' | 'pt' | 'it';

export const LANGUAGES: Language[] = ['ko', 'en', 'es', 'fr', 'pt', 'it'];

/**
 * 저장된 값이 지금 지원하는 언어인지 본다.
 *
 * localStorage 에는 예전 버전이 넣은 값이나 사람이 손댄 값이 남아 있을 수 있다.
 * 그대로 믿고 쓰면 사전에 없는 키를 찾다가 화면이 빈다.
 */
export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as string[]).includes(value);
}

/** 언어 전환 버튼에 쓸 이름. 자기 언어로 적는다 — 못 읽는 언어로 쓰면 고를 수가 없다. */
export const LANGUAGE_LABEL: Record<Language, string> = {
  ko: '한국어',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  it: 'Italiano',
};

/** 언어 버튼에 짧게 표시할 코드. */
export const LANGUAGE_SHORT: Record<Language, string> = {
  ko: 'KO',
  en: 'EN',
  es: 'ES',
  fr: 'FR',
  pt: 'PT',
  it: 'IT',
};

/**
 * 음성 합성용 로케일.
 * 포르투갈어는 pt-BR 음성이 기기에 훨씬 많이 깔려 있어 그쪽을 쓴다
 * (본문은 브라질·포르투갈 모두 읽을 수 있는 표현으로 적는다).
 */
export const SPEECH_LOCALE: Record<Language, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  pt: 'pt-BR',
  it: 'it-IT',
};

/**
 * 번역이 없을 때 내려갈 순서.
 *
 * 스페인어 사용자에게 번역이 없다고 한국어를 보여주면 아무것도 못 읽는다.
 * 영어를 한 단계 거치면 최소한 읽을 수는 있다 — 영어는 208곳 전부 있다.
 */
export const FALLBACK_CHAIN: Record<Language, Language[]> = {
  ko: [],
  en: ['ko'],
  es: ['en', 'ko'],
  fr: ['en', 'ko'],
  pt: ['en', 'ko'],
  it: ['en', 'ko'],
};

/**
 * UI 문구.
 *
 * 언어를 늘릴 때는 `Language` 에 코드를 넣고 이 표를 채우면 타입 검사가 빠진 곳을 잡아 준다.
 *
 * 성지 설명 본문은 여기가 아니라 DB(`holy_site_translations`)에 있다.
 * 화면 문구와 콘텐츠는 갱신 주기가 달라서 섞으면 둘 다 관리가 어려워진다.
 */
export const DICTIONARY = {
  // 내비게이션
  home: { ko: '홈', en: 'Home', es: 'Inicio', fr: 'Accueil', pt: 'Início', it: 'Home' },
  map: { ko: '지도', en: 'Map', es: 'Mapa', fr: 'Carte', pt: 'Mapa', it: 'Mappa' },
  explore: { ko: '탐색', en: 'Explore', es: 'Explorar', fr: 'Explorer', pt: 'Explorar', it: 'Esplora' },
  record: { ko: '기록', en: 'Record', es: 'Registro', fr: 'Carnet', pt: 'Registro', it: 'Diario' },
  menu: { ko: '더보기', en: 'More', es: 'Más', fr: 'Plus', pt: 'Mais', it: 'Altro' },

  // 공통
  search: { ko: '검색', en: 'Search', es: 'Buscar', fr: 'Rechercher', pt: 'Buscar', it: 'Cerca' },
  login: { ko: '로그인', en: 'Log in', es: 'Iniciar sesión', fr: 'Connexion', pt: 'Entrar', it: 'Accedi' },
  logout: { ko: '로그아웃', en: 'Log out', es: 'Cerrar sesión', fr: 'Déconnexion', pt: 'Sair', it: 'Esci' },
  signup: { ko: '회원가입', en: 'Sign up', es: 'Registrarse', fr: 'S’inscrire', pt: 'Cadastrar-se', it: 'Registrati' },
  close: { ko: '닫기', en: 'Close', es: 'Cerrar', fr: 'Fermer', pt: 'Fechar', it: 'Chiudi' },
  back: { ko: '뒤로', en: 'Back', es: 'Atrás', fr: 'Retour', pt: 'Voltar', it: 'Indietro' },
  copied: { ko: '복사했어요', en: 'Copied', es: 'Copiado', fr: 'Copié', pt: 'Copiado', it: 'Copiato' },
  copyFailed: {
    ko: '길게 눌러 복사해 주세요',
    en: 'Press and hold to copy',
    es: 'Mantén pulsado para copiar',
    fr: 'Appuyez longuement pour copier',
    pt: 'Toque e segure para copiar',
    it: 'Tieni premuto per copiare',
  },

  // 설정
  myProfile: { ko: '내 프로필', en: 'My Profile', es: 'Mi perfil', fr: 'Mon profil', pt: 'Meu perfil', it: 'Il mio profilo' },
  favorites: {
    ko: '즐겨찾는 성지',
    en: 'Favorite Sites',
    es: 'Santuarios favoritos',
    fr: 'Sanctuaires favoris',
    pt: 'Santuários favoritos',
    it: 'Santuari preferiti',
  },
  appSettings: { ko: '앱 설정', en: 'App Settings', es: 'Ajustes', fr: 'Paramètres', pt: 'Configurações', it: 'Impostazioni' },
  languageSetting: { ko: '언어 설정', en: 'Language', es: 'Idioma', fr: 'Langue', pt: 'Idioma', it: 'Lingua' },
  largeTextSetting: {
    ko: '큰 글자 모드',
    en: 'Large Text',
    es: 'Texto grande',
    fr: 'Grand texte',
    pt: 'Texto grande',
    it: 'Testo grande',
  },
  supportInfo: {
    ko: '지원 및 정보',
    en: 'Support & Info',
    es: 'Ayuda e información',
    fr: 'Aide et informations',
    pt: 'Ajuda e informações',
    it: 'Assistenza e informazioni',
  },

  // 순례 여권
  stampButton: {
    ko: '순례 스탬프 찍기',
    en: 'Add Pilgrimage Stamp',
    es: 'Añadir sello de peregrino',
    fr: 'Ajouter un tampon de pèlerin',
    pt: 'Adicionar selo de peregrino',
    it: 'Aggiungi timbro del pellegrino',
  },
  stampDone: {
    ko: '순례 스탬프 완료',
    en: 'Stamp Collected',
    es: 'Sello conseguido',
    fr: 'Tampon obtenu',
    pt: 'Selo obtido',
    it: 'Timbro ottenuto',
  },
  pilgrimPassport: {
    ko: '순례 여권',
    en: 'Pilgrim Passport',
    es: 'Pasaporte del peregrino',
    fr: 'Passeport du pèlerin',
    pt: 'Passaporte do peregrino',
    it: 'Passaporto del pellegrino',
  },

  // 오늘의 쉼표 (오버투어리즘 분산)
  quietTitle: {
    ko: '오늘, 조용한 자리',
    en: 'Quiet places today',
    es: 'Lugares tranquilos hoy',
    fr: 'Lieux calmes aujourd’hui',
    pt: 'Lugares tranquilos hoje',
    it: 'Luoghi tranquilli oggi',
  },
  quietSubtitle: {
    ko: '한국관광공사 실시간 축제·관광 정보로 오늘의 붐빔을 계산했어요',
    en: 'Crowding estimated from Korea Tourism Organization live festival and attraction data',
    es: 'Afluencia estimada con datos en directo de festivales y atracciones de la Organización de Turismo de Corea',
    fr: 'Affluence estimée à partir des données en temps réel des festivals et sites de l’Office du tourisme coréen',
    pt: 'Movimento estimado com dados ao vivo de festivais e atrações da Organização de Turismo da Coreia',
    it: 'Affluenza stimata dai dati in tempo reale su feste e attrazioni dell’Ente del Turismo Coreano',
  },
  quietLoading: {
    ko: '오늘 열리는 행사를 확인하는 중…',
    en: 'Checking today’s events…',
    es: 'Comprobando los eventos de hoy…',
    fr: 'Vérification des événements du jour…',
    pt: 'Verificando os eventos de hoje…',
    it: 'Controllo degli eventi di oggi…',
  },
  quietDisclaimer: {
    ko: '공사 데이터에는 실시간 혼잡도가 없어, 오늘 열리는 행사와 주변 관광 시설 밀도로 추정한 값입니다. 실제와 다를 수 있어요.',
    en: 'The tourism API has no live crowd counts. This is an estimate from today’s events and nearby facility density, so it may differ from reality.',
    es: 'La API de turismo no ofrece recuentos de personas en tiempo real. Es una estimación basada en los eventos de hoy y la densidad de instalaciones cercanas, así que puede diferir de la realidad.',
    fr: 'L’API touristique ne fournit pas de comptage en temps réel. Il s’agit d’une estimation fondée sur les événements du jour et la densité des équipements alentour ; elle peut différer de la réalité.',
    pt: 'A API de turismo não fornece contagem de pessoas em tempo real. Esta é uma estimativa a partir dos eventos de hoje e da densidade de instalações próximas, portanto pode diferir da realidade.',
    it: 'L’API turistica non fornisce conteggi in tempo reale. Questa è una stima basata sugli eventi di oggi e sulla densità delle strutture vicine, quindi può differire dalla realtà.',
  },

  // 홈 화면 — 외국인이 앱을 열었을 때 가장 먼저 보는 문구들
  quietHeroTitle: {
    ko: '고요 속으로',
    en: 'Into the quiet',
    es: 'Hacia el silencio',
    fr: 'Vers le silence',
    pt: 'Rumo ao silêncio',
    it: 'Verso il silenzio',
  },
  quietHeroSubtitle: {
    ko: '한국관광공사 실시간 축제·관광 정보로 일상의 소음을 한 발 물러났어요',
    en: 'A step away from the noise, using live festival and attraction data from the Korea Tourism Organization',
    es: 'Un paso lejos del ruido, con datos en vivo de festivales y atracciones de la Organización de Turismo de Corea',
    fr: 'Un pas hors du bruit, grâce aux données en temps réel de l’Office du tourisme coréen',
    pt: 'Um passo para longe do ruído, com dados ao vivo da Organização de Turismo da Coreia',
    it: 'Un passo lontano dal rumore, con i dati in tempo reale dell’Ente del Turismo Coreano',
  },
  alternativesCta: {
    ko: '가려던 곳이 붐빈다면?',
    en: 'Is your destination crowded?',
    es: '¿Tu destino está lleno?',
    fr: 'Votre destination est bondée ?',
    pt: 'Seu destino está lotado?',
    it: 'La tua meta è affollata?',
  },
  alternativesCtaAccent: {
    ko: '대신 여기',
    en: 'Try here instead',
    es: 'Prueba aquí',
    fr: 'Essayez plutôt ici',
    pt: 'Tente aqui',
    it: 'Prova qui',
  },
  alternativesTitle: {
    ko: '가려던 곳이 붐비나요?',
    en: 'Is the place you planned crowded?',
    es: '¿Está lleno el lugar que planeaste?',
    fr: 'Le lieu prévu est-il bondé ?',
    pt: 'O lugar que planejou está lotado?',
    it: 'Il luogo che hai scelto è affollato?',
  },
  alternativesSubtitle: {
    ko: '관광지를 검색하면 오늘 붐빔과 근처의 조용한 성지를 알려드려요',
    en: 'Search an attraction to see today’s crowding and quiet shrines nearby',
    es: 'Busca una atracción para ver la afluencia de hoy y santuarios tranquilos cerca',
    fr: 'Cherchez un site pour voir l’affluence du jour et les sanctuaires calmes à proximité',
    pt: 'Busque uma atração para ver o movimento de hoje e santuários tranquilos por perto',
    it: 'Cerca un’attrazione per vedere l’affluenza di oggi e i santuari tranquilli vicini',
  },
  aiGuideTitle: {
    ko: 'AI 순례 가이드',
    en: 'AI Pilgrimage Guide',
    es: 'Guía de peregrinación con IA',
    fr: 'Guide de pèlerinage IA',
    pt: 'Guia de peregrinação com IA',
    it: 'Guida al pellegrinaggio con IA',
  },
  aiGuideBody: {
    ko: '성지 순례에 대한 모든 것! 무엇이든 물어보세요.',
    en: 'Everything about pilgrimage — ask anything.',
    es: 'Todo sobre la peregrinación: pregunta lo que quieras.',
    fr: 'Tout sur le pèlerinage — posez vos questions.',
    pt: 'Tudo sobre peregrinação — pergunte o que quiser.',
    it: 'Tutto sul pellegrinaggio — chiedi pure.',
  },
  aiGuideAsk: {
    ko: '질문하기',
    en: 'Ask a question',
    es: 'Preguntar',
    fr: 'Poser une question',
    pt: 'Perguntar',
    it: 'Fai una domanda',
  },
  searchPlaceholder: {
    ko: '성지 검색 또는 미카엘 AI에게 물어보기',
    en: 'Search shrines, or ask Michael the AI guide',
    es: 'Busca santuarios o pregunta a Michael, la guía IA',
    fr: 'Cherchez un sanctuaire ou interrogez Michael, le guide IA',
    pt: 'Busque santuários ou pergunte ao Michael, o guia de IA',
    it: 'Cerca santuari o chiedi a Michael, la guida IA',
  },
  coursesTitle: {
    ko: '쉼표 순례길',
    en: 'Pause & Pilgrimage',
    es: 'Camino de pausa',
    fr: 'Chemin de la pause',
    pt: 'Caminho da pausa',
    it: 'Cammino della pausa',
  },
  coursesSubtitle: {
    ko: '지금 마음에 필요한 쉼표를 골라보세요',
    en: 'Choose the kind of rest your heart needs today',
    es: 'Elige el descanso que tu corazón necesita hoy',
    fr: 'Choisissez le repos dont votre cœur a besoin',
    pt: 'Escolha o descanso que seu coração precisa hoje',
    it: 'Scegli il riposo di cui il tuo cuore ha bisogno',
  },
  compassCtaTitle: {
    ko: '몇 가지 질문으로 나에게 맞는 곳 찾기',
    en: 'A few questions to find your place',
    es: 'Unas preguntas para encontrar tu lugar',
    fr: 'Quelques questions pour trouver votre lieu',
    pt: 'Algumas perguntas para achar seu lugar',
    it: 'Poche domande per trovare il tuo luogo',
  },
  compassCtaSubtitle: {
    ko: '마음 나침반이 당신의 쉼의 자리를 안내해드려요',
    en: 'The Heart Compass points you to your place of rest',
    es: 'La Brújula del Corazón te guía a tu lugar de descanso',
    fr: 'La Boussole du cœur vous mène à votre lieu de repos',
    pt: 'A Bússola do Coração leva você ao seu lugar de descanso',
    it: 'La Bussola del cuore ti guida al tuo luogo di riposo',
  },
  exploreAllTitle: {
    ko: '전국 성지 탐방',
    en: 'Shrines across Korea',
    es: 'Santuarios por toda Corea',
    fr: 'Sanctuaires dans toute la Corée',
    pt: 'Santuários por toda a Coreia',
    it: 'Santuari in tutta la Corea',
  },
  coursesEmpty: {
    ko: '이 감정에 맞는 코스를 아직 준비 중이에요.',
    en: 'Courses for this feeling are still being prepared.',
    es: 'Aún estamos preparando rutas para este sentimiento.',
    fr: 'Les parcours pour cette émotion sont en préparation.',
    pt: 'Ainda estamos preparando rotas para este sentimento.',
    it: 'I percorsi per questa emozione sono in preparazione.',
  },
  quietErrorTitle: {
    ko: '오늘의 붐빔을 계산하지 못했어요',
    en: 'Could not calculate today’s crowding',
    es: 'No se pudo calcular la afluencia de hoy',
    fr: 'Impossible de calculer l’affluence du jour',
    pt: 'Não foi possível calcular o movimento de hoje',
    it: 'Non è stato possibile calcolare l’affluenza di oggi',
  },
  quietErrorBody: {
    ko: '관광 정보를 불러오는 중 문제가 생겼습니다. 잠시 후 다시 열어주세요.',
    en: 'Something went wrong loading tourism data. Please try again shortly.',
    es: 'Hubo un problema al cargar los datos turísticos. Inténtalo de nuevo en un momento.',
    fr: 'Une erreur est survenue lors du chargement des données. Réessayez dans un instant.',
    pt: 'Houve um problema ao carregar os dados turísticos. Tente novamente em instantes.',
    it: 'Si è verificato un problema nel caricare i dati turistici. Riprova tra poco.',
  },
  quietQuotaTitle: {
    ko: '오늘 조회 한도에 도달했어요',
    en: 'Today’s data limit has been reached',
    es: 'Se alcanzó el límite de consultas de hoy',
    fr: 'La limite de requêtes du jour est atteinte',
    pt: 'O limite de consultas de hoje foi atingido',
    it: 'È stato raggiunto il limite di richieste di oggi',
  },
  quietQuotaBody: {
    ko: '많은 분이 함께 보고 계셔서 오늘의 관광 정보 조회가 잠시 멈췄어요. 내일 다시 열어보시면 정상적으로 보여요.',
    en: 'Many people are viewing at once, so tourism lookups have paused for today. It will work again tomorrow.',
    es: 'Muchas personas están consultando a la vez, así que las búsquedas se han pausado hoy. Mañana funcionará de nuevo.',
    fr: 'Beaucoup de personnes consultent en même temps ; les recherches sont en pause aujourd’hui. Cela refonctionnera demain.',
    pt: 'Muitas pessoas estão acessando ao mesmo tempo, então as consultas pausaram hoje. Amanhã volta a funcionar.',
    it: 'Molte persone stanno consultando insieme, quindi le ricerche sono in pausa oggi. Domani tornerà a funzionare.',
  },

  // 찾아가는 길 — 외국인에게 가장 중요한 화면
  directions: { ko: '찾아가는 길', en: 'Getting there', es: 'Cómo llegar', fr: 'S’y rendre', pt: 'Como chegar', it: 'Come arrivare' },
  addressKorean: {
    ko: '한국어 주소',
    en: 'Address in Korean',
    es: 'Dirección en coreano',
    fr: 'Adresse en coréen',
    pt: 'Endereço em coreano',
    it: 'Indirizzo in coreano',
  },
  addressHint: {
    ko: '택시를 탈 때 이 주소를 보여주세요',
    en: 'Show this to a taxi driver — Korean drivers may not read English addresses',
    es: 'Muestra esto al taxista: puede que no lea direcciones en inglés',
    fr: 'Montrez ceci au chauffeur de taxi : il ne lit peut-être pas les adresses en anglais',
    pt: 'Mostre isto ao motorista de táxi: ele pode não ler endereços em inglês',
    it: 'Mostra questo al tassista: potrebbe non leggere indirizzi in inglese',
  },
  coordinates: { ko: '좌표', en: 'Coordinates', es: 'Coordenadas', fr: 'Coordonnées', pt: 'Coordenadas', it: 'Coordinate' },
  openInMapApp: {
    ko: '지도 앱으로 열기',
    en: 'Open in a map app',
    es: 'Abrir en una app de mapas',
    fr: 'Ouvrir dans une app de cartes',
    pt: 'Abrir num app de mapas',
    it: 'Apri in un’app di mappe',
  },
  googleNote: {
    ko: '한국에서는 자동차 길찾기가 나오지 않아요. 대중교통·도보는 됩니다',
    en: 'Car directions are unavailable in Korea by law. Transit and walking work',
    es: 'En Corea no hay indicaciones para coche por ley. Sí funcionan transporte público y a pie',
    fr: 'En Corée, l’itinéraire en voiture est indisponible par la loi. Transports et marche fonctionnent',
    pt: 'Na Coreia, rotas de carro são indisponíveis por lei. Transporte público e a pé funcionam',
    it: 'In Corea le indicazioni in auto non sono disponibili per legge. Mezzi pubblici e a piedi funzionano',
  },
  appleNote: {
    ko: 'iPhone 기본 지도',
    en: 'Default map app on iPhone',
    es: 'App de mapas por defecto en iPhone',
    fr: 'App de cartes par défaut sur iPhone',
    pt: 'App de mapas padrão no iPhone',
    it: 'App mappe predefinita su iPhone',
  },
  kakaoNote: {
    ko: '한국에서 가장 정확해요',
    en: 'Most accurate in Korea — the app is worth installing',
    es: 'La más precisa en Corea; vale la pena instalarla',
    fr: 'La plus précise en Corée ; l’app vaut la peine',
    pt: 'A mais precisa na Coreia; vale a pena instalar',
    it: 'La più precisa in Corea: vale la pena installarla',
  },
  naverNote: {
    ko: '대중교통 안내에 강해요',
    en: 'Best for public transport in Korea',
    es: 'La mejor para el transporte público en Corea',
    fr: 'La meilleure pour les transports en Corée',
    pt: 'A melhor para transporte público na Coreia',
    it: 'La migliore per i mezzi pubblici in Corea',
  },
  noCoordinates: {
    ko: '아직 좌표가 확인되지 않은 성지예요',
    en: 'Coordinates for this site are not confirmed yet',
    es: 'Las coordenadas de este lugar aún no están confirmadas',
    fr: 'Les coordonnées de ce lieu ne sont pas encore confirmées',
    pt: 'As coordenadas deste local ainda não foram confirmadas',
    it: 'Le coordinate di questo luogo non sono ancora confermate',
  },

  // 방문 안내 — 비신자·외국인의 "실례할까봐"를 없애는 문구
  beforeYouGo: {
    ko: '들어가기 전에',
    en: 'Before you go in',
    es: 'Antes de entrar',
    fr: 'Avant d’entrer',
    pt: 'Antes de entrar',
    it: 'Prima di entrare',
  },
  etiquetteBow: {
    ko: '문 앞에서 가볍게 목례하면 됩니다',
    en: 'A small bow at the door is enough',
    es: 'Basta con una pequeña inclinación en la puerta',
    fr: 'Une légère inclinaison à la porte suffit',
    pt: 'Uma leve reverência na porta é suficiente',
    it: 'Basta un lieve inchino sulla porta',
  },
  etiquetteHolyWater: {
    ko: '성수는 안 찍어도 괜찮아요',
    en: 'You don’t need to use the holy water',
    es: 'No hace falta usar el agua bendita',
    fr: 'Vous n’êtes pas obligé d’utiliser l’eau bénite',
    pt: 'Não é preciso usar a água benta',
    it: 'Non è necessario usare l’acqua benedetta',
  },
  etiquetteSeat: {
    ko: '뒷자리 아무 데나 앉으시면 됩니다',
    en: 'Sit anywhere in the back rows',
    es: 'Siéntate donde quieras en las últimas filas',
    fr: 'Asseyez-vous où vous voulez dans les derniers rangs',
    pt: 'Sente-se onde quiser nas últimas fileiras',
    it: 'Siediti dove vuoi nelle ultime file',
  },
  etiquetteWelcome: {
    ko: '신자가 아니어도, 기도를 안 해도 괜찮습니다',
    en: 'You don’t have to be Catholic, and you don’t have to pray',
    es: 'No hace falta ser católico ni rezar',
    fr: 'Vous n’avez pas à être catholique, ni à prier',
    pt: 'Você não precisa ser católico nem rezar',
    it: 'Non devi essere cattolico né pregare',
  },
  etiquettePhoto: {
    ko: '미사 중에는 사진을 찍지 말아 주세요',
    en: 'Please don’t take photos during Mass',
    es: 'Por favor, no hagas fotos durante la misa',
    fr: 'Merci de ne pas photographier pendant la messe',
    pt: 'Por favor, não tire fotos durante a missa',
    it: 'Per favore non fotografare durante la Messa',
  },
} as const satisfies Record<string, Record<Language, string>>;

export type TranslationKey = keyof typeof DICTIONARY;

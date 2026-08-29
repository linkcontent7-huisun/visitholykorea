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

/**
 `* 문구 안의 {n} 같은 자리표시자를 값으로 바꾼다.
 *
 * 숫자가 섞인 문장은 언어마다 어순이 달라서("{n} of {total}" vs "{total}곳 가운데 {n}곳")
 * 조각을 이어 붙이면 번역이 불가능해진다. 문장 전체를 사전에 두고 값만 끼워 넣는다.
 * 값이 없는 자리표시자는 그대로 남긴다 — 몰래 빈칸이 되면 원인을 찾기 어렵다.
 */
export function fillPlaceholders(
  text: string,
  values: Record<string, string | number>,
): string {
  return text.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
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

  // 탐색 화면
  exploreTitle: {
    ko: '탐색',
    en: 'Explore',
    es: 'Explorar',
    fr: 'Explorer',
    pt: 'Explorar',
    it: 'Esplora',
  },
  exploreSubtitle: {
    ko: '전국의 성스러운 자취를 찾아서',
    en: 'Tracing sacred footsteps across Korea',
    es: 'Tras las huellas sagradas de toda Corea',
    fr: 'Sur les traces sacrées à travers la Corée',
    pt: 'Seguindo os passos sagrados por toda a Coreia',
    it: 'Sulle tracce sacre in tutta la Corea',
  },
  routesTitle: {
    ko: '순례 코스',
    en: 'Pilgrimage Routes',
    es: 'Rutas de peregrinación',
    fr: 'Itinéraires de pèlerinage',
    pt: 'Rotas de peregrinação',
    it: 'Itinerari di pellegrinaggio',
  },
  routesSubtitle: {
    ko: '박해의 역사를 따라 걷는 길',
    en: 'Walking the history of persecution',
    es: 'Caminos que siguen la historia de la persecución',
    fr: 'Marcher sur l’histoire des persécutions',
    pt: 'Caminhos que seguem a história da perseguição',
    it: 'Camminare lungo la storia delle persecuzioni',
  },
  byDiocese: {
    ko: '교구별 탐색',
    en: 'Browse by diocese',
    es: 'Explorar por diócesis',
    fr: 'Parcourir par diocèse',
    pt: 'Explorar por diocese',
    it: 'Sfoglia per diocesi',
  },
  noSites: {
    ko: '아직 등록된 성지가 없습니다.',
    en: 'No shrines registered yet.',
    es: 'Aún no hay santuarios registrados.',
    fr: 'Aucun sanctuaire enregistré pour l’instant.',
    pt: 'Ainda não há santuários cadastrados.',
    it: 'Nessun santuario registrato finora.',
  },

  // 검색 화면
  searchInputPlaceholder: {
    ko: '성지명, 지역, 성인 검색...',
    en: 'Search by shrine, region, or saint…',
    es: 'Busca por santuario, región o santo…',
    fr: 'Chercher par sanctuaire, région ou saint…',
    pt: 'Busque por santuário, região ou santo…',
    it: 'Cerca per santuario, regione o santo…',
  },
  searchPromptTitle: {
    ko: '무엇을 찾고 싶으신가요?',
    en: 'What are you looking for?',
    es: '¿Qué estás buscando?',
    fr: 'Que cherchez-vous ?',
    pt: 'O que você procura?',
    it: 'Che cosa stai cercando?',
  },
  searchPromptBody: {
    ko: '성지명, 지역, 소재지로 검색해보세요.',
    en: 'Try a shrine name, a region, or an address.',
    es: 'Prueba con el nombre de un santuario, una región o una dirección.',
    fr: 'Essayez un nom de sanctuaire, une région ou une adresse.',
    pt: 'Tente o nome de um santuário, uma região ou um endereço.',
    it: 'Prova con il nome di un santuario, una regione o un indirizzo.',
  },
  searchResults: {
    ko: '검색 결과',
    en: 'Results',
    es: 'Resultados',
    fr: 'Résultats',
    pt: 'Resultados',
    it: 'Risultati',
  },
  aiGuideName: {
    ko: 'AI 순례 가이드 미카엘',
    en: 'Michael, the AI pilgrimage guide',
    es: 'Michael, la guía de peregrinación con IA',
    fr: 'Michael, le guide de pèlerinage IA',
    pt: 'Michael, o guia de peregrinação com IA',
    it: 'Michael, la guida al pellegrinaggio con IA',
  },

  // 지도 화면
  mapTitle: {
    ko: '순례 지도',
    en: 'Pilgrimage Map',
    es: 'Mapa de peregrinación',
    fr: 'Carte du pèlerinage',
    pt: 'Mapa da peregrinação',
    it: 'Mappa del pellegrinaggio',
  },
  mapSearchSite: {
    ko: '성지 이름 검색',
    en: 'Search shrine name',
    es: 'Buscar nombre del santuario',
    fr: 'Rechercher un sanctuaire',
    pt: 'Buscar nome do santuário',
    it: 'Cerca il nome del santuario',
  },
  dioceseProgress: {
    ko: '교구별 진행',
    en: 'Progress by diocese',
    es: 'Progreso por diócesis',
    fr: 'Progression par diocèse',
    pt: 'Progresso por diocese',
    it: 'Progressi per diocesi',
  },
  visited: {
    ko: '다녀옴',
    en: 'Visited',
    es: 'Visitado',
    fr: 'Visité',
    pt: 'Visitado',
    it: 'Visitato',
  },
  markVisited: {
    ko: '다녀왔어요',
    en: 'I’ve been here',
    es: 'Ya he estado aquí',
    fr: 'J’y suis allé',
    pt: 'Já estive aqui',
    it: 'Ci sono stato',
  },

  // 기록 화면
  recordsTitle: {
    ko: '기록',
    en: 'My Record',
    es: 'Mi registro',
    fr: 'Mon carnet',
    pt: 'Meu registro',
    it: 'Il mio diario',
  },
  recordsLoginTitle: {
    ko: '순례 기록은 로그인 후에 남아요',
    en: 'Your pilgrimage record is saved once you log in',
    es: 'Tu registro de peregrinación se guarda al iniciar sesión',
    fr: 'Votre carnet est conservé une fois connecté',
    pt: 'Seu registro é salvo depois de entrar',
    it: 'Il tuo diario viene salvato dopo l’accesso',
  },
  recordsLoginBody: {
    ko: '다녀온 성지에 스탬프를 찍고 여행기를 남기면\n나만의 순례 여권이 채워집니다.',
    en: 'Collect stamps and write journals at the shrines you visit,\nand your own pilgrim passport fills up.',
    es: 'Consigue sellos y escribe diarios en los santuarios que visites,\ny tu pasaporte de peregrino se irá llenando.',
    fr: 'Collectez des tampons et écrivez vos récits dans les sanctuaires visités,\net votre passeport de pèlerin se remplira.',
    pt: 'Colete selos e escreva relatos nos santuários que visitar,\ne seu passaporte de peregrino vai se preenchendo.',
    it: 'Raccogli timbri e scrivi i tuoi racconti nei santuari che visiti,\ne il tuo passaporto del pellegrino si riempirà.',
  },
  recordsLoginCta: {
    ko: '로그인하고 순례 기록 시작하기',
    en: 'Log in and start your record',
    es: 'Inicia sesión y comienza tu registro',
    fr: 'Connectez-vous et commencez votre carnet',
    pt: 'Entre e comece seu registro',
    it: 'Accedi e inizia il tuo diario',
  },
  logsEmptyTitle: {
    ko: '다녀온 성지를 기록해보세요',
    en: 'Write about the shrines you’ve visited',
    es: 'Escribe sobre los santuarios que has visitado',
    fr: 'Écrivez sur les sanctuaires que vous avez visités',
    pt: 'Escreva sobre os santuários que visitou',
    it: 'Scrivi dei santuari che hai visitato',
  },
  logsEmptyBody: {
    ko: '내 순례의 감동과 기도를 기록으로 남기고\n다른 순례자들과 마음을 나누어보세요.',
    en: 'Record the moments and prayers of your pilgrimage,\nand share them with fellow pilgrims.',
    es: 'Registra los momentos y oraciones de tu peregrinación\ny compártelos con otros peregrinos.',
    fr: 'Consignez les moments et les prières de votre pèlerinage,\net partagez-les avec d’autres pèlerins.',
    pt: 'Registre os momentos e orações da sua peregrinação\ne compartilhe com outros peregrinos.',
    it: 'Annota i momenti e le preghiere del tuo pellegrinaggio\ne condividili con altri pellegrini.',
  },
  stampsEmptyTitle: {
    ko: '아직 스탬프가 없어요',
    en: 'No stamps yet',
    es: 'Aún no hay sellos',
    fr: 'Pas encore de tampons',
    pt: 'Ainda não há selos',
    it: 'Nessun timbro finora',
  },
  sitesVisitedSuffix: {
    ko: '곳 순례',
    en: 'shrines visited',
    es: 'santuarios visitados',
    fr: 'sanctuaires visités',
    pt: 'santuários visitados',
    it: 'santuari visitati',
  },

  // 지도 범례·진행 — {n}·{total} 은 화면에서 숫자로 바뀐다
  loading: {
    ko: '불러오는 중…',
    en: 'Loading…',
    es: 'Cargando…',
    fr: 'Chargement…',
    pt: 'Carregando…',
    it: 'Caricamento…',
  },
  mapProgress: {
    ko: '{total}곳 가운데 {n}곳을 다녀오셨습니다',
    en: 'You’ve visited {n} of {total} shrines',
    es: 'Has visitado {n} de {total} santuarios',
    fr: 'Vous avez visité {n} sanctuaires sur {total}',
    pt: 'Você visitou {n} de {total} santuários',
    it: 'Hai visitato {n} santuari su {total}',
  },
  mapOffMap: {
    ko: '좌표가 없어 지도에 표시하지 못한 곳 {n}곳',
    en: '{n} shrines have no coordinates and are not on the map',
    es: '{n} santuarios no tienen coordenadas y no aparecen en el mapa',
    fr: '{n} sanctuaires sans coordonnées ne figurent pas sur la carte',
    pt: '{n} santuários não têm coordenadas e não aparecem no mapa',
    it: '{n} santuari non hanno coordinate e non sono sulla mappa',
  },
  legendVisited: {
    ko: '다녀온 곳',
    en: 'Visited',
    es: 'Visitados',
    fr: 'Visités',
    pt: 'Visitados',
    it: 'Visitati',
  },
  legendAlmost: {
    ko: '조금 남은 교구',
    en: 'Almost complete',
    es: 'Casi completas',
    fr: 'Presque terminés',
    pt: 'Quase completas',
    it: 'Quasi completate',
  },
  legendNotYet: {
    ko: '아직',
    en: 'Not yet',
    es: 'Todavía no',
    fr: 'Pas encore',
    pt: 'Ainda não',
    it: 'Non ancora',
  },
  legendOrder: {
    ko: '지나온 순서 (최근일수록 진하게)',
    en: 'Order visited (darker is more recent)',
    es: 'Orden de visita (más oscuro es más reciente)',
    fr: 'Ordre des visites (plus foncé = plus récent)',
    pt: 'Ordem das visitas (mais escuro é mais recente)',
    it: 'Ordine delle visite (più scuro = più recente)',
  },

  // 마음 나침반 — 7문항 안내 + 결과
  compassTitle: {
    ko: '마음 나침반',
    en: 'Heart Compass',
    es: 'Brújula del corazón',
    fr: 'Boussole du cœur',
    pt: 'Bússola do coração',
    it: 'Bussola del cuore',
  },
  compassPickColor: {
    ko: '마음에 드는 색을 눌러주세요',
    en: 'Tap the colour you are drawn to',
    es: 'Toca el color que te atraiga',
    fr: 'Touchez la couleur qui vous attire',
    pt: 'Toque na cor que mais lhe atrai',
    it: 'Tocca il colore che ti attira',
  },
  compassNearbyNote: {
    ko: '가까운 곳부터 안내해드릴게요',
    en: 'We’ll start with places near you',
    es: 'Empezaremos por los lugares cercanos',
    fr: 'Nous commencerons par les lieux proches',
    pt: 'Vamos começar pelos lugares próximos',
    it: 'Inizieremo dai luoghi vicini',
  },
  compassFreeText: {
    ko: '여기에 적어주세요... (선택)',
    en: 'Write here… (optional)',
    es: 'Escribe aquí… (opcional)',
    fr: 'Écrivez ici… (facultatif)',
    pt: 'Escreva aqui… (opcional)',
    it: 'Scrivi qui… (facoltativo)',
  },
  compassBack: {
    ko: '좀 전으로',
    en: 'Back',
    es: 'Atrás',
    fr: 'Retour',
    pt: 'Voltar',
    it: 'Indietro',
  },
  compassNext: {
    ko: '다음으로',
    en: 'Next',
    es: 'Siguiente',
    fr: 'Suivant',
    pt: 'Próximo',
    it: 'Avanti',
  },
  compassSeeResult: {
    ko: '결과 보기',
    en: 'See results',
    es: 'Ver resultados',
    fr: 'Voir les résultats',
    pt: 'Ver resultados',
    it: 'Vedi i risultati',
  },

  // 나침반 — 지금 마음이 어떤가 (선택지와 그에 대한 응답)
  compassReasonWork: {
    ko: '일과 진로',
    en: 'Work and career',
    es: 'Trabajo y carrera',
    fr: 'Travail et carrière',
    pt: 'Trabalho e carreira',
    it: 'Lavoro e carriera',
  },
  compassReasonWorkReply: {
    ko: '일과 진로로 마음이 분주하셨죠.',
    en: 'Work and the road ahead have kept your mind busy.',
    es: 'El trabajo y el camino por delante te han tenido la mente ocupada.',
    fr: 'Le travail et l’avenir ont occupé votre esprit.',
    pt: 'O trabalho e o caminho à frente ocuparam sua mente.',
    it: 'Il lavoro e il futuro ti hanno tenuto la mente occupata.',
  },
  compassReasonPeople: {
    ko: '사람들과의 관계',
    en: 'Relationships',
    es: 'Relaciones',
    fr: 'Relations',
    pt: 'Relacionamentos',
    it: 'Relazioni',
  },
  compassReasonPeopleReply: {
    ko: '사람 사이에서 마음을 많이 쓰셨겠어요.',
    en: 'You must have given a lot of yourself to others.',
    es: 'Habrás dado mucho de ti a los demás.',
    fr: 'Vous avez sans doute beaucoup donné aux autres.',
    pt: 'Você deve ter dado muito de si aos outros.',
    it: 'Avrai dato molto di te agli altri.',
  },
  compassReasonFamily: {
    ko: '육아와 가족',
    en: 'Family and caregiving',
    es: 'Familia y cuidado',
    fr: 'Famille et soins',
    pt: 'Família e cuidados',
    it: 'Famiglia e cura',
  },
  compassReasonFamilyReply: {
    ko: '아이를 돌보느라 정작 나를 돌볼 틈이 없으셨겠어요.',
    en: 'Caring for others, you may have had no room to care for yourself.',
    es: 'Cuidando de otros, quizá no te quedó espacio para cuidarte.',
    fr: 'À force de prendre soin des autres, vous n’avez guère eu de place pour vous.',
    pt: 'Cuidando dos outros, talvez não tenha sobrado espaço para você.',
    it: 'Prendendoti cura degli altri, forse non hai avuto spazio per te.',
  },
  compassReasonSelf: {
    ko: '나 자신을 돌보는 일',
    en: 'Caring for myself',
    es: 'Cuidar de mí',
    fr: 'Prendre soin de moi',
    pt: 'Cuidar de mim',
    it: 'Prendermi cura di me',
  },
  compassReasonSelfReply: {
    ko: '나 자신을 돌보고 싶으셨군요.',
    en: 'You’ve been wanting to look after yourself.',
    es: 'Has querido cuidar de ti mismo.',
    fr: 'Vous souhaitiez prendre soin de vous.',
    pt: 'Você tem querido cuidar de si.',
    it: 'Volevi prenderti cura di te.',
  },
  compassReasonNone: {
    ko: '뚜렷한 이유는 없어요',
    en: 'No particular reason',
    es: 'Sin una razón concreta',
    fr: 'Sans raison particulière',
    pt: 'Sem um motivo específico',
    it: 'Nessun motivo particolare',
  },
  compassReasonNoneReply: {
    ko: '뚜렷한 이유가 없어도, 지친 마음은 그 자체로 소중해요.',
    en: 'Even without a clear reason, a tired heart deserves care.',
    es: 'Aun sin una razón clara, un corazón cansado merece cuidado.',
    fr: 'Même sans raison claire, un cœur fatigué mérite d’être ménagé.',
    pt: 'Mesmo sem um motivo claro, um coração cansado merece cuidado.',
    it: 'Anche senza un motivo chiaro, un cuore stanco merita cura.',
  },

  // 나침반 — 어떤 쉼을 원하는가
  compassWishComfort: {
    ko: '위로가 필요해요',
    en: 'I need comfort',
    es: 'Necesito consuelo',
    fr: 'J’ai besoin de réconfort',
    pt: 'Preciso de consolo',
    it: 'Ho bisogno di conforto',
  },
  compassWishFreshStart: {
    ko: '새로 시작하고 싶어요',
    en: 'I want a fresh start',
    es: 'Quiero empezar de nuevo',
    fr: 'Je veux repartir à zéro',
    pt: 'Quero recomeçar',
    it: 'Voglio ricominciare',
  },
  compassWishCalm: {
    ko: '그저 평온하고 싶어요',
    en: 'I just want peace',
    es: 'Solo quiero paz',
    fr: 'Je veux simplement la paix',
    pt: 'Só quero paz',
    it: 'Voglio solo pace',
  },
  compassWishHealing: {
    ko: '마음을 어루만지고 싶어요',
    en: 'I want my heart tended',
    es: 'Quiero que mi corazón sane',
    fr: 'Je veux apaiser mon cœur',
    pt: 'Quero acalmar meu coração',
    it: 'Voglio lenire il mio cuore',
  },
  compassWishGratitude: {
    ko: '감사한 마음을 나누고 싶어요',
    en: 'I want to share my gratitude',
    es: 'Quiero compartir mi gratitud',
    fr: 'Je veux partager ma gratitude',
    pt: 'Quero compartilhar minha gratidão',
    it: 'Voglio condividere la mia gratitudine',
  },

  // 나침반 — 혼자인가 함께인가
  compassAlone: {
    ko: '혼자 조용히 있고 싶어요',
    en: 'I’d like to be quietly alone',
    es: 'Quisiera estar en silencio, a solas',
    fr: 'J’aimerais être seul, au calme',
    pt: 'Gostaria de ficar em silêncio, sozinho',
    it: 'Vorrei stare in silenzio, da solo',
  },
  compassTogether: {
    ko: '누군가와 이야기 나누고 싶어요',
    en: 'I’d like to talk with someone',
    es: 'Me gustaría hablar con alguien',
    fr: 'J’aimerais parler à quelqu’un',
    pt: 'Gostaria de conversar com alguém',
    it: 'Vorrei parlare con qualcuno',
  },
  compassSilentType: {
    ko: '침묵형',
    en: 'Silence',
    es: 'Silencio',
    fr: 'Silence',
    pt: 'Silêncio',
    it: 'Silenzio',
  },
  compassSharingType: {
    ko: '나눔형',
    en: 'Sharing',
    es: 'Compartir',
    fr: 'Partage',
    pt: 'Partilha',
    it: 'Condivisione',
  },
  compassSilentAdvice: {
    ko: '이곳에서는 혼자 조용히 걸으며 침묵의 시간을 가져보세요.',
    en: 'Here, walk quietly on your own and keep a time of silence.',
    es: 'Aquí, camina en silencio a solas y guarda un tiempo de quietud.',
    fr: 'Ici, marchez seul en silence et gardez un temps de recueillement.',
    pt: 'Aqui, caminhe em silêncio sozinho e guarde um tempo de quietude.',
    it: 'Qui, cammina in silenzio da solo e concediti un tempo di quiete.',
  },
  compassSharingAdvice: {
    ko: '이곳에서는 수도자·사제와 편하게 이야기 나누는 차담 시간을 가져보세요.',
    en: 'Here, share a relaxed tea and conversation with a religious or priest.',
    es: 'Aquí, comparte un té y una charla tranquila con un religioso o sacerdote.',
    fr: 'Ici, partagez un thé et une conversation paisible avec un religieux ou un prêtre.',
    pt: 'Aqui, compartilhe um chá e uma conversa tranquila com um religioso ou padre.',
    it: 'Qui, condividi un tè e una conversazione serena con un religioso o un sacerdote.',
  },
  compassWalkTogetherAdvice: {
    ko: '나란히 걷다 보면 말없이도 나눠져요.',
    en: 'Walking side by side, things are shared without words.',
    es: 'Caminando juntos, se comparte sin palabras.',
    fr: 'En marchant côte à côte, on partage sans mots.',
    pt: 'Caminhando lado a lado, partilha-se sem palavras.',
    it: 'Camminando fianco a fianco, si condivide senza parole.',
  },
  compassSilentStretchAdvice: {
    ko: '함께 걷되 말하지 않는 구간을 하나 두어보세요.',
    en: 'Walk together, but keep one stretch of the path in silence.',
    es: 'Caminad juntos, pero dejad un tramo del camino en silencio.',
    fr: 'Marchez ensemble, mais gardez une portion du chemin en silence.',
    pt: 'Caminhem juntos, mas deixem um trecho do caminho em silêncio.',
    it: 'Camminate insieme, ma lasciate un tratto del cammino in silenzio.',
  },

  // 나침반 — 인원
  compassGroupTwo: {
    ko: '둘이서',
    en: 'Two of us',
    es: 'Los dos',
    fr: 'À deux',
    pt: 'Nós dois',
    it: 'In due',
  },
  compassGroupFew: {
    ko: '3~4명',
    en: '3–4 people',
    es: '3–4 personas',
    fr: '3–4 personnes',
    pt: '3–4 pessoas',
    it: '3–4 persone',
  },
  compassGroupMany: {
    ko: '5명 이상',
    en: '5 or more',
    es: '5 o más',
    fr: '5 ou plus',
    pt: '5 ou mais',
    it: '5 o più',
  },
  compassGroupNote: {
    ko: '단체는 방문 전 성지에 전화로 알려주시면 서로 편해요.',
    en: 'For groups, a phone call to the shrine beforehand makes it easier for everyone.',
    es: 'Para grupos, llamar al santuario antes facilita las cosas para todos.',
    fr: 'Pour les groupes, un appel au sanctuaire à l’avance facilite tout.',
    pt: 'Para grupos, ligar antes para o santuário facilita para todos.',
    it: 'Per i gruppi, una telefonata al santuario in anticipo semplifica tutto.',
  },

  // 나침반 — 머무는 시간
  compassStayHalfDay: {
    ko: '반나절',
    en: 'Half a day',
    es: 'Medio día',
    fr: 'Une demi-journée',
    pt: 'Meio dia',
    it: 'Mezza giornata',
  },
  compassStayHalfDayNote: {
    ko: '짧은 시간이라도 충분해요.',
    en: 'Even a short time is enough.',
    es: 'Incluso un rato corto es suficiente.',
    fr: 'Même un court moment suffit.',
    pt: 'Mesmo um tempo curto já basta.',
    it: 'Anche poco tempo è sufficiente.',
  },
  compassStayDay: {
    ko: '하루',
    en: 'A full day',
    es: 'Un día',
    fr: 'Une journée',
    pt: 'Um dia',
    it: 'Una giornata',
  },
  compassStayDayNote: {
    ko: '하루를 온전히 이곳에 내어주세요.',
    en: 'Give this place a whole day.',
    es: 'Dedica un día entero a este lugar.',
    fr: 'Offrez une journée entière à ce lieu.',
    pt: 'Dedique um dia inteiro a este lugar.',
    it: 'Dedica un’intera giornata a questo luogo.',
  },
  compassStayOvernight: {
    ko: '1박2일',
    en: 'Overnight',
    es: 'Con pernoctación',
    fr: 'Avec une nuit sur place',
    pt: 'Com pernoite',
    it: 'Con pernottamento',
  },
  compassStayOvernightNote: {
    ko: '하룻밤 머물며 천천히 쉬어가세요.',
    en: 'Stay the night and rest slowly.',
    es: 'Quédate a dormir y descansa con calma.',
    fr: 'Passez la nuit et reposez-vous lentement.',
    pt: 'Passe a noite e descanse com calma.',
    it: 'Fermati per la notte e riposa con calma.',
  },

  // 나침반 — 성별(선택)
  compassFemale: {
    ko: '여성',
    en: 'Female',
    es: 'Mujer',
    fr: 'Femme',
    pt: 'Mulher',
    it: 'Donna',
  },
  compassMale: {
    ko: '남성',
    en: 'Male',
    es: 'Hombre',
    fr: 'Homme',
    pt: 'Homem',
    it: 'Uomo',
  },
  compassNoAnswer: {
    ko: '응답 안 함',
    en: 'Prefer not to say',
    es: 'Prefiero no decirlo',
    fr: 'Je préfère ne pas répondre',
    pt: 'Prefiro não dizer',
    it: 'Preferisco non dirlo',
  },

  // 나침반 결과 — 주변 정보 묶음
  nearbyFood: {
    ko: '맛집',
    en: 'Places to eat',
    es: 'Dónde comer',
    fr: 'Où manger',
    pt: 'Onde comer',
    it: 'Dove mangiare',
  },
  nearbyStay: {
    ko: '숙박',
    en: 'Places to stay',
    es: 'Dónde alojarse',
    fr: 'Où loger',
    pt: 'Onde ficar',
    it: 'Dove alloggiare',
  },
  nearbySights: {
    ko: '볼거리',
    en: 'Things to see',
    es: 'Qué ver',
    fr: 'À voir',
    pt: 'O que ver',
    it: 'Cosa vedere',
  },
  nearbyMeal: {
    ko: '따뜻한 한 끼',
    en: 'A warm meal',
    es: 'Una comida caliente',
    fr: 'Un repas chaud',
    pt: 'Uma refeição quente',
    it: 'Un pasto caldo',
  },
  nearbyOvernight: {
    ko: '하룻밤 머물 곳',
    en: 'Somewhere to spend the night',
    es: 'Un lugar para pasar la noche',
    fr: 'Un endroit où passer la nuit',
    pt: 'Um lugar para passar a noite',
    it: 'Un posto dove passare la notte',
  },
  nearbyAlong: {
    ko: '오가는 길에',
    en: 'Along the way',
    es: 'De camino',
    fr: 'En chemin',
    pt: 'No caminho',
    it: 'Lungo il cammino',
  },
  nearbyTogether: {
    ko: '함께 둘러볼 곳',
    en: 'Places to see together',
    es: 'Lugares para ver juntos',
    fr: 'Lieux à voir ensemble',
    pt: 'Lugares para ver juntos',
    it: 'Luoghi da vedere insieme',
  },

  // 나침반 인트로
  compassIntroLine1: {
    ko: '지금, 어떤 마음으로',
    en: 'What brings you here',
    es: '¿Qué te trae',
    fr: 'Qu’est-ce qui vous amène',
    pt: 'O que o traz',
    it: 'Che cosa ti porta',
  },
  compassIntroLine2: {
    ko: '여기 오셨나요?',
    en: 'today?',
    es: 'hoy?',
    fr: 'aujourd’hui ?',
    pt: 'aqui hoje?',
    it: 'qui oggi?',
  },
  compassIntroBody: {
    ko: '몇 가지만 여쭤볼게요. 당신에게 꼭 맞는 쉼의 자리를 찾아드릴게요.',
    en: 'Just a few questions, and we’ll find the place of rest that fits you.',
    es: 'Solo unas preguntas y encontraremos el lugar de descanso que te corresponde.',
    fr: 'Quelques questions seulement, et nous trouverons le lieu de repos qui vous convient.',
    pt: 'Apenas algumas perguntas e encontraremos o lugar de descanso ideal para você.',
    it: 'Poche domande e troveremo il luogo di riposo giusto per te.',
  },
  compassStart: {
    ko: '시작하기',
    en: 'Start',
    es: 'Empezar',
    fr: 'Commencer',
    pt: 'Começar',
    it: 'Inizia',
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

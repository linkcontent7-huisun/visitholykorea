import type { Language } from '@/shared/i18n/dictionary';

/**
 * 「성지순례, 처음이라면」 안내 글 (`/guide`).
 *
 * 구글 '성지순례' 검색어를 노린 글이다(2026-11-16 사장님 결정). 검색하는 사람 대부분이 처음 가려는 사람이라
 * 그 질문에 답하는 글이 있어야 검색엔진이 이 단어와 사이트를 잇는다.
 * 확인 안 된 사실(성지별 휴무일·순례 수첩 도장)은 넣지 않았다. 외국어 5개는 2026-11-16 사장님 지시로 옮겼다(원어민 검수 전).
 * 앱 기능 이름(Today's Plan·My Record 등)은 dictionary.ts 의 이름과 맞춘다.
 */
export interface GuideSection {
  heading: string;
  body?: string;
  /** 앱 안 화면으로 이어지는 항목 — to 는 paths 의 키 */
  items?: { text: string; to?: 'nearby' | 'compass' | 'routes' | 'records' | 'search' }[];
}

export interface GuideContent {
  title: string;
  lead: string;
  sections: GuideSection[];
}

const KO: GuideContent = {
  title: '성지순례, 처음이라면',
  lead: '성지순례는 신앙의 선조들이 살고, 기도하고, 목숨을 바친 자리를 찾아가 기도하는 여정입니다. 한국에는 박해 시대 순교자들의 자취가 남은 천주교 성지가 전국에 200곳 넘게 있습니다.',
  sections: [
    {
      heading: '1. 어디로 갈까요',
      items: [
        { text: '가까운 곳부터 — 지금 위치에서 가까운 성지를 찾습니다.', to: 'nearby' },
        {
          text: '마음 가는 대로 — 오늘의 성지가 지금 마음에 맞는 곳을 골라 줍니다.',
          to: 'compass',
        },
        { text: '하루 코스로 — 여러 성지를 이어 걷는 순례 코스를 고릅니다.', to: 'routes' },
        { text: '이름이나 지역으로 — 성지 이름·지역으로 바로 찾습니다.', to: 'search' },
      ],
    },
    {
      heading: '2. 떠나기 전에 확인할 것',
      items: [
        {
          text: '미사 시간 — 성지마다 다르고 바뀔 수 있습니다. 성지 페이지의 시간을 보고, 성지 사무실에 한 번 더 확인하세요.',
        },
        { text: '여는 시간 — 성지마다 개방 시간이 다릅니다. 떠나기 전에 확인하세요.' },
        { text: '가는 길 — 성지 페이지의 「찾아가는 길」에서 지도로 바로 이어집니다.' },
      ],
    },
    {
      heading: '3. 성지에서',
      items: [
        { text: '조용히 머뭅니다. 미사나 기도 중인 분들을 배려해 주세요.' },
        { text: '다녀온 성지는 순례 기록에 쌓입니다.', to: 'records' },
      ],
    },
    {
      heading: '4. 신자가 아니어도 괜찮나요?',
      body: '네. 성지는 누구에게나 열려 있습니다. 역사와 자연 속에서 쉬어 가는 시간으로도 충분합니다.',
    },
  ],
};

const EN: GuideContent = {
  title: 'Your first pilgrimage',
  lead: 'A pilgrimage is a journey of prayer to the places where our ancestors in faith lived, prayed and gave their lives. Korea has more than 200 Catholic holy sites across the country that keep the memory of the martyrs of the persecution era.',
  sections: [
    {
      heading: '1. Where to go',
      items: [
        { text: 'Start nearby — find holy sites close to where you are now.', to: 'nearby' },
        {
          text: "Follow your heart — Today's Plan suggests a place that fits how you feel today.",
          to: 'compass',
        },
        {
          text: 'Make it a day — choose a pilgrimage route that links several sites.',
          to: 'routes',
        },
        { text: 'By name or region — search for a site by its name or area.', to: 'search' },
      ],
    },
    {
      heading: '2. Before you go',
      items: [
        {
          text: 'Mass times — they differ by site and can change. Check the times on the site page, then confirm with the site office.',
        },
        { text: 'Opening hours — each site keeps its own hours. Check before you leave.' },
        { text: 'Getting there — the “Getting there” section of each site page opens the map.' },
      ],
    },
    {
      heading: '3. At the holy site',
      items: [
        { text: 'Stay quiet, and be considerate of people at Mass or in prayer.' },
        { text: 'The sites you visit are saved in My Record.', to: 'records' },
      ],
    },
    {
      heading: "4. I'm not Catholic. Can I still go?",
      body: 'Yes. Holy sites are open to everyone. A quiet moment of rest amid history and nature is reason enough.',
    },
  ],
};

const ES: GuideContent = {
  title: 'Tu primera peregrinación',
  lead: 'Una peregrinación es un camino de oración hacia los lugares donde nuestros antepasados en la fe vivieron, rezaron y entregaron su vida. Corea tiene más de 200 lugares santos católicos en todo el país que guardan la memoria de los mártires de la época de la persecución.',
  sections: [
    {
      heading: '1. ¿A dónde ir?',
      items: [
        { text: 'Empieza cerca: encuentra lugares santos próximos a donde estás.', to: 'nearby' },
        {
          text: 'Sigue tu corazón: el Plan de hoy te sugiere un lugar según cómo te sientes.',
          to: 'compass',
        },
        {
          text: 'Un día completo: elige una ruta de peregrinación que une varios lugares.',
          to: 'routes',
        },
        { text: 'Por nombre o región: busca un lugar por su nombre o zona.', to: 'search' },
      ],
    },
    {
      heading: '2. Antes de salir',
      items: [
        {
          text: 'Horario de misas: cambia según el lugar y puede variar. Consulta la página del lugar y confírmalo con la oficina del santuario.',
        },
        { text: 'Horario de apertura: cada lugar tiene el suyo. Compruébalo antes de salir.' },
        { text: 'Cómo llegar: desde «Cómo llegar» en la página del lugar se abre el mapa.' },
      ],
    },
    {
      heading: '3. En el lugar santo',
      items: [
        { text: 'Guarda silencio y respeta a quienes están en misa o en oración.' },
        { text: 'Los lugares que visitas se guardan en Mi registro.', to: 'records' },
      ],
    },
    {
      heading: '4. No soy católico, ¿puedo ir?',
      body: 'Sí. Los lugares santos están abiertos a todos. Un rato de descanso entre historia y naturaleza ya es suficiente.',
    },
  ],
};

const FR: GuideContent = {
  title: 'Votre premier pèlerinage',
  lead: 'Un pèlerinage est un chemin de prière vers les lieux où nos ancêtres dans la foi ont vécu, prié et donné leur vie. La Corée compte plus de 200 lieux saints catholiques dans tout le pays, qui gardent la mémoire des martyrs du temps des persécutions.',
  sections: [
    {
      heading: '1. Où aller ?',
      items: [
        {
          text: 'Commencez près de chez vous : trouvez les lieux saints proches de vous.',
          to: 'nearby',
        },
        {
          text: 'Suivez votre cœur : le Programme du jour propose un lieu adapté à ce que vous ressentez.',
          to: 'compass',
        },
        {
          text: 'Une journée de marche : choisissez un parcours qui relie plusieurs lieux.',
          to: 'routes',
        },
        {
          text: 'Par nom ou par région : cherchez un lieu par son nom ou sa région.',
          to: 'search',
        },
      ],
    },
    {
      heading: '2. Avant de partir',
      items: [
        {
          text: "Horaires des messes : ils varient selon les lieux et peuvent changer. Consultez la page du lieu, puis confirmez auprès de l'accueil du sanctuaire.",
        },
        { text: "Heures d'ouverture : chaque lieu a les siennes. Vérifiez avant de partir." },
        { text: 'S’y rendre : la rubrique « S’y rendre » de la page du lieu ouvre la carte.' },
      ],
    },
    {
      heading: '3. Sur le lieu saint',
      items: [
        { text: 'Restez silencieux et respectez les personnes à la messe ou en prière.' },
        { text: 'Les lieux visités sont enregistrés dans Mon carnet.', to: 'records' },
      ],
    },
    {
      heading: '4. Je ne suis pas catholique, puis-je y aller ?',
      body: "Oui. Les lieux saints sont ouverts à tous. Un moment de repos au milieu de l'histoire et de la nature suffit.",
    },
  ],
};

const PT: GuideContent = {
  title: 'Sua primeira peregrinação',
  lead: 'Uma peregrinação é um caminho de oração até os lugares onde nossos antepassados na fé viveram, rezaram e deram a vida. A Coreia tem mais de 200 lugares santos católicos em todo o país, que guardam a memória dos mártires do tempo da perseguição.',
  sections: [
    {
      heading: '1. Para onde ir',
      items: [
        {
          text: 'Comece por perto: encontre lugares santos próximos de onde você está.',
          to: 'nearby',
        },
        {
          text: 'Siga o coração: o Roteiro de hoje sugere um lugar de acordo com o que você sente.',
          to: 'compass',
        },
        {
          text: 'Um dia inteiro: escolha um roteiro de peregrinação que liga vários lugares.',
          to: 'routes',
        },
        { text: 'Por nome ou região: procure um lugar pelo nome ou pela região.', to: 'search' },
      ],
    },
    {
      heading: '2. Antes de sair',
      items: [
        {
          text: 'Horário das missas: muda de um lugar para outro e pode mudar. Veja a página do lugar e confirme com a secretaria do santuário.',
        },
        { text: 'Horário de funcionamento: cada lugar tem o seu. Confira antes de sair.' },
        { text: 'Como chegar: na seção «Como chegar» da página do lugar, o mapa se abre direto.' },
      ],
    },
    {
      heading: '3. No lugar santo',
      items: [
        { text: 'Fique em silêncio e respeite quem está na missa ou em oração.' },
        { text: 'Os lugares que você visita ficam guardados em Meu registro.', to: 'records' },
      ],
    },
    {
      heading: '4. Não sou católico. Posso ir?',
      body: 'Sim. Os lugares santos estão abertos a todos. Um momento de descanso entre a história e a natureza já basta.',
    },
  ],
};

const IT: GuideContent = {
  title: 'Il tuo primo pellegrinaggio',
  lead: 'Il pellegrinaggio è un cammino di preghiera verso i luoghi in cui i nostri antenati nella fede hanno vissuto, pregato e donato la vita. In Corea ci sono più di 200 luoghi santi cattolici in tutto il Paese, che custodiscono la memoria dei martiri del tempo delle persecuzioni.',
  sections: [
    {
      heading: '1. Dove andare',
      items: [
        { text: 'Parti da vicino: trova i luoghi santi vicini a dove ti trovi.', to: 'nearby' },
        {
          text: 'Segui il cuore: il Programma di oggi ti propone un luogo adatto a come ti senti.',
          to: 'compass',
        },
        { text: 'Una giornata intera: scegli un percorso che collega più luoghi.', to: 'routes' },
        { text: 'Per nome o regione: cerca un luogo per nome o per zona.', to: 'search' },
      ],
    },
    {
      heading: '2. Prima di partire',
      items: [
        {
          text: "Orari delle messe: cambiano da luogo a luogo e possono variare. Guarda la pagina del luogo e conferma con l'ufficio del santuario.",
        },
        { text: 'Orari di apertura: ogni luogo ha i suoi. Controlla prima di partire.' },
        {
          text: 'Come arrivare: dalla sezione «Come arrivare» della pagina del luogo si apre la mappa.',
        },
      ],
    },
    {
      heading: '3. Nel luogo santo',
      items: [
        { text: 'Rimani in silenzio e rispetta chi è a messa o in preghiera.' },
        { text: 'I luoghi visitati vengono salvati nel tuo diario.', to: 'records' },
      ],
    },
    {
      heading: '4. Non sono cattolico. Posso andare?',
      body: 'Sì. I luoghi santi sono aperti a tutti. Un momento di riposo tra storia e natura è già abbastanza.',
    },
  ],
};

export const GUIDE: Record<Language, GuideContent> = {
  ko: KO,
  en: EN,
  es: ES,
  fr: FR,
  pt: PT,
  it: IT,
};

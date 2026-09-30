import type { Language } from '@/shared/i18n/dictionary';

/**
 * 자주 묻는 질문 — 6개 국어.
 *
 * 투어원패스 고객센터(pass.knto.or.kr/faq)의 구성을 참고했다 — 탭 2개(회원가입 및 로그인 /
 * 서비스 이용) + 아코디언. 답변은 실제 구현된 기능만 적는다. 없는 기능을 약속하지 않는다.
 * 한국어가 원문이고 나머지는 번역이다(2026-09-21, T-031). 답을 고치면 여섯 언어를 같이 고친다.
 * 성지 수 「206곳」은 2026-09-18 DB 실측값(CLAUDE.md) — 바뀌면 여섯 언어에서 같이 바꾼다.
 */
export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqContent {
  /** 탭 이름 두 개 — [회원가입 및 로그인, 서비스 이용] 순서. */
  tabs: [string, string];
  /** 탭 순서대로 문답 묶음. */
  items: [FaqItem[], FaqItem[]];
}

export const FAQ: Record<Language, FaqContent> = {
  ko: {
    tabs: ['회원가입 및 로그인', '서비스 이용'],
    items: [
      [
        {
          q: '어떤 방법으로 로그인할 수 있나요?',
          a: `네 가지 방법이 있습니다.
1. 이메일 회원가입 후 로그인
2. 카카오 계정으로 간편 로그인
3. 구글 계정으로 간편 로그인
4. 네이버·페이스북 계정으로 간편 로그인
간편 로그인은 별도 회원가입 절차 없이 첫 로그인과 동시에 가입됩니다.`,
        },
        {
          q: '회원가입 없이도 이용할 수 있나요?',
          a: `네. 성지 정보 열람, 지도, 순례 코스, 검색은 로그인 없이 모두 이용할 수 있습니다.
순례 기록처럼 "나의 기록"을 남기는 기능만 로그인이 필요합니다.`,
        },
        {
          q: '간편 로그인으로 가입하면 비밀번호를 따로 만들어야 하나요?',
          a: `아니요. 간편 로그인은 해당 서비스(카카오·구글 등)의 인증을 그대로 사용하므로 별도 비밀번호를 만들지 않습니다. 비밀번호는 저희에게 전달되지 않습니다.`,
        },
        {
          q: '이메일 가입을 했는데 로그인이 안 돼요.',
          a: `이메일 가입 시 확인 메일이 발송됩니다. 메일함(스팸함 포함)에서 확인 메일의 링크를 눌러야 로그인할 수 있습니다. 메일이 오지 않았다면 다른 이메일로 다시 가입하시거나 간편 로그인을 이용해 주세요.`,
        },
        {
          q: '수집하는 개인정보는 무엇인가요?',
          a: `가입할 때 이메일과 이름(또는 닉네임)을 처리하고, 이메일 가입의 비밀번호는 인증 서비스에 해시 형태로 저장됩니다. 순례 기록·사진·즐겨찾기·AI 대화·마음 나침반 응답은 해당 기능을 사용할 때만 저장됩니다. 자세한 내용과 삭제 방법은 개인정보 처리방침에서 확인해 주세요.`,
        },
      ],
      [
        {
          q: 'Visit Holy Korea 가 무엇인가요?',
          a: `한국 가톨릭 성지 206곳을 안내하는 순례 웹앱입니다. 성지 소개와 지도, 박해의 역사를 따라 걷는 순례 코스, 감정 기반 성지 추천, 순례 기록 기능을 제공합니다.`,
        },
        {
          q: '성지 소개 글은 어디에서 온 정보인가요?',
          a: `각 교구 공식 홈페이지의 성지 안내, 한국천주교주교회의 자료 등 확인된 출처를 기반으로 작성합니다. 확인되지 않은 이야기는 싣지 않는 것을 원칙으로 합니다.`,
        },
        {
          q: '미사 시간은 정확한가요?',
          a: `교구 공식 자료 기준으로 안내하지만, 미사 시간과 개방 여부는 현지 사정에 따라 수시로 바뀝니다. 방문 전에 반드시 각 성지 사무실에 전화로 확인해 주세요. 성지 상세 화면에 전화번호를 함께 안내하고 있습니다.`,
        },
        {
          q: '미카엘 순례 가이드의 답변은 믿을 수 있나요?',
          a: `미카엘 순례 가이드는 저희 성지 데이터베이스 안의 내용만으로 답하도록 제한되어 있고, 모르는 것은 모른다고 답합니다. 다만 AI 답변은 참고용이며, 중요한 정보(미사 시간·개방 여부 등)는 성지 사무실에 확인해 주세요.`,
        },
        {
          q: '성지 사진의 출처는 무엇인가요?',
          a: `직접 촬영한 사진과 자유 라이선스(Wikimedia Commons 등) 사진을 사용하며, 라이선스 표기가 필요한 사진은 화면에 출처를 함께 표시합니다.`,
        },
      ],
    ],
  },
  en: {
    tabs: ['Sign-up & login', 'Using the service'],
    items: [
      [
        {
          q: 'How can I log in?',
          a: `There are four ways.
1. Sign up with email, then log in
2. Sign in with a Kakao account
3. Sign in with a Google account
4. Sign in with a Naver or Facebook account
Social sign-in creates your account on the first login — no separate sign-up step.`,
        },
        {
          q: 'Can I use the app without an account?',
          a: `Yes. Browsing shrine information, the map, pilgrimage routes and search all work without logging in.
Only features that save "my records", such as visit records, require login.`,
        },
        {
          q: 'Do I need a separate password with social sign-in?',
          a: `No. Social sign-in uses that service's own authentication (Kakao, Google, etc.), so you do not create a separate password. Your password is never passed to us.`,
        },
        {
          q: 'I signed up with email but cannot log in.',
          a: `A confirmation email is sent when you sign up with email. You need to tap the link in that email (check your spam folder too) before you can log in. If it never arrived, sign up again with a different email or use social sign-in.`,
        },
        {
          q: 'What personal data do you collect?',
          a: `When you sign up we process your email and name (or nickname); for email sign-up the password is stored as a hash by the authentication service. Visit records, photos, favorites, AI chats and compass answers are saved only when you use those features. See the privacy notice for details and how to delete.`,
        },
      ],
      [
        {
          q: 'What is Visit Holy Korea?',
          a: `A pilgrimage web app covering 206 Catholic holy sites in Korea. It offers site descriptions and a map, pilgrimage routes that follow the history of persecution, mood-based site recommendations, and visit records.`,
        },
        {
          q: 'Where does the site information come from?',
          a: `It is written from verified sources such as each diocese's official website and materials from the Catholic Bishops' Conference of Korea. As a rule, unverified stories are not included.`,
        },
        {
          q: 'Are the Mass times accurate?',
          a: `They follow official diocesan materials, but Mass times and opening hours change often with local circumstances. Always call the site office before visiting — the phone number is shown on each site's page.`,
        },
        {
          q: 'Can I trust the Michael pilgrimage guide?',
          a: `Michael is limited to answering from our shrine database and says so when it does not know. AI answers are still for reference only — confirm important details (Mass times, opening hours) with the site office.`,
        },
        {
          q: 'Where do the photos come from?',
          a: `We use photos we took ourselves and freely licensed photos (e.g. Wikimedia Commons). Where attribution is required, the source is shown on screen.`,
        },
      ],
    ],
  },
  es: {
    tabs: ['Registro e inicio de sesión', 'Uso del servicio'],
    items: [
      [
        {
          q: '¿Cómo puedo iniciar sesión?',
          a: `Hay cuatro formas.
1. Registrarse con correo electrónico e iniciar sesión
2. Iniciar sesión con una cuenta de Kakao
3. Iniciar sesión con una cuenta de Google
4. Iniciar sesión con una cuenta de Naver o Facebook
El inicio de sesión social crea la cuenta en el primer acceso, sin un registro aparte.`,
        },
        {
          q: '¿Puedo usar la aplicación sin cuenta?',
          a: `Sí. La información de los santuarios, el mapa, las rutas de peregrinación y la búsqueda funcionan sin iniciar sesión.
Solo las funciones que guardan «mis registros», como los registros de visita, requieren iniciar sesión.`,
        },
        {
          q: '¿Necesito una contraseña aparte con el inicio de sesión social?',
          a: `No. El inicio de sesión social usa la autenticación del propio servicio (Kakao, Google, etc.), así que no se crea una contraseña aparte. Su contraseña nunca se nos transmite.`,
        },
        {
          q: 'Me registré con correo electrónico pero no puedo iniciar sesión.',
          a: `Al registrarse con correo se envía un mensaje de confirmación. Debe pulsar el enlace de ese mensaje (revise también la carpeta de spam) antes de poder iniciar sesión. Si no llegó, regístrese de nuevo con otro correo o use el inicio de sesión social.`,
        },
        {
          q: '¿Qué datos personales recogen?',
          a: `Al registrarse procesamos su correo y su nombre (o apodo); en el registro por correo, la contraseña se guarda como hash en el servicio de autenticación. Los registros de visita, fotos, favoritos, conversaciones de IA y respuestas de la brújula solo se guardan cuando usa esas funciones. Consulte el aviso de privacidad para más detalles y cómo eliminarlos.`,
        },
      ],
      [
        {
          q: '¿Qué es Visit Holy Korea?',
          a: `Una aplicación web de peregrinación que cubre 206 santuarios católicos de Corea. Ofrece descripciones y un mapa de los santuarios, rutas de peregrinación que siguen la historia de las persecuciones, recomendaciones según su estado de ánimo y registros de visita.`,
        },
        {
          q: '¿De dónde proviene la información de los santuarios?',
          a: `Se redacta a partir de fuentes verificadas, como el sitio web oficial de cada diócesis y los materiales de la Conferencia Episcopal de Corea. Por norma, no se incluyen relatos sin verificar.`,
        },
        {
          q: '¿Son exactos los horarios de misa?',
          a: `Siguen los materiales oficiales de las diócesis, pero los horarios de misa y de apertura cambian con frecuencia según las circunstancias locales. Llame siempre a la oficina del santuario antes de visitarlo; el teléfono aparece en la página de cada santuario.`,
        },
        {
          q: '¿Puedo confiar en el guía de peregrinación Miguel?',
          a: `Miguel solo responde con el contenido de nuestra base de datos de santuarios y lo dice cuando no sabe algo. Aun así, las respuestas de la IA son solo orientativas: confirme los datos importantes (horarios de misa, apertura) con la oficina del santuario.`,
        },
        {
          q: '¿De dónde proceden las fotos?',
          a: `Usamos fotos tomadas por nosotros y fotos con licencia libre (por ejemplo, Wikimedia Commons). Cuando se requiere atribución, la fuente se muestra en pantalla.`,
        },
      ],
    ],
  },
  fr: {
    tabs: ['Inscription et connexion', 'Utilisation du service'],
    items: [
      [
        {
          q: 'Comment puis-je me connecter ?',
          a: `Il existe quatre méthodes.
1. S’inscrire avec une adresse e-mail, puis se connecter
2. Se connecter avec un compte Kakao
3. Se connecter avec un compte Google
4. Se connecter avec un compte Naver ou Facebook
La connexion sociale crée votre compte dès la première connexion, sans inscription séparée.`,
        },
        {
          q: 'Puis-je utiliser l’application sans compte ?',
          a: `Oui. Les informations sur les sanctuaires, la carte, les itinéraires de pèlerinage et la recherche fonctionnent sans connexion.
Seules les fonctions qui enregistrent « mes carnets », comme les carnets de visite, nécessitent une connexion.`,
        },
        {
          q: 'Faut-il un mot de passe séparé avec la connexion sociale ?',
          a: `Non. La connexion sociale utilise l’authentification du service concerné (Kakao, Google, etc.) ; vous ne créez donc pas de mot de passe séparé. Votre mot de passe ne nous est jamais transmis.`,
        },
        {
          q: 'Je me suis inscrit par e-mail mais je n’arrive pas à me connecter.',
          a: `Un e-mail de confirmation est envoyé lors de l’inscription par e-mail. Vous devez cliquer sur le lien de cet e-mail (vérifiez aussi le dossier spam) avant de pouvoir vous connecter. S’il n’est jamais arrivé, réinscrivez-vous avec une autre adresse ou utilisez la connexion sociale.`,
        },
        {
          q: 'Quelles données personnelles collectez-vous ?',
          a: `Lors de l’inscription, nous traitons votre e-mail et votre nom (ou pseudonyme) ; pour l’inscription par e-mail, le mot de passe est stocké sous forme de hachage par le service d’authentification. Les carnets de visite, photos, favoris, conversations IA et réponses de la boussole ne sont enregistrés que lorsque vous utilisez ces fonctions. Consultez la notice de confidentialité pour les détails et la suppression.`,
        },
      ],
      [
        {
          q: 'Qu’est-ce que Visit Holy Korea ?',
          a: `Une application web de pèlerinage couvrant 206 sanctuaires catholiques de Corée. Elle propose des présentations et une carte des sanctuaires, des itinéraires de pèlerinage qui suivent l’histoire des persécutions, des recommandations selon votre état d’esprit et des carnets de visite.`,
        },
        {
          q: 'D’où proviennent les informations sur les sanctuaires ?',
          a: `Elles sont rédigées à partir de sources vérifiées, telles que le site officiel de chaque diocèse et les documents de la Conférence des évêques de Corée. Par principe, les récits non vérifiés ne sont pas inclus.`,
        },
        {
          q: 'Les horaires des messes sont-ils exacts ?',
          a: `Ils suivent les documents officiels des diocèses, mais les horaires des messes et d’ouverture changent souvent selon les circonstances locales. Appelez toujours le bureau du sanctuaire avant votre visite ; le numéro figure sur la page de chaque sanctuaire.`,
        },
        {
          q: 'Peut-on faire confiance au guide de pèlerinage Michel ?',
          a: `Michel ne répond qu’à partir de notre base de données des sanctuaires et le dit lorsqu’il ne sait pas. Les réponses de l’IA restent indicatives : confirmez les informations importantes (horaires des messes, ouverture) auprès du bureau du sanctuaire.`,
        },
        {
          q: 'D’où viennent les photos ?',
          a: `Nous utilisons des photos prises par nos soins et des photos sous licence libre (par exemple Wikimedia Commons). Lorsqu’une attribution est requise, la source est affichée à l’écran.`,
        },
      ],
    ],
  },
  pt: {
    tabs: ['Cadastro e login', 'Uso do serviço'],
    items: [
      [
        {
          q: 'Como posso fazer login?',
          a: `Há quatro formas.
1. Cadastrar-se com e-mail e fazer login
2. Entrar com uma conta Kakao
3. Entrar com uma conta Google
4. Entrar com uma conta Naver ou Facebook
O login social cria a conta no primeiro acesso, sem cadastro separado.`,
        },
        {
          q: 'Posso usar o aplicativo sem conta?',
          a: `Sim. As informações dos santuários, o mapa, as rotas de peregrinação e a busca funcionam sem login.
Apenas as funções que salvam «meus registros», como os registros de visita, exigem login.`,
        },
        {
          q: 'Preciso de uma senha separada com o login social?',
          a: `Não. O login social usa a autenticação do próprio serviço (Kakao, Google etc.), então não é criada uma senha separada. Sua senha nunca é transmitida para nós.`,
        },
        {
          q: 'Cadastrei-me com e-mail, mas não consigo fazer login.',
          a: `Ao se cadastrar com e-mail, é enviada uma mensagem de confirmação. Você precisa tocar no link dessa mensagem (verifique também a pasta de spam) antes de conseguir fazer login. Se ela não chegou, cadastre-se de novo com outro e-mail ou use o login social.`,
        },
        {
          q: 'Quais dados pessoais vocês coletam?',
          a: `No cadastro processamos seu e-mail e nome (ou apelido); no cadastro por e-mail, a senha é armazenada como hash pelo serviço de autenticação. Registros de visita, fotos, favoritos, conversas de IA e respostas da bússola só são salvos quando você usa essas funções. Veja o aviso de privacidade para detalhes e como excluir.`,
        },
      ],
      [
        {
          q: 'O que é o Visit Holy Korea?',
          a: `Um aplicativo web de peregrinação que cobre 206 santuários católicos da Coreia. Oferece descrições e um mapa dos santuários, rotas de peregrinação que seguem a história das perseguições, recomendações conforme seu estado de espírito e registros de visita.`,
        },
        {
          q: 'De onde vêm as informações dos santuários?',
          a: `São escritas a partir de fontes verificadas, como o site oficial de cada diocese e os materiais da Conferência Episcopal da Coreia. Por princípio, relatos não verificados não são incluídos.`,
        },
        {
          q: 'Os horários de missa são precisos?',
          a: `Seguem os materiais oficiais das dioceses, mas os horários de missa e de abertura mudam com frequência conforme as circunstâncias locais. Ligue sempre para o escritório do santuário antes de visitar; o telefone aparece na página de cada santuário.`,
        },
        {
          q: 'Posso confiar no guia de peregrinação Miguel?',
          a: `O Miguel responde apenas com o conteúdo do nosso banco de dados de santuários e avisa quando não sabe. Ainda assim, as respostas da IA são apenas referenciais: confirme dados importantes (horários de missa, abertura) com o escritório do santuário.`,
        },
        {
          q: 'De onde vêm as fotos?',
          a: `Usamos fotos tiradas por nós e fotos com licença livre (por exemplo, Wikimedia Commons). Quando a atribuição é necessária, a fonte é mostrada na tela.`,
        },
      ],
    ],
  },
  it: {
    tabs: ['Registrazione e accesso', 'Uso del servizio'],
    items: [
      [
        {
          q: 'Come posso accedere?',
          a: `Ci sono quattro modi.
1. Registrarsi con l’e-mail e poi accedere
2. Accedere con un account Kakao
3. Accedere con un account Google
4. Accedere con un account Naver o Facebook
L’accesso social crea l’account al primo accesso, senza una registrazione separata.`,
        },
        {
          q: 'Posso usare l’app senza un account?',
          a: `Sì. Le informazioni sui santuari, la mappa, i percorsi di pellegrinaggio e la ricerca funzionano senza accesso.
Solo le funzioni che salvano «i miei diari», come i diari di visita, richiedono l’accesso.`,
        },
        {
          q: 'Serve una password separata con l’accesso social?',
          a: `No. L’accesso social usa l’autenticazione del servizio stesso (Kakao, Google, ecc.), quindi non si crea una password separata. La tua password non ci viene mai trasmessa.`,
        },
        {
          q: 'Mi sono registrato con l’e-mail ma non riesco ad accedere.',
          a: `Alla registrazione con e-mail viene inviato un messaggio di conferma. Devi toccare il link in quel messaggio (controlla anche la cartella spam) prima di poter accedere. Se non è mai arrivato, registrati di nuovo con un’altra e-mail o usa l’accesso social.`,
        },
        {
          q: 'Quali dati personali raccogliete?',
          a: `Alla registrazione trattiamo la tua e-mail e il nome (o soprannome); per la registrazione via e-mail la password è memorizzata come hash dal servizio di autenticazione. Diari di visita, foto, preferiti, conversazioni IA e risposte della bussola vengono salvati solo quando usi quelle funzioni. Vedi l’informativa sulla privacy per i dettagli e per l’eliminazione.`,
        },
      ],
      [
        {
          q: 'Che cos’è Visit Holy Korea?',
          a: `Un’app web di pellegrinaggio che copre 206 santuari cattolici della Corea. Offre descrizioni e una mappa dei santuari, percorsi di pellegrinaggio che seguono la storia delle persecuzioni, consigli in base al tuo stato d’animo e diari di visita.`,
        },
        {
          q: 'Da dove provengono le informazioni sui santuari?',
          a: `Sono redatte a partire da fonti verificate, come il sito ufficiale di ogni diocesi e i materiali della Conferenza Episcopale Coreana. Per principio, i racconti non verificati non vengono inclusi.`,
        },
        {
          q: 'Gli orari delle messe sono precisi?',
          a: `Seguono i materiali ufficiali delle diocesi, ma gli orari delle messe e di apertura cambiano spesso in base alle circostanze locali. Chiama sempre l’ufficio del santuario prima della visita; il numero è indicato nella pagina di ogni santuario.`,
        },
        {
          q: 'Posso fidarmi della guida al pellegrinaggio Michele?',
          a: `Michele risponde solo con i contenuti del nostro database dei santuari e lo dice quando non sa qualcosa. Le risposte dell’IA restano comunque indicative: conferma le informazioni importanti (orari delle messe, apertura) con l’ufficio del santuario.`,
        },
        {
          q: 'Da dove vengono le foto?',
          a: `Usiamo foto scattate da noi e foto con licenza libera (ad esempio Wikimedia Commons). Quando è richiesta l’attribuzione, la fonte è mostrata sullo schermo.`,
        },
      ],
    ],
  },
};

import type { Language } from '@/shared/i18n/dictionary';

/**
 * 자주 묻는 질문 — 6개 국어.
 *
 * `pages/FaqPage.tsx` 에 한국어로만 박혀 있던 탭 이름과 문답을 언어별로 나눴다 (T-031, 2026-09-20).
 * 답변은 실제 구현된 기능만 적는다. 없는 기능을 약속하지 않는다. 한국어가 원문이고 나머지는 번역이다.
 * 성지 수는 DB 실측(2026-09-20) 206곳 — 예전 문구 208곳은 근거 없는 2곳을 지우기 전 값이었다.
 */
export interface FaqItem {
  q: string;
  a: string;
}
export interface FaqTab {
  /** 탭 구분용 — 언어가 바뀌어도 같은 탭이 열려 있게 한다 */
  id: 'account' | 'service';
  title: string;
  items: FaqItem[];
}

export const FAQ: Record<Language, FaqTab[]> = {
  ko: [
    {
      id: 'account',
      title: '회원가입 및 로그인',
      items: [
        {
          q: '어떤 방법으로 로그인할 수 있나요?',
          a: `네 가지 방법이 있습니다.
1. 이메일 회원가입 후 로그인
2. 카카오 계정으로 간편 로그인
3. 구글 계정으로 간편 로그인
4. 네이버 계정으로 간편 로그인
간편 로그인은 별도 회원가입 절차 없이 첫 로그인과 동시에 가입됩니다.`,
        },
        {
          q: '회원가입 없이도 이용할 수 있나요?',
          a: `네. 성지 정보 열람, 순례 코스, 검색, 오늘의 성지 일정은 로그인 없이 모두 이용할 수 있습니다.
순례 기록처럼 "나의 기록"을 남기는 기능만 로그인이 필요합니다.`,
        },
        {
          q: '간편 로그인으로 가입하면 비밀번호를 따로 만들어야 하나요?',
          a: `아니요. 간편 로그인은 해당 서비스(카카오·구글·네이버)의 인증을 그대로 사용하므로 별도 비밀번호를 만들지 않습니다. 비밀번호는 저희에게 전달되지 않습니다.`,
        },
        {
          q: '이메일 가입을 했는데 로그인이 안 돼요.',
          a: `이메일 가입 시 확인 메일이 발송됩니다. 메일함(스팸함 포함)에서 확인 메일의 링크를 눌러야 로그인할 수 있습니다. 메일이 오지 않았다면 다른 이메일로 다시 가입하시거나 간편 로그인을 이용해 주세요.`,
        },
        {
          q: '수집하는 개인정보는 무엇인가요?',
          a: `가입할 때 이메일과 이름(또는 닉네임)을 처리하고, 이메일 가입의 비밀번호는 인증 서비스에 해시 형태로 저장됩니다. 순례 기록·사진·즐겨찾기·AI 대화·오늘의 성지 일정 응답은 해당 기능을 사용할 때만 저장됩니다. 자세한 내용과 삭제 방법은 개인정보 안내에서 확인해 주세요.`,
        },
      ],
    },
    {
      id: 'service',
      title: '서비스 이용',
      items: [
        {
          q: 'Visit Holy Korea 가 무엇인가요?',
          a: `한국 가톨릭 성지 206곳을 안내하는 순례 웹앱입니다. 성지 소개와 오디오 가이드, 박해의 역사를 따라 걷는 순례 코스, 마음 상태에 맞춘 오늘의 성지 일정, 순례 기록 기능을 제공합니다.`,
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
    },
  ],

  en: [
    {
      id: 'account',
      title: 'Sign-up and sign-in',
      items: [
        {
          q: 'How can I sign in?',
          a: `There are four ways.
1. Sign up with email, then sign in
2. Social sign-in with a Kakao account
3. Social sign-in with a Google account
4. Social sign-in with a Naver account
Social sign-in creates your account on the first sign-in — no separate sign-up step.`,
        },
        {
          q: 'Can I use the app without an account?',
          a: `Yes. Shrine information, pilgrimage routes, search and Today's Plan all work without signing in.
Only features that keep "my records", such as visit records, need an account.`,
        },
        {
          q: 'Do I need a separate password with social sign-in?',
          a: `No. Social sign-in uses the provider's own verification (Kakao, Google or Naver), so no separate password is created. Your password is never passed to us.`,
        },
        {
          q: 'I signed up with email but cannot sign in.',
          a: `Email sign-up sends a confirmation email. Open your inbox (including spam) and tap the link in that email before signing in. If no email arrives, sign up again with another address or use social sign-in.`,
        },
        {
          q: 'What personal data do you collect?',
          a: `When you sign up we process your email and name (or nickname); an email sign-up password is stored by the authentication service as a hash. Visit records, photos, favorites, AI chats and Today's Plan answers are saved only when you use those features. See the privacy notice for details and how to delete.`,
        },
      ],
    },
    {
      id: 'service',
      title: 'Using the service',
      items: [
        {
          q: 'What is Visit Holy Korea?',
          a: `A pilgrimage web app covering 206 Catholic shrines in Korea. It offers shrine stories and audio guides, pilgrimage routes that follow the history of persecution, Today's Plan matched to how you feel, and visit records.`,
        },
        {
          q: 'Where does the shrine information come from?',
          a: `It is written from verified sources such as each diocese's official shrine pages and Catholic Bishops' Conference of Korea materials. As a rule, unverified stories are not included.`,
        },
        {
          q: 'Are the Mass times accurate?',
          a: `They follow official diocesan sources, but Mass times and opening hours change with local circumstances. Always call the shrine office before visiting — the phone number is shown on each shrine page.`,
        },
        {
          q: 'Can I trust the Michael pilgrimage guide?',
          a: `Michael is limited to answering from our shrine database and says so when it does not know. AI answers are for reference only; confirm important details (Mass times, opening hours) with the shrine office.`,
        },
        {
          q: 'Where do the shrine photos come from?',
          a: `We use photos we took ourselves and freely licensed photos (for example from Wikimedia Commons). Where a license requires attribution, the source is shown on screen.`,
        },
      ],
    },
  ],

  es: [
    {
      id: 'account',
      title: 'Registro e inicio de sesión',
      items: [
        {
          q: '¿Cómo puedo iniciar sesión?',
          a: `Hay cuatro formas.
1. Registrarse con correo electrónico e iniciar sesión
2. Inicio de sesión social con una cuenta de Kakao
3. Inicio de sesión social con una cuenta de Google
4. Inicio de sesión social con una cuenta de Naver
Con el inicio de sesión social, la cuenta se crea en el primer acceso, sin un registro aparte.`,
        },
        {
          q: '¿Puedo usar la app sin registrarme?',
          a: `Sí. La información de los santuarios, las rutas de peregrinación, la búsqueda y el Plan de santuarios de hoy funcionan sin iniciar sesión.
Solo las funciones que guardan "mis registros", como el registro de peregrinación, requieren una cuenta.`,
        },
        {
          q: '¿Necesito una contraseña aparte con el inicio de sesión social?',
          a: `No. El inicio de sesión social usa la verificación del propio proveedor (Kakao, Google o Naver), así que no se crea otra contraseña. Tu contraseña nunca nos llega.`,
        },
        {
          q: 'Me registré con correo pero no puedo iniciar sesión.',
          a: `Al registrarte con correo se envía un mensaje de confirmación. Abre tu bandeja de entrada (incluido el spam) y pulsa el enlace de ese mensaje antes de iniciar sesión. Si no llega, regístrate de nuevo con otra dirección o usa el inicio de sesión social.`,
        },
        {
          q: '¿Qué datos personales recogen?',
          a: `Al registrarte tratamos tu correo y tu nombre (o apodo); la contraseña del registro por correo la guarda el servicio de autenticación como hash. Los registros de peregrinación, fotos, favoritos, conversaciones de IA y respuestas del Plan de santuarios de hoy solo se guardan cuando usas esas funciones. Consulta el aviso de privacidad para más detalles y cómo eliminarlos.`,
        },
      ],
    },
    {
      id: 'service',
      title: 'Uso del servicio',
      items: [
        {
          q: '¿Qué es Visit Holy Korea?',
          a: `Una app web de peregrinación que presenta 206 santuarios católicos de Corea. Ofrece historias y audioguías de los santuarios, rutas de peregrinación que siguen la historia de la persecución, el Plan de santuarios de hoy según cómo te sientes y el registro de peregrinación.`,
        },
        {
          q: '¿De dónde viene la información de los santuarios?',
          a: `Se redacta a partir de fuentes verificadas, como las páginas oficiales de cada diócesis y los materiales de la Conferencia Episcopal de Corea. Por norma, no se incluyen relatos sin verificar.`,
        },
        {
          q: '¿Son exactos los horarios de misa?',
          a: `Siguen las fuentes oficiales de las diócesis, pero los horarios de misa y de apertura cambian según las circunstancias locales. Llama siempre a la oficina del santuario antes de visitarlo; el teléfono aparece en la página de cada santuario.`,
        },
        {
          q: '¿Puedo fiarme del guía de peregrinación Miguel?',
          a: `Miguel solo responde con el contenido de nuestra base de datos de santuarios y lo dice cuando no sabe algo. Las respuestas de la IA son orientativas; confirma los datos importantes (horarios de misa y apertura) con la oficina del santuario.`,
        },
        {
          q: '¿De dónde proceden las fotos de los santuarios?',
          a: `Usamos fotos propias y fotos con licencia libre (por ejemplo de Wikimedia Commons). Cuando la licencia exige atribución, la fuente se muestra en pantalla.`,
        },
      ],
    },
  ],

  fr: [
    {
      id: 'account',
      title: 'Inscription et connexion',
      items: [
        {
          q: 'Comment puis-je me connecter ?',
          a: `Il y a quatre façons.
1. S’inscrire avec une adresse e-mail, puis se connecter
2. Connexion sociale avec un compte Kakao
3. Connexion sociale avec un compte Google
4. Connexion sociale avec un compte Naver
Avec la connexion sociale, le compte est créé dès la première connexion, sans inscription séparée.`,
        },
        {
          q: 'Puis-je utiliser l’application sans compte ?',
          a: `Oui. Les informations sur les sanctuaires, les parcours de pèlerinage, la recherche et le Plan de sanctuaires du jour fonctionnent sans connexion.
Seules les fonctions qui conservent « mes notes », comme le carnet de pèlerinage, nécessitent un compte.`,
        },
        {
          q: 'Faut-il un mot de passe séparé avec la connexion sociale ?',
          a: `Non. La connexion sociale utilise la vérification du fournisseur lui-même (Kakao, Google ou Naver) ; aucun mot de passe distinct n’est créé. Votre mot de passe ne nous est jamais transmis.`,
        },
        {
          q: 'Je me suis inscrit par e-mail mais je ne peux pas me connecter.',
          a: `L’inscription par e-mail envoie un message de confirmation. Ouvrez votre boîte de réception (y compris les indésirables) et touchez le lien de ce message avant de vous connecter. Si aucun message n’arrive, inscrivez-vous avec une autre adresse ou utilisez la connexion sociale.`,
        },
        {
          q: 'Quelles données personnelles collectez-vous ?',
          a: `À l’inscription, nous traitons votre e-mail et votre nom (ou pseudonyme) ; le mot de passe d’une inscription par e-mail est stocké sous forme de hachage par le service d’authentification. Le carnet de pèlerinage, les photos, favoris, conversations IA et réponses du Plan de sanctuaires du jour ne sont enregistrés que lorsque vous utilisez ces fonctions. Consultez l’avis de confidentialité pour les détails et la suppression.`,
        },
      ],
    },
    {
      id: 'service',
      title: 'Utilisation du service',
      items: [
        {
          q: 'Qu’est-ce que Visit Holy Korea ?',
          a: `Une application web de pèlerinage présentant 206 sanctuaires catholiques de Corée. Elle propose des récits et des audioguides des sanctuaires, des parcours de pèlerinage sur les traces de la persécution, le Plan de sanctuaires du jour selon votre état d’esprit et un carnet de pèlerinage.`,
        },
        {
          q: 'D’où viennent les informations sur les sanctuaires ?',
          a: `Elles sont rédigées à partir de sources vérifiées, comme les pages officielles de chaque diocèse et les documents de la Conférence des évêques de Corée. Par principe, les récits non vérifiés ne sont pas repris.`,
        },
        {
          q: 'Les horaires des messes sont-ils exacts ?',
          a: `Ils suivent les sources officielles des diocèses, mais les horaires des messes et d’ouverture changent selon les circonstances locales. Appelez toujours le bureau du sanctuaire avant votre visite ; le numéro figure sur la page de chaque sanctuaire.`,
        },
        {
          q: 'Peut-on faire confiance au guide de pèlerinage Michel ?',
          a: `Michel ne répond qu’à partir de notre base de données des sanctuaires et le dit lorsqu’il ne sait pas. Les réponses de l’IA sont indicatives ; confirmez les informations importantes (horaires des messes, ouverture) auprès du bureau du sanctuaire.`,
        },
        {
          q: 'D’où proviennent les photos des sanctuaires ?',
          a: `Nous utilisons nos propres photos et des photos sous licence libre (par exemple Wikimedia Commons). Lorsque la licence exige une attribution, la source est affichée à l’écran.`,
        },
      ],
    },
  ],

  pt: [
    {
      id: 'account',
      title: 'Cadastro e login',
      items: [
        {
          q: 'Como posso fazer login?',
          a: `Há quatro formas.
1. Cadastrar-se com e-mail e fazer login
2. Login social com uma conta Kakao
3. Login social com uma conta Google
4. Login social com uma conta Naver
No login social, a conta é criada no primeiro acesso, sem cadastro separado.`,
        },
        {
          q: 'Posso usar o app sem me cadastrar?',
          a: `Sim. As informações dos santuários, os roteiros de peregrinação, a busca e o Plano de santuários de hoje funcionam sem login.
Só as funções que guardam "meus registros", como o registro de peregrinação, exigem uma conta.`,
        },
        {
          q: 'Preciso de uma senha separada com o login social?',
          a: `Não. O login social usa a verificação do próprio provedor (Kakao, Google ou Naver), então nenhuma senha extra é criada. Sua senha nunca chega até nós.`,
        },
        {
          q: 'Cadastrei-me por e-mail, mas não consigo fazer login.',
          a: `O cadastro por e-mail envia uma mensagem de confirmação. Abra sua caixa de entrada (inclusive o spam) e toque no link dessa mensagem antes de fazer login. Se não chegar, cadastre-se de novo com outro endereço ou use o login social.`,
        },
        {
          q: 'Quais dados pessoais vocês coletam?',
          a: `No cadastro, tratamos seu e-mail e nome (ou apelido); a senha do cadastro por e-mail é guardada pelo serviço de autenticação como hash. Registros de peregrinação, fotos, favoritos, conversas de IA e respostas do Plano de santuários de hoje só são salvos quando você usa essas funções. Veja o aviso de privacidade para detalhes e como excluir.`,
        },
      ],
    },
    {
      id: 'service',
      title: 'Uso do serviço',
      items: [
        {
          q: 'O que é o Visit Holy Korea?',
          a: `Um app web de peregrinação que apresenta 206 santuários católicos da Coreia. Oferece histórias e audioguias dos santuários, roteiros de peregrinação que seguem a história da perseguição, o Plano de santuários de hoje conforme como você se sente e o registro de peregrinação.`,
        },
        {
          q: 'De onde vêm as informações dos santuários?',
          a: `São escritas a partir de fontes verificadas, como as páginas oficiais de cada diocese e os materiais da Conferência Episcopal da Coreia. Por princípio, relatos não verificados não são incluídos.`,
        },
        {
          q: 'Os horários de missa são exatos?',
          a: `Seguem as fontes oficiais das dioceses, mas os horários de missa e de abertura mudam conforme as circunstâncias locais. Ligue sempre para o escritório do santuário antes de visitar; o telefone aparece na página de cada santuário.`,
        },
        {
          q: 'Posso confiar no guia de peregrinação Miguel?',
          a: `O Miguel só responde com o conteúdo do nosso banco de dados de santuários e diz quando não sabe. As respostas da IA são apenas referência; confirme informações importantes (horários de missa e abertura) com o escritório do santuário.`,
        },
        {
          q: 'De onde vêm as fotos dos santuários?',
          a: `Usamos fotos próprias e fotos com licença livre (por exemplo, do Wikimedia Commons). Quando a licença exige atribuição, a fonte é exibida na tela.`,
        },
      ],
    },
  ],

  it: [
    {
      id: 'account',
      title: 'Registrazione e accesso',
      items: [
        {
          q: 'Come posso accedere?',
          a: `Ci sono quattro modi.
1. Registrarsi con l’e-mail e poi accedere
2. Accesso social con un account Kakao
3. Accesso social con un account Google
4. Accesso social con un account Naver
Con l’accesso social l’account viene creato al primo accesso, senza una registrazione separata.`,
        },
        {
          q: 'Posso usare l’app senza registrarmi?',
          a: `Sì. Le informazioni sui santuari, i percorsi di pellegrinaggio, la ricerca e il Piano dei santuari di oggi funzionano senza accesso.
Solo le funzioni che conservano «le mie note», come il diario di pellegrinaggio, richiedono un account.`,
        },
        {
          q: 'Serve una password separata con l’accesso social?',
          a: `No. L’accesso social usa la verifica del fornitore stesso (Kakao, Google o Naver), quindi non viene creata un’altra password. La tua password non ci viene mai trasmessa.`,
        },
        {
          q: 'Mi sono registrato con l’e-mail ma non riesco ad accedere.',
          a: `La registrazione via e-mail invia un messaggio di conferma. Apri la posta in arrivo (anche lo spam) e tocca il link di quel messaggio prima di accedere. Se non arriva nulla, registrati con un altro indirizzo o usa l’accesso social.`,
        },
        {
          q: 'Quali dati personali raccogliete?',
          a: `Alla registrazione trattiamo e-mail e nome (o nickname); la password della registrazione via e-mail è conservata dal servizio di autenticazione come hash. Diario di pellegrinaggio, foto, preferiti, conversazioni IA e risposte del Piano dei santuari di oggi vengono salvati solo quando usi quelle funzioni. Vedi l’informativa sulla privacy per i dettagli e la cancellazione.`,
        },
      ],
    },
    {
      id: 'service',
      title: 'Uso del servizio',
      items: [
        {
          q: 'Che cos’è Visit Holy Korea?',
          a: `Un’app web di pellegrinaggio che presenta 206 santuari cattolici della Corea. Offre storie e audioguide dei santuari, percorsi di pellegrinaggio sulle tracce della persecuzione, il Piano dei santuari di oggi secondo come ti senti e il diario di pellegrinaggio.`,
        },
        {
          q: 'Da dove vengono le informazioni sui santuari?',
          a: `Sono redatte da fonti verificate, come le pagine ufficiali di ogni diocesi e i materiali della Conferenza Episcopale Coreana. Per principio, i racconti non verificati non vengono inclusi.`,
        },
        {
          q: 'Gli orari delle messe sono esatti?',
          a: `Seguono le fonti ufficiali delle diocesi, ma gli orari delle messe e di apertura cambiano secondo le circostanze locali. Chiama sempre l’ufficio del santuario prima della visita; il numero è nella pagina di ogni santuario.`,
        },
        {
          q: 'Posso fidarmi della guida al pellegrinaggio Michele?',
          a: `Michele risponde solo con i contenuti del nostro database dei santuari e lo dice quando non sa. Le risposte dell’IA sono indicative; conferma le informazioni importanti (orari delle messe, apertura) con l’ufficio del santuario.`,
        },
        {
          q: 'Da dove provengono le foto dei santuari?',
          a: `Usiamo foto scattate da noi e foto con licenza libera (ad esempio da Wikimedia Commons). Quando la licenza richiede l’attribuzione, la fonte è mostrata sullo schermo.`,
        },
      ],
    },
  ],
};

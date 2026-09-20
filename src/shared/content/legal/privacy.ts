import type { Language } from '@/shared/i18n/dictionary';

/**
 * 개인정보 안내 본문 — 6개 국어.
 *
 * `pages/PrivacyPage.tsx` 가 ko/en 둘만 갖고 있어 스페인어 이용자도 영어를 보던 것을 나눴다 (T-031, 2026-09-20).
 * 2026-09-21 사장님과 항목별로 확인해 다시 썼다: 보호책임자(운영팀 대표), 국외 이전(도쿄·미국),
 * 이용자 권리(이름·비밀번호는 계정 설정에서 직접), 자동 수집(기기 저장소·접속 기록·분석 도구 없음),
 * 시행일 2026-09-21 과 개정 이력. 앱의 실제 저장·삭제 동작과 운영자가 확정한 값만 적는다 —
 * 한국어가 원문, 나머지는 번역. 절을 고칠 때는 여섯 언어를 함께 고친다.
 */
export interface PrivacySection {
  title: string;
  body: string;
}

export const PRIVACY: Record<Language, { title: string; sections: PrivacySection[] }> = {
  ko: {
    title: '개인정보 안내',
    sections: [
      {
        title: '수집하는 항목',
        body: '회원 가입 시 이메일, 비밀번호(해시 형태), 이름 또는 닉네임을 처리합니다. 간편 로그인(카카오·네이버·구글) 시에는 제공업체가 전달하는 계정 식별 정보와 이메일·이름을 처리하며, 제공업체의 비밀번호는 받지 않습니다. 순례 기록에는 성지·방문일·한 줄 메모·선택한 사진(최대 3장)이, 즐겨찾기와 오늘의 성지 일정을 이용하면 선택·응답 내용이 저장됩니다. 현재 위치는 「현재 위치 사용」 중 기기에서만 이용하며 서버에 저장하지 않습니다. 만 14세 미만은 가입할 수 없습니다.',
      },
      {
        title: '자동으로 저장되는 것',
        body: '설정(언어·글자 크기·출발지)과 이 기기에서 표시한 방문 표시, 로그인 유지 정보는 이용자의 기기(브라우저 저장소)에만 저장되며 브라우저 저장소를 지우면 함께 사라집니다. 접속 시각·IP 주소·브라우저 정보는 서비스 안정과 보안을 위해 호스팅 사업자가 일정 기간 보관합니다. 광고나 행동 분석 도구는 쓰지 않습니다.',
      },
      {
        title: 'AI 가이드(미카엘) 대화',
        body: '로그인한 상태에서 미카엘에게 한 질문과 답은 계정에 저장되어 다음에 열어도 이어서 볼 수 있습니다. 본인만 볼 수 있고, 대화창의 「대화 지우기」로 언제든 전부 삭제됩니다. 로그인하지 않으면 저장하지 않습니다. 질문에 이름·연락처 같은 개인정보를 넣지 마세요. 답변 생성에는 Anthropic Claude 를 사용하며(장애 시 Google Gemini 로 대신 답합니다) 질문 내용이 그 서비스로 전송됩니다.',
      },
      {
        title: '이용 목적',
        body: '로그인과 본인 확인, 순례 기록·즐겨찾기·AI 대화·오늘의 성지 일정 결과의 저장과 표시에 사용합니다. 순례 기록의 한 줄과 사진은 다른 이용자에게도 익명으로 공개됩니다.',
      },
      {
        title: '보유 기간',
        body: '계정 정보와 이에 연결된 순례 기록·사진·즐겨찾기·AI 대화·오늘의 성지 일정 응답은 회원이 서비스를 이용하는 동안(탈퇴 시까지) 보유합니다. 개별 기록을 지우거나 탈퇴하면 해당 정보를 지체 없이 삭제합니다. 다른 법령에 따라 특정 정보를 보존해야 하는 경우에는 해당 항목만 그 법정 기간 동안 분리해 보관합니다.',
      },
      {
        title: '국외 이전',
        body: '이 서비스는 다음 사업자의 해외 서버를 사용하며, 이용자가 서비스를 이용하는 동안(탈퇴 시까지) 아래 정보가 인터넷을 통해 전송·보관됩니다.\n· Supabase (인증·데이터베이스·사진 저장) — 일본(도쿄) — 계정 정보, 순례 기록·사진, 즐겨찾기, AI 대화 — 서비스 운영\n· Vercel (웹 호스팅) — 미국 — 접속 시각·IP·브라우저 정보 — 화면 전송과 보안\n· Anthropic, Google (AI 답변 생성) — 미국 — 미카엘에게 한 질문 글 — 답변 생성\n· Resend (인증 메일 발송) — 미국 사업자(서버 일본) — 이메일 주소 — 가입 확인 메일 발송\n· Google·카카오·네이버 (간편 로그인) — 미국·한국 — 계정 식별 정보 — 로그인\n국외 이전을 원하지 않으면 가입하지 않거나 계정을 삭제할 수 있으며, 그 경우 로그인이 필요한 기능은 이용할 수 없습니다.',
      },
      {
        title: '이용자의 권리',
        body: '이용자는 자신의 개인정보를 열람·정정·삭제하거나 처리 정지를 요구할 수 있습니다. 이름과 비밀번호는 「더보기 → 계정 설정」에서, 순례 기록은 「기록」에서 직접 고치거나 지울 수 있습니다. 처리 정지와 동의 철회는 계정 삭제로 하거나 아래 이메일로 요청하면 됩니다. 이메일 요청은 본인 확인 후 지체 없이 처리하고, 접수 후 10일 안에 결과를 알립니다.',
      },
      {
        title: '삭제 방법',
        body: '순례 기록은 「기록」에서 직접 삭제할 수 있습니다. 탈퇴는 로그인 후 「더보기 → 계정 설정 → 계정 삭제」에서 진행하며, 사진 원본과 공개 기록을 포함한 연결 정보를 지운 뒤 계정을 삭제합니다. 로그인이 어려우면 아래 이메일로 요청하세요. 전자 파일은 복구되지 않도록 삭제합니다.',
      },
      {
        title: '외부 서비스 이용',
        body: '인증·데이터 저장은 Supabase, 웹 호스팅은 Vercel, 가입 확인 메일은 Resend 를 사용합니다. 주변 관광 정보와 예상 밀집도는 한국관광공사 OpenAPI(TourAPI)를 실시간으로 호출하며 응답을 저장하지 않습니다. 외부 지도(Google·Apple·카카오·T맵·네이버)는 링크로만 열리며 각 서비스의 정책을 따릅니다.',
      },
      {
        title: '안전조치',
        body: '모든 통신은 HTTPS 로 암호화됩니다. 비밀번호는 해시로만 저장하고, 데이터베이스는 계정별 접근 제한(행 수준 보안)을 두어 본인 것만 읽고 쓸 수 있습니다. 외부 API 키는 서버에만 두고 브라우저에 내보내지 않습니다.',
      },
      {
        title: '개인정보 보호책임자 · 문의',
        body: '개인정보 보호책임자: Visit Holy Korea 운영팀(대표) · visitholykorea@gmail.com\n개인정보 관련 문의·고충·권리 행사 요청은 위 이메일로 보내 주세요.',
      },
      {
        title: '시행일과 개정 이력',
        body: '이 안내는 2026년 9월 21일부터 시행합니다.\n· 2026-08-18 첫 공개\n· 2026-09-21 국외 이전·이용자 권리·자동 저장 항목·보호책임자·안전조치 추가',
      },
    ],
  },

  en: {
    title: 'Privacy notice',
    sections: [
      {
        title: 'What we collect',
        body: 'When you create an account, we process your email, password (stored as a hash), and name or nickname. Social sign-in (Kakao, Naver, Google) provides an account identifier, email and name; we never receive the provider’s password. Visit records contain the shrine, visit date, one-line note and optional photos (up to 3). Favorites and Today’s Plan answers are saved when used. Your location is used on your device only while location access is on and is not stored on our server. Persons under 14 may not sign up.',
      },
      {
        title: 'What is stored automatically',
        body: 'Settings (language, text size, starting region), device-only visit markers and sign-in state are kept only in your device’s browser storage and disappear when you clear it. Access time, IP address and browser information are kept by the hosting provider for a limited period for stability and security. We use no advertising or behavioral analytics tools.',
      },
      {
        title: 'AI guide (Michael) conversations',
        body: 'While signed in, your questions to Michael and its answers are saved to your account so the conversation continues next time. Only you can see them, and “Clear chat” in the chat window deletes them all at any time. Nothing is saved when you are not signed in. Please do not include personal details such as names or contact information in questions. Answers are generated with Anthropic Claude (Google Gemini as a backup when Claude is unavailable), so question text is sent to that service.',
      },
      {
        title: 'Why we use it',
        body: 'We use this information to sign you in, verify your identity, and save and show visit records, favorites, AI chats and Today’s Plan results. Visit notes and photos are also shown anonymously to other users.',
      },
      {
        title: 'Retention period',
        body: 'Account data and linked visit records, photos, favorites, AI chats and Today’s Plan answers are kept while you use the service (until you close your account). We delete a record when you delete it, and delete account-linked information without delay when you close your account. If another law requires retention of specific information, only that information is kept separately for the required period.',
      },
      {
        title: 'International transfers',
        body: 'This service uses servers of the following providers outside Korea. The data below is transmitted over the internet and kept while you use the service (until you close your account).\n· Supabase (authentication, database, photo storage) — Japan (Tokyo) — account data, visit records and photos, favorites, AI chats — service operation\n· Vercel (web hosting) — United States — access time, IP, browser information — page delivery and security\n· Anthropic, Google (AI answers) — United States — question text sent to Michael — answer generation\n· Resend (verification email) — US provider (servers in Japan) — email address — sign-up confirmation email\n· Google, Kakao, Naver (social sign-in) — United States / Korea — account identifier — sign-in\nIf you do not wish your data to be transferred abroad, you may choose not to sign up or delete your account; features that require sign-in will then be unavailable.',
      },
      {
        title: 'Your rights',
        body: 'You may access, correct or delete your personal data, or ask us to stop processing it. Change your name and password in “More → Account settings”, and edit or delete visit records in “Records”. To stop processing or withdraw consent, delete your account or email us below. Email requests are handled without delay after identity verification, and we reply with the result within 10 days of receipt.',
      },
      {
        title: 'How to delete',
        body: 'Delete individual visit records in “Records”. To close your account, sign in and choose “More → Account settings → Delete account”; linked information, including original photos and public notes, is removed before the account. If you cannot sign in, request deletion by email below. Electronic files are deleted so they cannot be restored.',
      },
      {
        title: 'Third-party services',
        body: 'Authentication and data storage use Supabase, web hosting uses Vercel, and sign-up confirmation emails use Resend. Nearby tourism information and expected crowding are fetched live from the Korea Tourism Organization OpenAPI (TourAPI) and responses are not stored. External maps (Google, Apple, Kakao, T map, Naver) open by link only and follow their own policies.',
      },
      {
        title: 'Security measures',
        body: 'All traffic is encrypted with HTTPS. Passwords are stored only as hashes, and the database enforces per-account access control (row-level security) so you can read and write only your own data. External API keys are kept on the server and never shipped to the browser.',
      },
      {
        title: 'Privacy officer · Contact',
        body: 'Privacy officer: Visit Holy Korea operations team (representative) · visitholykorea@gmail.com\nSend privacy inquiries, complaints and requests to exercise your rights to this address.',
      },
      {
        title: 'Effective date and revisions',
        body: 'This notice takes effect on September 21, 2026.\n· 2026-08-18 first published\n· 2026-09-21 added international transfers, your rights, automatic storage, privacy officer and security measures',
      },
    ],
  },

  es: {
    title: 'Aviso de privacidad',
    sections: [
      {
        title: 'Qué datos tratamos',
        body: 'Al crear una cuenta tratamos tu correo electrónico, tu contraseña (guardada como hash) y tu nombre o apodo. El inicio de sesión social (Kakao, Naver, Google) nos proporciona un identificador de cuenta, el correo y el nombre; nunca recibimos la contraseña del proveedor. Los registros de peregrinación contienen el santuario, la fecha de visita, una nota de una línea y fotos opcionales (hasta 3). Los favoritos y las respuestas del Plan de santuarios de hoy se guardan cuando usas esas funciones. Tu ubicación se usa solo en tu dispositivo mientras el acceso a la ubicación está activado y no se guarda en nuestro servidor. Los menores de 14 años no pueden registrarse.',
      },
      {
        title: 'Qué se guarda automáticamente',
        body: 'Los ajustes (idioma, tamaño de letra, región de salida), las marcas de visita del dispositivo y el estado de sesión se guardan solo en el almacenamiento del navegador de tu dispositivo y desaparecen al borrarlo. La hora de acceso, la dirección IP y la información del navegador las conserva el proveedor de alojamiento durante un periodo limitado por estabilidad y seguridad. No usamos herramientas de publicidad ni de análisis de comportamiento.',
      },
      {
        title: 'Conversaciones con el guía de IA (Miguel)',
        body: 'Si has iniciado sesión, tus preguntas a Miguel y sus respuestas se guardan en tu cuenta para que la conversación continúe la próxima vez. Solo tú puedes verlas, y «Borrar la conversación» en la ventana de chat las elimina todas en cualquier momento. Si no has iniciado sesión, no se guarda nada. No incluyas en las preguntas datos personales como nombres o datos de contacto. Las respuestas se generan con Anthropic Claude (Google Gemini como respaldo si Claude no está disponible), por lo que el texto de la pregunta se envía a ese servicio.',
      },
      {
        title: 'Para qué los usamos',
        body: 'Usamos esta información para iniciar tu sesión, verificar tu identidad, y guardar y mostrar los registros de peregrinación, favoritos, conversaciones de IA y resultados del Plan de santuarios de hoy. Las notas y fotos de visita también se muestran de forma anónima a otros usuarios.',
      },
      {
        title: 'Plazo de conservación',
        body: 'Los datos de la cuenta y los registros de peregrinación, fotos, favoritos, conversaciones de IA y respuestas del Plan de santuarios de hoy vinculados se conservan mientras uses el servicio (hasta que cierres la cuenta). Eliminamos un registro cuando lo borras y eliminamos sin demora la información vinculada a la cuenta cuando la cierras. Si otra ley exige conservar cierta información, solo esa información se guarda por separado durante el plazo exigido.',
      },
      {
        title: 'Transferencias internacionales',
        body: 'Este servicio usa servidores de los siguientes proveedores fuera de Corea. Los datos indicados se transmiten por internet y se conservan mientras uses el servicio (hasta que cierres la cuenta).\n· Supabase (autenticación, base de datos, almacenamiento de fotos) — Japón (Tokio) — datos de la cuenta, registros de peregrinación y fotos, favoritos, conversaciones de IA — operación del servicio\n· Vercel (alojamiento web) — Estados Unidos — hora de acceso, IP, información del navegador — entrega de páginas y seguridad\n· Anthropic, Google (respuestas de IA) — Estados Unidos — texto de las preguntas a Miguel — generación de respuestas\n· Resend (correo de verificación) — proveedor de EE. UU. (servidores en Japón) — dirección de correo — correo de confirmación de registro\n· Google, Kakao, Naver (inicio de sesión social) — Estados Unidos / Corea — identificador de cuenta — inicio de sesión\nSi no deseas que tus datos se transfieran al extranjero, puedes no registrarte o eliminar tu cuenta; en ese caso no podrás usar las funciones que requieren iniciar sesión.',
      },
      {
        title: 'Tus derechos',
        body: 'Puedes acceder a tus datos personales, corregirlos, eliminarlos o pedir que dejemos de tratarlos. Cambia tu nombre y contraseña en «Más → Ajustes de la cuenta» y edita o elimina los registros de peregrinación en «Registros». Para detener el tratamiento o retirar el consentimiento, elimina tu cuenta o escríbenos al correo de abajo. Las solicitudes por correo se atienden sin demora tras verificar tu identidad y respondemos con el resultado en un plazo de 10 días desde la recepción.',
      },
      {
        title: 'Cómo eliminar',
        body: 'Puedes eliminar cada registro de peregrinación en «Registros». Para cerrar la cuenta, inicia sesión y elige «Más → Ajustes de la cuenta → Eliminar cuenta»; la información vinculada, incluidas las fotos originales y las notas públicas, se elimina antes que la cuenta. Si no puedes iniciar sesión, solicita la eliminación por el correo de abajo. Los archivos electrónicos se eliminan de forma que no puedan recuperarse.',
      },
      {
        title: 'Servicios de terceros',
        body: 'La autenticación y el almacenamiento de datos usan Supabase, el alojamiento web usa Vercel y los correos de confirmación de registro usan Resend. La información turística cercana y la afluencia prevista se obtienen en tiempo real de la OpenAPI de la Organización de Turismo de Corea (TourAPI) y las respuestas no se guardan. Los mapas externos (Google, Apple, Kakao, T map, Naver) se abren solo mediante enlace y siguen sus propias políticas.',
      },
      {
        title: 'Medidas de seguridad',
        body: 'Todo el tráfico se cifra con HTTPS. Las contraseñas se guardan solo como hash y la base de datos aplica control de acceso por cuenta (seguridad a nivel de fila), de modo que solo puedes leer y escribir tus propios datos. Las claves de API externas se guardan en el servidor y nunca se envían al navegador.',
      },
      {
        title: 'Responsable de privacidad · Contacto',
        body: 'Responsable de privacidad: equipo de operaciones de Visit Holy Korea (representante) · visitholykorea@gmail.com\nEnvía a esta dirección tus consultas, reclamaciones y solicitudes para ejercer tus derechos.',
      },
      {
        title: 'Fecha de vigencia y revisiones',
        body: 'Este aviso entra en vigor el 21 de septiembre de 2026.\n· 2026-08-18 primera publicación\n· 2026-09-21 se añaden transferencias internacionales, tus derechos, almacenamiento automático, responsable de privacidad y medidas de seguridad',
      },
    ],
  },

  fr: {
    title: 'Avis de confidentialité',
    sections: [
      {
        title: 'Données traitées',
        body: 'Lors de la création d’un compte, nous traitons votre adresse e-mail, votre mot de passe (stocké sous forme de hachage) et votre nom ou pseudonyme. La connexion sociale (Kakao, Naver, Google) nous fournit un identifiant de compte, l’e-mail et le nom ; nous ne recevons jamais le mot de passe du fournisseur. Le carnet de pèlerinage contient le sanctuaire, la date de visite, une note d’une ligne et des photos facultatives (3 au maximum). Les favoris et les réponses du Plan de sanctuaires du jour sont enregistrés lorsque vous utilisez ces fonctions. Votre position est utilisée uniquement sur votre appareil tant que l’accès à la position est activé et n’est pas stockée sur notre serveur. Les personnes de moins de 14 ans ne peuvent pas s’inscrire.',
      },
      {
        title: 'Données enregistrées automatiquement',
        body: 'Les réglages (langue, taille du texte, région de départ), les marques de visite de l’appareil et l’état de connexion sont conservés uniquement dans le stockage du navigateur de votre appareil et disparaissent lorsque vous le videz. L’heure d’accès, l’adresse IP et les informations du navigateur sont conservées par l’hébergeur pendant une durée limitée, pour la stabilité et la sécurité. Nous n’utilisons aucun outil publicitaire ni d’analyse comportementale.',
      },
      {
        title: 'Conversations avec le guide IA (Michel)',
        body: 'Lorsque vous êtes connecté, vos questions à Michel et ses réponses sont enregistrées dans votre compte afin que la conversation reprenne la fois suivante. Vous seul pouvez les voir, et « Effacer la conversation » dans la fenêtre de discussion les supprime toutes à tout moment. Rien n’est enregistré si vous n’êtes pas connecté. N’indiquez pas de données personnelles (noms, coordonnées) dans vos questions. Les réponses sont générées avec Anthropic Claude (Google Gemini en secours si Claude est indisponible) ; le texte de la question est donc transmis à ce service.',
      },
      {
        title: 'Finalités',
        body: 'Nous utilisons ces informations pour vous connecter, vérifier votre identité, et enregistrer et afficher le carnet de pèlerinage, les favoris, les conversations IA et les résultats du Plan de sanctuaires du jour. Les notes et photos de visite sont aussi affichées de façon anonyme aux autres utilisateurs.',
      },
      {
        title: 'Durée de conservation',
        body: 'Les données du compte et le carnet de pèlerinage, les photos, favoris, conversations IA et réponses du Plan de sanctuaires du jour qui y sont liés sont conservés tant que vous utilisez le service (jusqu’à la fermeture du compte). Nous supprimons une note lorsque vous l’effacez et supprimons sans délai les informations liées au compte lorsque vous le fermez. Si une autre loi impose la conservation de certaines informations, seules celles-ci sont conservées séparément pendant la durée requise.',
      },
      {
        title: 'Transferts internationaux',
        body: 'Ce service utilise les serveurs des fournisseurs suivants hors de Corée. Les données ci-dessous sont transmises par internet et conservées tant que vous utilisez le service (jusqu’à la fermeture du compte).\n· Supabase (authentification, base de données, stockage des photos) — Japon (Tokyo) — données du compte, carnet de pèlerinage et photos, favoris, conversations IA — fonctionnement du service\n· Vercel (hébergement web) — États-Unis — heure d’accès, IP, informations du navigateur — diffusion des pages et sécurité\n· Anthropic, Google (réponses IA) — États-Unis — texte des questions posées à Michel — génération des réponses\n· Resend (e-mail de vérification) — fournisseur américain (serveurs au Japon) — adresse e-mail — e-mail de confirmation d’inscription\n· Google, Kakao, Naver (connexion sociale) — États-Unis / Corée — identifiant de compte — connexion\nSi vous ne souhaitez pas que vos données soient transférées à l’étranger, vous pouvez ne pas vous inscrire ou supprimer votre compte ; les fonctions nécessitant une connexion ne seront alors pas disponibles.',
      },
      {
        title: 'Vos droits',
        body: 'Vous pouvez accéder à vos données personnelles, les rectifier, les supprimer ou demander l’arrêt de leur traitement. Modifiez votre nom et votre mot de passe dans « Plus → Paramètres du compte » et modifiez ou supprimez vos notes de visite dans « Mes notes ». Pour arrêter le traitement ou retirer votre consentement, supprimez votre compte ou écrivez-nous à l’adresse ci-dessous. Les demandes par e-mail sont traitées sans délai après vérification de votre identité et nous vous communiquons le résultat dans les 10 jours suivant la réception.',
      },
      {
        title: 'Comment supprimer',
        body: 'Supprimez chaque note de visite dans « Mes notes ». Pour fermer votre compte, connectez-vous et choisissez « Plus → Paramètres du compte → Supprimer le compte » ; les informations liées, y compris les photos originales et les notes publiques, sont supprimées avant le compte. Si vous ne pouvez pas vous connecter, demandez la suppression par e-mail ci-dessous. Les fichiers électroniques sont supprimés de façon irrécupérable.',
      },
      {
        title: 'Services tiers',
        body: 'L’authentification et le stockage des données utilisent Supabase, l’hébergement web utilise Vercel et les e-mails de confirmation d’inscription utilisent Resend. Les informations touristiques à proximité et l’affluence prévue sont récupérées en temps réel via l’OpenAPI de l’Office du tourisme de Corée (TourAPI) et les réponses ne sont pas stockées. Les cartes externes (Google, Apple, Kakao, T map, Naver) s’ouvrent uniquement par lien et suivent leurs propres politiques.',
      },
      {
        title: 'Mesures de sécurité',
        body: 'Tout le trafic est chiffré en HTTPS. Les mots de passe sont stockés uniquement sous forme de hachage et la base de données applique un contrôle d’accès par compte (sécurité au niveau des lignes), de sorte que vous ne pouvez lire et écrire que vos propres données. Les clés d’API externes restent sur le serveur et ne sont jamais envoyées au navigateur.',
      },
      {
        title: 'Responsable de la confidentialité · Contact',
        body: 'Responsable de la confidentialité : équipe d’exploitation de Visit Holy Korea (représentant) · visitholykorea@gmail.com\nAdressez vos questions, réclamations et demandes d’exercice de vos droits à cette adresse.',
      },
      {
        title: 'Date d’entrée en vigueur et révisions',
        body: 'Le présent avis entre en vigueur le 21 septembre 2026.\n· 2026-08-18 première publication\n· 2026-09-21 ajout des transferts internationaux, de vos droits, des données enregistrées automatiquement, du responsable de la confidentialité et des mesures de sécurité',
      },
    ],
  },

  pt: {
    title: 'Aviso de privacidade',
    sections: [
      {
        title: 'Dados que tratamos',
        body: 'Ao criar uma conta, tratamos seu e-mail, sua senha (armazenada como hash) e seu nome ou apelido. O login social (Kakao, Naver, Google) nos fornece um identificador de conta, o e-mail e o nome; nunca recebemos a senha do provedor. Os registros de peregrinação contêm o santuário, a data da visita, uma nota de uma linha e fotos opcionais (até 3). Os favoritos e as respostas do Plano de santuários de hoje são salvos quando você usa essas funções. Sua localização é usada apenas no seu dispositivo enquanto o acesso à localização está ativado e não é armazenada no nosso servidor. Menores de 14 anos não podem se cadastrar.',
      },
      {
        title: 'O que é salvo automaticamente',
        body: 'As configurações (idioma, tamanho do texto, região de partida), as marcas de visita do dispositivo e o estado de login ficam apenas no armazenamento do navegador do seu dispositivo e desaparecem quando você o limpa. Hora de acesso, endereço IP e informações do navegador são mantidos pelo provedor de hospedagem por um período limitado, para estabilidade e segurança. Não usamos ferramentas de publicidade nem de análise de comportamento.',
      },
      {
        title: 'Conversas com o guia de IA (Miguel)',
        body: 'Com o login feito, suas perguntas ao Miguel e as respostas dele são salvas na sua conta para que a conversa continue da próxima vez. Só você pode vê-las, e “Apagar a conversa” na janela de chat as exclui todas a qualquer momento. Sem login, nada é salvo. Não inclua nas perguntas dados pessoais, como nomes ou contatos. As respostas são geradas com Anthropic Claude (Google Gemini como reserva quando o Claude está indisponível), portanto o texto da pergunta é enviado a esse serviço.',
      },
      {
        title: 'Para que usamos',
        body: 'Usamos essas informações para fazer seu login, verificar sua identidade, e salvar e exibir registros de peregrinação, favoritos, conversas de IA e resultados do Plano de santuários de hoje. As notas e fotos de visita também são exibidas anonimamente para outros usuários.',
      },
      {
        title: 'Prazo de retenção',
        body: 'Os dados da conta e os registros de peregrinação, fotos, favoritos, conversas de IA e respostas do Plano de santuários de hoje vinculados são mantidos enquanto você usa o serviço (até encerrar a conta). Excluímos um registro quando você o apaga e excluímos sem demora as informações vinculadas à conta quando você a encerra. Se outra lei exigir a retenção de determinadas informações, apenas elas são mantidas separadamente pelo prazo exigido.',
      },
      {
        title: 'Transferências internacionais',
        body: 'Este serviço usa servidores dos seguintes provedores fora da Coreia. Os dados abaixo são transmitidos pela internet e mantidos enquanto você usa o serviço (até encerrar a conta).\n· Supabase (autenticação, banco de dados, armazenamento de fotos) — Japão (Tóquio) — dados da conta, registros de peregrinação e fotos, favoritos, conversas de IA — operação do serviço\n· Vercel (hospedagem web) — Estados Unidos — hora de acesso, IP, informações do navegador — entrega das páginas e segurança\n· Anthropic, Google (respostas de IA) — Estados Unidos — texto das perguntas ao Miguel — geração de respostas\n· Resend (e-mail de verificação) — provedor dos EUA (servidores no Japão) — endereço de e-mail — e-mail de confirmação de cadastro\n· Google, Kakao, Naver (login social) — Estados Unidos / Coreia — identificador de conta — login\nSe não quiser que seus dados sejam transferidos para o exterior, você pode não se cadastrar ou excluir sua conta; nesse caso, as funções que exigem login não ficarão disponíveis.',
      },
      {
        title: 'Seus direitos',
        body: 'Você pode acessar, corrigir ou excluir seus dados pessoais, ou pedir que paremos de tratá-los. Altere seu nome e senha em “Mais → Configurações da conta” e edite ou exclua registros de peregrinação em “Registros”. Para interromper o tratamento ou retirar o consentimento, exclua sua conta ou escreva para o e-mail abaixo. Pedidos por e-mail são atendidos sem demora após a verificação da identidade, e respondemos com o resultado em até 10 dias após o recebimento.',
      },
      {
        title: 'Como excluir',
        body: 'Exclua cada registro de peregrinação em “Registros”. Para encerrar a conta, faça login e escolha “Mais → Configurações da conta → Excluir conta”; as informações vinculadas, incluindo fotos originais e notas públicas, são removidas antes da conta. Se não conseguir fazer login, solicite a exclusão pelo e-mail abaixo. Os arquivos eletrônicos são excluídos de forma irrecuperável.',
      },
      {
        title: 'Serviços de terceiros',
        body: 'A autenticação e o armazenamento de dados usam o Supabase, a hospedagem web usa a Vercel e os e-mails de confirmação de cadastro usam o Resend. As informações turísticas próximas e o movimento previsto são obtidos em tempo real da OpenAPI da Organização de Turismo da Coreia (TourAPI), e as respostas não são armazenadas. Os mapas externos (Google, Apple, Kakao, T map, Naver) abrem apenas por link e seguem suas próprias políticas.',
      },
      {
        title: 'Medidas de segurança',
        body: 'Todo o tráfego é criptografado com HTTPS. As senhas são armazenadas apenas como hash e o banco de dados aplica controle de acesso por conta (segurança em nível de linha), de modo que você só pode ler e gravar seus próprios dados. As chaves de APIs externas ficam no servidor e nunca são enviadas ao navegador.',
      },
      {
        title: 'Responsável pela privacidade · Contato',
        body: 'Responsável pela privacidade: equipe de operações do Visit Holy Korea (representante) · visitholykorea@gmail.com\nEnvie dúvidas, reclamações e pedidos de exercício de direitos para este endereço.',
      },
      {
        title: 'Data de vigência e revisões',
        body: 'Este aviso entra em vigor em 21 de setembro de 2026.\n· 2026-08-18 primeira publicação\n· 2026-09-21 inclusão de transferências internacionais, seus direitos, dados salvos automaticamente, responsável pela privacidade e medidas de segurança',
      },
    ],
  },

  it: {
    title: 'Informativa sulla privacy',
    sections: [
      {
        title: 'Dati che trattiamo',
        body: 'Quando crei un account trattiamo il tuo indirizzo e-mail, la password (conservata come hash) e il nome o nickname. L’accesso social (Kakao, Naver, Google) ci fornisce un identificativo dell’account, l’e-mail e il nome; non riceviamo mai la password del fornitore. Il diario di pellegrinaggio contiene il santuario, la data della visita, una nota di una riga e foto facoltative (fino a 3). I preferiti e le risposte del Piano dei santuari di oggi vengono salvati quando usi quelle funzioni. La tua posizione è usata solo sul tuo dispositivo finché l’accesso alla posizione è attivo e non viene memorizzata sul nostro server. I minori di 14 anni non possono registrarsi.',
      },
      {
        title: 'Cosa viene salvato automaticamente',
        body: 'Le impostazioni (lingua, dimensione del testo, regione di partenza), i segni di visita del dispositivo e lo stato di accesso restano solo nella memoria del browser del tuo dispositivo e scompaiono quando la svuoti. Ora di accesso, indirizzo IP e informazioni sul browser sono conservati dal fornitore di hosting per un periodo limitato, per stabilità e sicurezza. Non usiamo strumenti pubblicitari né di analisi del comportamento.',
      },
      {
        title: 'Conversazioni con la guida IA (Michele)',
        body: 'Se hai effettuato l’accesso, le tue domande a Michele e le sue risposte vengono salvate nel tuo account, così la conversazione riprende la volta successiva. Solo tu puoi vederle, e «Cancella la conversazione» nella finestra di chat le elimina tutte in qualsiasi momento. Senza accesso non viene salvato nulla. Non inserire nelle domande dati personali come nomi o contatti. Le risposte sono generate con Anthropic Claude (Google Gemini come riserva quando Claude non è disponibile), quindi il testo della domanda viene inviato a quel servizio.',
      },
      {
        title: 'Finalità',
        body: 'Usiamo queste informazioni per farti accedere, verificare la tua identità, e salvare e mostrare diario di pellegrinaggio, preferiti, conversazioni IA e risultati del Piano dei santuari di oggi. Le note e le foto di visita sono mostrate in forma anonima anche agli altri utenti.',
      },
      {
        title: 'Periodo di conservazione',
        body: 'I dati dell’account e il diario di pellegrinaggio, le foto, i preferiti, le conversazioni IA e le risposte del Piano dei santuari di oggi collegati vengono conservati finché usi il servizio (fino alla chiusura dell’account). Eliminiamo una nota quando la cancelli ed eliminiamo senza ritardo le informazioni collegate all’account quando lo chiudi. Se un’altra legge impone la conservazione di determinate informazioni, solo quelle vengono conservate separatamente per il periodo richiesto.',
      },
      {
        title: 'Trasferimenti internazionali',
        body: 'Questo servizio usa i server dei seguenti fornitori fuori dalla Corea. I dati indicati vengono trasmessi via internet e conservati finché usi il servizio (fino alla chiusura dell’account).\n· Supabase (autenticazione, database, archiviazione foto) — Giappone (Tokyo) — dati dell’account, diario di pellegrinaggio e foto, preferiti, conversazioni IA — funzionamento del servizio\n· Vercel (hosting web) — Stati Uniti — ora di accesso, IP, informazioni sul browser — consegna delle pagine e sicurezza\n· Anthropic, Google (risposte IA) — Stati Uniti — testo delle domande a Michele — generazione delle risposte\n· Resend (e-mail di verifica) — fornitore statunitense (server in Giappone) — indirizzo e-mail — e-mail di conferma della registrazione\n· Google, Kakao, Naver (accesso social) — Stati Uniti / Corea — identificativo dell’account — accesso\nSe non desideri che i tuoi dati siano trasferiti all’estero, puoi non registrarti o eliminare il tuo account; le funzioni che richiedono l’accesso non saranno disponibili.',
      },
      {
        title: 'I tuoi diritti',
        body: 'Puoi accedere ai tuoi dati personali, correggerli, eliminarli o chiedere di interromperne il trattamento. Cambia nome e password in «Altro → Impostazioni account» e modifica o elimina le note di visita in «Le mie note». Per interrompere il trattamento o revocare il consenso, elimina l’account o scrivici all’indirizzo qui sotto. Le richieste via e-mail vengono gestite senza ritardo dopo la verifica dell’identità e comunichiamo l’esito entro 10 giorni dal ricevimento.',
      },
      {
        title: 'Come eliminare',
        body: 'Elimina ogni nota di visita in «Le mie note». Per chiudere l’account, accedi e scegli «Altro → Impostazioni account → Elimina account»; le informazioni collegate, comprese le foto originali e le note pubbliche, vengono rimosse prima dell’account. Se non riesci ad accedere, richiedi l’eliminazione via e-mail qui sotto. I file elettronici vengono eliminati in modo irrecuperabile.',
      },
      {
        title: 'Servizi di terzi',
        body: 'Autenticazione e archiviazione dei dati usano Supabase, l’hosting web usa Vercel e le e-mail di conferma della registrazione usano Resend. Le informazioni turistiche nelle vicinanze e l’affollamento previsto sono recuperati in tempo reale dall’OpenAPI dell’Organizzazione del Turismo Coreano (TourAPI) e le risposte non vengono memorizzate. Le mappe esterne (Google, Apple, Kakao, T map, Naver) si aprono solo tramite link e seguono le proprie politiche.',
      },
      {
        title: 'Misure di sicurezza',
        body: 'Tutto il traffico è cifrato con HTTPS. Le password sono conservate solo come hash e il database applica un controllo di accesso per account (sicurezza a livello di riga), così puoi leggere e scrivere solo i tuoi dati. Le chiavi delle API esterne restano sul server e non vengono mai inviate al browser.',
      },
      {
        title: 'Responsabile della privacy · Contatti',
        body: 'Responsabile della privacy: team operativo di Visit Holy Korea (rappresentante) · visitholykorea@gmail.com\nInvia a questo indirizzo richieste, reclami e istanze per l’esercizio dei tuoi diritti.',
      },
      {
        title: 'Data di entrata in vigore e revisioni',
        body: 'La presente informativa entra in vigore il 21 settembre 2026.\n· 2026-08-18 prima pubblicazione\n· 2026-09-21 aggiunti trasferimenti internazionali, i tuoi diritti, dati salvati automaticamente, responsabile della privacy e misure di sicurezza',
      },
    ],
  },
};

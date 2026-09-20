import type { Language } from '@/shared/i18n/dictionary';

/**
 * 개인정보 안내 본문 — 6개 국어.
 *
 * 한국어가 원문이고 나머지는 번역이다(2026-09-21, T-031). 앱의 실제 저장·삭제 동작과
 * 운영자가 확정한 값만 적는다. 동작이 바뀌면 **여섯 언어를 같이** 고친다 — 한 언어만 고치면
 * 외국인 이용자에게 거짓 안내가 된다.
 */
export interface PrivacyItem {
  title: string;
  body: string;
}

export interface PrivacyContent {
  title: string;
  items: PrivacyItem[];
}

export const PRIVACY: Record<Language, PrivacyContent> = {
  ko: {
    title: '개인정보 안내',
    items: [
      {
        title: '수집하는 항목',
        body: '회원 가입 시 이메일, 비밀번호(해시 형태), 이름 또는 닉네임을 처리합니다. SNS 로그인 시에는 제공업체가 전달하는 계정 식별 정보와 이메일·이름을 처리합니다. 순례 기록에는 성지·방문일·메모·선택한 사진이, 즐겨찾기와 마음 나침반을 이용하면 선택·응답 내용이 저장됩니다. 기기에만 남기는 방문 표시는 서버에 보내지 않습니다. 현재 위치는 「현재 위치 사용」 중 기기에서만 이용하며 서버에 저장하지 않습니다.',
      },
      {
        title: 'AI 가이드(미카엘) 대화',
        body: '로그인한 상태에서 미카엘에게 한 질문과 답은 계정에 저장되어 다음에 열어도 이어서 볼 수 있습니다. 본인만 볼 수 있고, 대화창의 「대화 지우기」로 언제든 전부 삭제됩니다. 로그인하지 않으면 저장하지 않습니다. 질문에 이름·연락처 같은 개인정보를 넣지 마세요. 답변 생성에는 Anthropic Claude 를 사용하며(장애 시 Google Gemini 로 대신 답합니다) 질문 내용이 그 서비스로 전송됩니다.',
      },
      {
        title: '이용 목적',
        body: '로그인과 본인 확인, 순례 기록·즐겨찾기·AI 대화·마음 나침반 결과의 저장과 표시에 사용합니다. 순례 후기와 첨부 사진은 다른 이용자에게도 공개됩니다.',
      },
      {
        title: '보유 기간',
        body: '계정 정보와 이에 연결된 순례 기록·사진·즐겨찾기·AI 대화·마음 나침반 응답은 회원이 서비스를 이용하는 동안 보유합니다. 개별 기록을 지우거나 탈퇴하면 해당 정보를 지체 없이 삭제합니다. 다른 법령에 따라 특정 정보를 보존해야 하는 경우에는 해당 항목만 그 법정 기간 동안 분리해 보관합니다. 기기에 저장된 방문 표시는 계정 탈퇴 시 그 기기에서 삭제되며, 브라우저 저장소를 지워도 삭제됩니다.',
      },
      {
        title: '삭제 방법',
        body: '순례 기록은 「내 기록」에서 직접 삭제할 수 있습니다. 탈퇴는 로그인 후 「더보기 → 계정 설정 → 계정 삭제」에서 진행합니다. 사진 원본과 공개 후기를 포함한 연결 정보를 삭제한 뒤 계정을 삭제합니다. 로그인이 어려우면 아래 이메일로 요청하세요. 담당자가 본인 여부를 확인한 뒤 지체 없이 처리하고, 요청 접수 후 10일 이내에 처리 결과를 이메일로 알립니다. 전자 파일은 복구되지 않도록 삭제합니다.',
      },
      {
        title: '개인정보 문의 및 고충처리',
        body: 'Visit Holy Korea 운영팀이 개인정보 문의와 고충을 처리합니다. 이메일: visitholykorea@gmail.com',
      },
      {
        title: '외부 서비스 이용',
        body: '인증·데이터 저장은 Supabase, 웹 호스팅은 Vercel 을 사용합니다. 주변 관광 정보와 예상 붐빔 정도는 한국관광공사 OpenAPI(TourAPI)를 실시간으로 호출하며 응답을 저장하지 않습니다. 외부 지도(Google·Apple·카카오·T맵·네이버)는 링크로만 열리며 각 서비스의 정책을 따릅니다.',
      },
    ],
  },
  en: {
    title: 'Privacy notice',
    items: [
      {
        title: 'What we collect',
        body: 'When you create an account, we process your email, password (stored as a hash), and name or nickname. Social sign-in provides an account identifier, email and name. Visit records contain the shrine, visit date, note and optional photos. Favorites and compass answers are saved when used. Device-only visit markers are not sent to our server. Your location is used on your device while location access is on and is not stored on our server.',
      },
      {
        title: 'AI guide (Michael) conversations',
        body: 'While signed in, your questions to Michael and its answers are saved to your account so the conversation continues next time. Only you can see them, and "Clear chat" in the chat window deletes them all at any time. Nothing is saved when you are not signed in. Please do not include personal details such as names or contact information in questions. Answers are generated with Anthropic Claude (Google Gemini as a backup when Claude is unavailable), so question text is sent to that service.',
      },
      {
        title: 'Why we use it',
        body: 'We use this information to sign you in, verify your identity, and save and show visit records, favorites, AI chats and compass results. Visit notes and attached photos are also visible to other users.',
      },
      {
        title: 'Retention period',
        body: 'Account data and linked visit records, photos, favorites, AI chats and compass answers are kept while you use the service. We delete a record when you delete it, and delete account-linked information without delay when you close your account. If another law requires retention of specific information, only that information is kept separately for the required period. Device visit markers are removed from that device when you delete your account or clear browser storage.',
      },
      {
        title: 'How to delete',
        body: 'Delete individual visit records in “My records”. To close your account, sign in and choose “More → Account settings → Delete account”. Linked information, including original photos and public notes, is removed before the account. If you cannot sign in, request deletion by email below. We verify your identity, act without delay, and email the result within 10 days of receiving the request. Electronic files are deleted so they cannot be restored.',
      },
      {
        title: 'Privacy inquiries and complaints',
        body: 'The Visit Holy Korea operations team handles privacy inquiries and complaints. Email: visitholykorea@gmail.com',
      },
      {
        title: 'Third-party services',
        body: 'Authentication and data storage use Supabase; web hosting uses Vercel. Nearby tourism information and expected crowding are fetched live from the Korea Tourism Organization OpenAPI (TourAPI) and responses are not stored. External maps (Google, Apple, Kakao, T map, Naver) open by link only and follow their own policies.',
      },
    ],
  },
  es: {
    title: 'Aviso de privacidad',
    items: [
      {
        title: 'Qué datos recogemos',
        body: 'Al crear una cuenta procesamos su correo electrónico, su contraseña (almacenada como hash) y su nombre o apodo. El inicio de sesión con redes sociales aporta un identificador de cuenta, el correo y el nombre. Los registros de visita contienen el santuario, la fecha, una nota y fotos opcionales. Los favoritos y las respuestas de la brújula se guardan cuando se usan. Las marcas de visita que solo se guardan en el dispositivo no se envían a nuestro servidor. Su ubicación se usa en su dispositivo mientras el acceso a la ubicación está activado y no se almacena en nuestro servidor.',
      },
      {
        title: 'Conversaciones con el guía de IA (Miguel)',
        body: 'Mientras tiene la sesión iniciada, sus preguntas a Miguel y las respuestas se guardan en su cuenta para que la conversación continúe la próxima vez. Solo usted puede verlas, y «Borrar conversación» en la ventana de chat las elimina todas en cualquier momento. No se guarda nada si no ha iniciado sesión. No incluya datos personales como nombres o información de contacto en las preguntas. Las respuestas se generan con Anthropic Claude (Google Gemini como respaldo cuando Claude no está disponible), por lo que el texto de la pregunta se envía a ese servicio.',
      },
      {
        title: 'Para qué los usamos',
        body: 'Usamos esta información para iniciar su sesión, verificar su identidad y guardar y mostrar registros de visita, favoritos, conversaciones de IA y resultados de la brújula. Las notas de visita y las fotos adjuntas también son visibles para otros usuarios.',
      },
      {
        title: 'Periodo de conservación',
        body: 'Los datos de la cuenta y los registros de visita, fotos, favoritos, conversaciones de IA y respuestas de la brújula vinculados se conservan mientras usa el servicio. Eliminamos un registro cuando usted lo borra y eliminamos sin demora la información vinculada a la cuenta cuando la cierra. Si otra ley exige conservar cierta información, solo esa información se guarda por separado durante el periodo exigido. Las marcas de visita del dispositivo se eliminan de ese dispositivo al borrar la cuenta o al limpiar el almacenamiento del navegador.',
      },
      {
        title: 'Cómo eliminar',
        body: 'Elimine registros de visita individuales en «Mis registros». Para cerrar su cuenta, inicie sesión y elija «Más → Ajustes de cuenta → Eliminar cuenta». La información vinculada, incluidas las fotos originales y las notas públicas, se elimina antes que la cuenta. Si no puede iniciar sesión, solicite la eliminación por el correo indicado abajo. Verificamos su identidad, actuamos sin demora y le comunicamos el resultado por correo en un plazo de 10 días desde la recepción de la solicitud. Los archivos electrónicos se eliminan de forma que no puedan restaurarse.',
      },
      {
        title: 'Consultas y reclamaciones sobre privacidad',
        body: 'El equipo operativo de Visit Holy Korea atiende las consultas y reclamaciones sobre privacidad. Correo: visitholykorea@gmail.com',
      },
      {
        title: 'Servicios de terceros',
        body: 'La autenticación y el almacenamiento de datos usan Supabase; el alojamiento web usa Vercel. La información turística cercana y la afluencia prevista se obtienen en tiempo real de la OpenAPI de la Organización de Turismo de Corea (TourAPI) y las respuestas no se almacenan. Los mapas externos (Google, Apple, Kakao, T map, Naver) se abren solo mediante enlace y siguen sus propias políticas.',
      },
    ],
  },
  fr: {
    title: 'Informations sur la confidentialité',
    items: [
      {
        title: 'Données collectées',
        body: 'Lors de la création d’un compte, nous traitons votre adresse e-mail, votre mot de passe (stocké sous forme de hachage) et votre nom ou pseudonyme. La connexion via un réseau social fournit un identifiant de compte, l’e-mail et le nom. Les carnets de visite contiennent le sanctuaire, la date de visite, une note et des photos facultatives. Les favoris et les réponses de la boussole sont enregistrés lorsque vous les utilisez. Les marques de visite conservées uniquement sur l’appareil ne sont pas envoyées à notre serveur. Votre position est utilisée sur votre appareil tant que l’accès à la position est activé et n’est pas stockée sur notre serveur.',
      },
      {
        title: 'Conversations avec le guide IA (Michel)',
        body: 'Lorsque vous êtes connecté, vos questions à Michel et ses réponses sont enregistrées dans votre compte afin que la conversation se poursuive la fois suivante. Vous seul pouvez les voir, et « Effacer la conversation » dans la fenêtre de discussion les supprime toutes à tout moment. Rien n’est enregistré si vous n’êtes pas connecté. N’indiquez pas de données personnelles telles que des noms ou des coordonnées dans vos questions. Les réponses sont générées avec Anthropic Claude (Google Gemini en secours lorsque Claude est indisponible) ; le texte de la question est donc transmis à ce service.',
      },
      {
        title: 'Finalités',
        body: 'Nous utilisons ces informations pour vous connecter, vérifier votre identité, et enregistrer et afficher les carnets de visite, les favoris, les conversations IA et les résultats de la boussole. Les notes de visite et les photos jointes sont également visibles par les autres utilisateurs.',
      },
      {
        title: 'Durée de conservation',
        body: 'Les données du compte et les carnets de visite, photos, favoris, conversations IA et réponses de la boussole qui y sont liés sont conservés tant que vous utilisez le service. Nous supprimons un enregistrement lorsque vous l’effacez, et supprimons sans délai les informations liées au compte lorsque vous le fermez. Si une autre loi impose de conserver certaines informations, seules celles-ci sont conservées séparément pendant la durée requise. Les marques de visite de l’appareil sont retirées de cet appareil lorsque vous supprimez votre compte ou videz le stockage du navigateur.',
      },
      {
        title: 'Comment supprimer',
        body: 'Supprimez chaque carnet de visite dans « Mes carnets ». Pour fermer votre compte, connectez-vous et choisissez « Plus → Paramètres du compte → Supprimer le compte ». Les informations liées, y compris les photos originales et les notes publiques, sont supprimées avant le compte. Si vous ne pouvez pas vous connecter, demandez la suppression par e-mail à l’adresse ci-dessous. Nous vérifions votre identité, agissons sans délai et vous communiquons le résultat par e-mail dans les 10 jours suivant la réception de la demande. Les fichiers électroniques sont supprimés de manière irréversible.',
      },
      {
        title: 'Demandes et réclamations relatives à la confidentialité',
        body: 'L’équipe d’exploitation de Visit Holy Korea traite les demandes et réclamations relatives à la confidentialité. E-mail : visitholykorea@gmail.com',
      },
      {
        title: 'Services tiers',
        body: 'L’authentification et le stockage des données utilisent Supabase ; l’hébergement web utilise Vercel. Les informations touristiques à proximité et l’affluence prévue sont récupérées en direct depuis l’OpenAPI de l’Office du tourisme de Corée (TourAPI) et les réponses ne sont pas stockées. Les cartes externes (Google, Apple, Kakao, T map, Naver) s’ouvrent uniquement par lien et suivent leurs propres politiques.',
      },
    ],
  },
  pt: {
    title: 'Aviso de privacidade',
    items: [
      {
        title: 'O que coletamos',
        body: 'Ao criar uma conta, processamos seu e-mail, sua senha (armazenada como hash) e seu nome ou apelido. O login com redes sociais fornece um identificador de conta, e-mail e nome. Os registros de visita contêm o santuário, a data da visita, uma nota e fotos opcionais. Favoritos e respostas da bússola são salvos quando usados. As marcas de visita guardadas apenas no dispositivo não são enviadas ao nosso servidor. Sua localização é usada no seu dispositivo enquanto o acesso à localização estiver ativado e não é armazenada em nosso servidor.',
      },
      {
        title: 'Conversas com o guia de IA (Miguel)',
        body: 'Enquanto estiver conectado, suas perguntas ao Miguel e as respostas são salvas na sua conta para que a conversa continue na próxima vez. Só você pode vê-las, e «Apagar conversa» na janela de chat as exclui todas a qualquer momento. Nada é salvo quando você não está conectado. Não inclua dados pessoais, como nomes ou informações de contato, nas perguntas. As respostas são geradas com Anthropic Claude (Google Gemini como reserva quando o Claude está indisponível), portanto o texto da pergunta é enviado a esse serviço.',
      },
      {
        title: 'Por que usamos',
        body: 'Usamos essas informações para fazer seu login, verificar sua identidade e salvar e exibir registros de visita, favoritos, conversas de IA e resultados da bússola. As notas de visita e as fotos anexadas também ficam visíveis para outros usuários.',
      },
      {
        title: 'Período de retenção',
        body: 'Os dados da conta e os registros de visita, fotos, favoritos, conversas de IA e respostas da bússola vinculados são mantidos enquanto você usa o serviço. Excluímos um registro quando você o apaga e excluímos sem demora as informações vinculadas à conta quando você a encerra. Se outra lei exigir a retenção de informações específicas, apenas essas informações são mantidas separadamente pelo período exigido. As marcas de visita do dispositivo são removidas desse dispositivo quando você exclui a conta ou limpa o armazenamento do navegador.',
      },
      {
        title: 'Como excluir',
        body: 'Exclua registros de visita individuais em «Meus registros». Para encerrar a conta, faça login e escolha «Mais → Configurações da conta → Excluir conta». As informações vinculadas, incluindo fotos originais e notas públicas, são removidas antes da conta. Se não conseguir fazer login, solicite a exclusão pelo e-mail abaixo. Verificamos sua identidade, agimos sem demora e enviamos o resultado por e-mail em até 10 dias após o recebimento do pedido. Os arquivos eletrônicos são excluídos de forma irrecuperável.',
      },
      {
        title: 'Dúvidas e reclamações sobre privacidade',
        body: 'A equipe de operações do Visit Holy Korea trata dúvidas e reclamações sobre privacidade. E-mail: visitholykorea@gmail.com',
      },
      {
        title: 'Serviços de terceiros',
        body: 'Autenticação e armazenamento de dados usam Supabase; a hospedagem web usa Vercel. Informações turísticas próximas e o movimento previsto são obtidos em tempo real da OpenAPI da Organização de Turismo da Coreia (TourAPI), e as respostas não são armazenadas. Mapas externos (Google, Apple, Kakao, T map, Naver) abrem apenas por link e seguem suas próprias políticas.',
      },
    ],
  },
  it: {
    title: 'Informativa sulla privacy',
    items: [
      {
        title: 'Dati raccolti',
        body: 'Quando crei un account trattiamo la tua e-mail, la password (memorizzata come hash) e il nome o soprannome. L’accesso tramite social fornisce un identificativo dell’account, l’e-mail e il nome. I diari di visita contengono il santuario, la data della visita, una nota e foto facoltative. Preferiti e risposte della bussola vengono salvati quando li usi. I segni di visita conservati solo sul dispositivo non vengono inviati al nostro server. La tua posizione viene usata sul dispositivo finché l’accesso alla posizione è attivo e non viene memorizzata sul nostro server.',
      },
      {
        title: 'Conversazioni con la guida IA (Michele)',
        body: 'Quando hai effettuato l’accesso, le tue domande a Michele e le sue risposte vengono salvate nel tuo account, così la conversazione continua la volta successiva. Solo tu puoi vederle, e «Cancella conversazione» nella finestra di chat le elimina tutte in qualsiasi momento. Se non hai effettuato l’accesso non viene salvato nulla. Non inserire nelle domande dati personali come nomi o recapiti. Le risposte sono generate con Anthropic Claude (Google Gemini come riserva quando Claude non è disponibile), quindi il testo della domanda viene inviato a quel servizio.',
      },
      {
        title: 'Finalità',
        body: 'Usiamo queste informazioni per farti accedere, verificare la tua identità e salvare e mostrare diari di visita, preferiti, conversazioni IA e risultati della bussola. Le note di visita e le foto allegate sono visibili anche agli altri utenti.',
      },
      {
        title: 'Periodo di conservazione',
        body: 'I dati dell’account e i diari di visita, le foto, i preferiti, le conversazioni IA e le risposte della bussola collegati vengono conservati finché usi il servizio. Eliminiamo un diario quando lo cancelli ed eliminiamo senza ritardo le informazioni collegate all’account quando lo chiudi. Se un’altra legge richiede la conservazione di informazioni specifiche, solo quelle vengono conservate separatamente per il periodo previsto. I segni di visita del dispositivo vengono rimossi da quel dispositivo quando elimini l’account o svuoti la memoria del browser.',
      },
      {
        title: 'Come eliminare',
        body: 'Elimina i singoli diari di visita in «I miei diari». Per chiudere l’account, accedi e scegli «Altro → Impostazioni account → Elimina account». Le informazioni collegate, comprese le foto originali e le note pubbliche, vengono rimosse prima dell’account. Se non riesci ad accedere, richiedi l’eliminazione all’e-mail qui sotto. Verifichiamo la tua identità, procediamo senza ritardo e ti comunichiamo l’esito via e-mail entro 10 giorni dal ricevimento della richiesta. I file elettronici vengono eliminati in modo irreversibile.',
      },
      {
        title: 'Richieste e reclami sulla privacy',
        body: 'Il team operativo di Visit Holy Korea gestisce richieste e reclami sulla privacy. E-mail: visitholykorea@gmail.com',
      },
      {
        title: 'Servizi di terze parti',
        body: 'Autenticazione e archiviazione dei dati usano Supabase; l’hosting web usa Vercel. Le informazioni turistiche nelle vicinanze e l’affluenza prevista vengono recuperate in tempo reale dall’OpenAPI dell’Organizzazione del Turismo Coreana (TourAPI) e le risposte non vengono memorizzate. Le mappe esterne (Google, Apple, Kakao, T map, Naver) si aprono solo tramite link e seguono le rispettive politiche.',
      },
    ],
  },
};

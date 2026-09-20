import type { Language } from '@/shared/i18n/dictionary';

/**
 * 이용약관 본문 — 6개 국어.
 *
 * 투어원패스(pass.knto.or.kr/terms)의 장·조 구성을 참고해 우리 서비스에 맞게 새로 썼다.
 * 한국어가 원문이고 나머지는 번역이다(2026-09-21, T-031) — 화면은 번역본 위에
 * "한국어본이 우선" 을 밝힌다. 조항을 고치면 **여섯 언어를 같이** 고친다.
 * 개인정보 처리의 구체적인 항목·기간·삭제 방법은 별도 개인정보 안내에 둔다.
 */
export interface TermsArticle {
  title: string;
  body: string;
}

export interface TermsChapter {
  title: string;
  articles: TermsArticle[];
}

export interface TermsContent {
  /** 시행일 — 언어별 날짜 표기. 시행일이 바뀌면 여섯 줄 다 고친다. */
  effectiveDate: string;
  chapters: TermsChapter[];
}

export const TERMS: Record<Language, TermsContent> = {
  ko: {
    effectiveDate: '2026년 8월 18일',
    chapters: [
      {
        title: '제1장 총칙',
        articles: [
          {
            title: '제1조 (목적)',
            body: `이 약관은 Visit Holy Korea(이하 "서비스")의 이용 조건과 절차, 이용자와 서비스 제공자의 권리·의무 및 책임에 관한 사항을 정하는 것을 목적으로 합니다.`,
          },
          {
            title: '제2조 (용어의 정의)',
            body: `1. "이용자"란 이 약관에 따라 서비스를 이용하는 모든 사람을 말합니다.
2. "회원"이란 이메일 또는 SNS 계정으로 가입해 계정을 보유한 이용자를 말합니다.
3. "간편 로그인"이란 카카오·구글 등 외부 제공자의 계정으로 본인을 인증하는 방식을 말합니다.
4. "순례 기록"이란 회원이 서비스 안에서 작성한 방문 스탬프·한 줄 메모 등 게시물을 말합니다.`,
          },
          {
            title: '제3조 (약관의 효력과 변경)',
            body: `1. 이 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.
2. 서비스 제공자는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 시행일 7일 전부터 공지합니다.
3. 변경된 약관에 동의하지 않는 회원은 탈퇴할 수 있으며, 시행일 이후 서비스를 계속 이용하면 변경에 동의한 것으로 봅니다.`,
          },
          {
            title: '제4조 (개인정보의 보호)',
            body: `1. 서비스는 회원 가입에 필요한 이메일과 이름 또는 닉네임을 처리합니다. 순례 기록·사진 등은 해당 기능을 사용할 때 처리합니다.
2. 간편 로그인 시 제공자로부터 받는 정보는 계정 식별에 필요한 범위로 한정하며, 해당 제공자의 비밀번호는 전달받지 않습니다.
3. 처리 항목·목적·기간·삭제 방법과 외부 서비스 이용은 별도 개인정보 처리방침에 따릅니다.`,
          },
        ],
      },
      {
        title: '제2장 서비스 이용',
        articles: [
          {
            title: '제5조 (이용계약의 성립)',
            body: `이용계약은 이용자가 약관에 동의하고 가입을 신청한 뒤, 서비스가 이를 승낙함으로써 성립합니다. 만 14세 미만은 가입할 수 없습니다.`,
          },
          {
            title: '제6조 (서비스의 내용)',
            body: `1. 서비스는 한국 가톨릭 성지 정보 열람, 순례 코스 안내, 순례 기록(방문 스탬프·한 줄 메모) 기능을 제공합니다.
2. 성지 소개는 각 교구 공식 자료 등 확인된 출처를 기반으로 작성하며, 주변 관광 정보는 한국관광공사 TourAPI를 실시간으로 호출해 표시합니다.
3. 미카엘 순례 가이드의 답변은 참고용이며, 미사 시간·개방 여부 등 중요한 정보는 반드시 해당 성지 사무실에 확인해야 합니다.`,
          },
          {
            title: '제7조 (서비스의 중지)',
            body: `시스템 점검, 외부 API 장애, 천재지변 등 부득이한 사유가 있는 경우 서비스의 전부 또는 일부를 일시 중지할 수 있습니다. 이 경우 사전 또는 사후에 공지합니다.`,
          },
          {
            title: '제8조 (외부 서비스 연동)',
            body: `간편 로그인, 지도, 길찾기 등 외부 서비스는 해당 제공자의 약관과 정책을 따릅니다. 외부 서비스의 장애나 정책 변경으로 발생한 문제에 대해서는 해당 제공자에게 문의해야 할 수 있습니다.`,
          },
        ],
      },
      {
        title: '제3장 의무 및 책임',
        articles: [
          {
            title: '제9조 (서비스 제공자의 의무)',
            body: `1. 관련 법령과 이 약관을 지키며, 안정적으로 서비스를 제공하기 위해 노력합니다.
2. 성지 정보의 오류를 발견하면 확인된 1차 자료를 근거로 신속히 바로잡습니다.
3. 이용자의 개인정보를 보호하기 위해 보안 조치를 유지합니다.`,
          },
          {
            title: '제10조 (이용자의 의무)',
            body: `1. 타인의 계정을 도용하거나 허위 정보를 등록해서는 안 됩니다.
2. 순례 기록에 타인의 권리를 침해하는 내용, 종교 시설과 신자에 대한 모욕·혐오 표현을 게시해서는 안 됩니다.
3. 서비스의 데이터를 무단으로 수집(크롤링)하거나 상업적으로 재배포해서는 안 됩니다.
4. 위 의무를 위반하면 게시물 삭제, 이용 제한 등의 조치를 받을 수 있습니다.`,
          },
          {
            title: '제11조 (저작권)',
            body: `1. 서비스가 작성한 성지 소개 글의 저작권은 서비스에 있습니다. 각 교구 공식 자료를 참고한 경우 해당 출처를 함께 표시합니다.
2. 서비스에 쓰인 일부 사진은 Wikimedia Commons 등 자유 라이선스 저작물이며, 화면에 출처와 라이선스를 표시합니다.
3. 회원이 작성한 순례 기록의 저작권은 회원에게 있으며, 서비스는 서비스 운영·홍보 목적의 범위에서 이를 사용할 수 있습니다.`,
          },
          {
            title: '제12조 (책임의 한계)',
            body: `1. 성지의 미사 시간·개방 여부 등은 현지 사정에 따라 달라질 수 있으며, 서비스는 방문 전 확인 없이 발생한 불편에 대해 책임지지 않습니다.
2. 무료로 제공되는 서비스의 이용과 관련하여, 서비스의 고의 또는 중대한 과실이 없는 한 책임이 제한됩니다.`,
          },
        ],
      },
    ],
  },
  en: {
    effectiveDate: 'August 18, 2026',
    chapters: [
      {
        title: 'Chapter 1. General provisions',
        articles: [
          {
            title: 'Article 1 (Purpose)',
            body: `These Terms set out the conditions and procedures for using Visit Holy Korea (the "Service") and the rights, obligations and responsibilities of users and the Service provider.`,
          },
          {
            title: 'Article 2 (Definitions)',
            body: `1. "User" means anyone who uses the Service under these Terms.
2. "Member" means a User who has created an account with an email address or a social account.
3. "Social sign-in" means authenticating with an account from an external provider such as Kakao or Google.
4. "Visit records" means content a Member creates in the Service, such as visit stamps and one-line notes.`,
          },
          {
            title: 'Article 3 (Effect and amendment of the Terms)',
            body: `1. These Terms take effect when posted in the Service.
2. The Service provider may amend the Terms within the limits of applicable law and will announce changes at least 7 days before they take effect.
3. A Member who does not agree to the amended Terms may close their account; continued use after the effective date is deemed acceptance.`,
          },
          {
            title: 'Article 4 (Protection of personal data)',
            body: `1. The Service processes the email address and name or nickname needed to create an account. Visit records, photos and similar data are processed when you use those features.
2. Information received from a social sign-in provider is limited to what is needed to identify the account; the provider's password is never received.
3. The items processed, purposes, retention periods, deletion methods and use of third-party services follow the separate privacy notice.`,
          },
        ],
      },
      {
        title: 'Chapter 2. Use of the Service',
        articles: [
          {
            title: 'Article 5 (Formation of the agreement)',
            body: `The agreement is formed when a User agrees to the Terms, applies to register, and the Service accepts. Persons under 14 may not register.`,
          },
          {
            title: 'Article 6 (Content of the Service)',
            body: `1. The Service provides information on Catholic holy sites in Korea, pilgrimage route guidance, and visit records (visit stamps and one-line notes).
2. Site descriptions are written from verified sources such as official diocesan materials; nearby tourism information is fetched live from the Korea Tourism Organization TourAPI.
3. Answers from the Michael pilgrimage guide are for reference only; important details such as Mass times and opening hours must be confirmed with the site office.`,
          },
          {
            title: 'Article 7 (Suspension of the Service)',
            body: `All or part of the Service may be suspended temporarily for unavoidable reasons such as system maintenance, external API failures or natural disasters. Notice will be given before or after the suspension.`,
          },
          {
            title: 'Article 8 (Third-party services)',
            body: `External services such as social sign-in, maps and directions follow the terms and policies of their providers. Problems caused by an external service's failure or policy change may need to be raised with that provider.`,
          },
        ],
      },
      {
        title: 'Chapter 3. Obligations and liability',
        articles: [
          {
            title: 'Article 9 (Obligations of the Service provider)',
            body: `1. We comply with applicable law and these Terms and strive to provide the Service reliably.
2. When an error in site information is found, we correct it promptly based on verified primary sources.
3. We maintain security measures to protect users' personal data.`,
          },
          {
            title: 'Article 10 (Obligations of Users)',
            body: `1. Users must not use another person's account or register false information.
2. Users must not post content in visit records that infringes others' rights or insults or expresses hatred toward religious institutions or believers.
3. Users must not collect (crawl) the Service's data without permission or redistribute it commercially.
4. Violations may result in removal of content, restriction of use or other measures.`,
          },
          {
            title: 'Article 11 (Copyright)',
            body: `1. Copyright in site descriptions written by the Service belongs to the Service. Where official diocesan materials were consulted, the source is credited.
2. Some photos used in the Service are freely licensed works such as those from Wikimedia Commons; the source and license are shown on screen.
3. Copyright in visit records created by a Member belongs to the Member; the Service may use them to the extent needed to operate and promote the Service.`,
          },
          {
            title: 'Article 12 (Limitation of liability)',
            body: `1. Mass times, opening hours and similar details may change with local circumstances; the Service is not liable for inconvenience arising from a visit made without confirming them in advance.
2. For this free Service, liability is limited unless caused by the Service's willful misconduct or gross negligence.`,
          },
        ],
      },
    ],
  },
  es: {
    effectiveDate: '18 de agosto de 2026',
    chapters: [
      {
        title: 'Capítulo 1. Disposiciones generales',
        articles: [
          {
            title: 'Artículo 1 (Objeto)',
            body: `Estos términos establecen las condiciones y los procedimientos de uso de Visit Holy Korea (el «Servicio») y los derechos, obligaciones y responsabilidades de los usuarios y del proveedor del Servicio.`,
          },
          {
            title: 'Artículo 2 (Definiciones)',
            body: `1. «Usuario» es toda persona que utiliza el Servicio conforme a estos términos.
2. «Miembro» es el usuario que ha creado una cuenta con un correo electrónico o una cuenta de red social.
3. «Inicio de sesión social» es la autenticación mediante la cuenta de un proveedor externo como Kakao o Google.
4. «Registros de visita» son los contenidos que un miembro crea en el Servicio, como sellos de visita y notas de una línea.`,
          },
          {
            title: 'Artículo 3 (Vigencia y modificación de los términos)',
            body: `1. Estos términos entran en vigor al publicarse en el Servicio.
2. El proveedor del Servicio puede modificar los términos dentro de los límites de la ley aplicable y anunciará los cambios al menos 7 días antes de su entrada en vigor.
3. El miembro que no acepte los términos modificados puede cerrar su cuenta; el uso continuado tras la fecha de entrada en vigor se considera aceptación.`,
          },
          {
            title: 'Artículo 4 (Protección de los datos personales)',
            body: `1. El Servicio procesa el correo electrónico y el nombre o apodo necesarios para crear una cuenta. Los registros de visita, las fotos y datos similares se procesan cuando se usan esas funciones.
2. La información recibida de un proveedor de inicio de sesión social se limita a lo necesario para identificar la cuenta; nunca se recibe la contraseña del proveedor.
3. Los datos procesados, las finalidades, los plazos de conservación, los métodos de eliminación y el uso de servicios de terceros se rigen por el aviso de privacidad independiente.`,
          },
        ],
      },
      {
        title: 'Capítulo 2. Uso del Servicio',
        articles: [
          {
            title: 'Artículo 5 (Formación del contrato)',
            body: `El contrato se forma cuando el usuario acepta los términos, solicita el registro y el Servicio lo acepta. Los menores de 14 años no pueden registrarse.`,
          },
          {
            title: 'Artículo 6 (Contenido del Servicio)',
            body: `1. El Servicio ofrece información sobre los santuarios católicos de Corea, orientación sobre rutas de peregrinación y registros de visita (sellos de visita y notas de una línea).
2. Las descripciones de los santuarios se redactan a partir de fuentes verificadas, como materiales oficiales de las diócesis; la información turística cercana se obtiene en tiempo real de la TourAPI de la Organización de Turismo de Corea.
3. Las respuestas del guía de peregrinación Miguel son solo orientativas; los datos importantes, como los horarios de misa y de apertura, deben confirmarse con la oficina del santuario.`,
          },
          {
            title: 'Artículo 7 (Suspensión del Servicio)',
            body: `El Servicio, total o parcialmente, puede suspenderse temporalmente por causas inevitables como mantenimiento del sistema, fallos de API externas o catástrofes naturales. Se avisará antes o después de la suspensión.`,
          },
          {
            title: 'Artículo 8 (Servicios de terceros)',
            body: `Los servicios externos, como el inicio de sesión social, los mapas y las indicaciones, se rigen por los términos y políticas de sus proveedores. Los problemas causados por un fallo o un cambio de política de un servicio externo pueden tener que plantearse a ese proveedor.`,
          },
        ],
      },
      {
        title: 'Capítulo 3. Obligaciones y responsabilidad',
        articles: [
          {
            title: 'Artículo 9 (Obligaciones del proveedor del Servicio)',
            body: `1. Cumplimos la ley aplicable y estos términos y procuramos prestar el Servicio de forma estable.
2. Cuando se detecta un error en la información de un santuario, lo corregimos con prontitud basándonos en fuentes primarias verificadas.
3. Mantenemos medidas de seguridad para proteger los datos personales de los usuarios.`,
          },
          {
            title: 'Artículo 10 (Obligaciones de los usuarios)',
            body: `1. No se debe usar la cuenta de otra persona ni registrar información falsa.
2. No se debe publicar en los registros de visita contenido que vulnere derechos de terceros ni expresiones insultantes o de odio hacia instituciones religiosas o fieles.
3. No se deben recopilar (rastrear) los datos del Servicio sin permiso ni redistribuirlos con fines comerciales.
4. El incumplimiento puede dar lugar a la eliminación de contenidos, la restricción del uso u otras medidas.`,
          },
          {
            title: 'Artículo 11 (Derechos de autor)',
            body: `1. Los derechos de autor de las descripciones de santuarios redactadas por el Servicio pertenecen al Servicio. Cuando se consultaron materiales oficiales de una diócesis, se indica la fuente.
2. Algunas fotos usadas en el Servicio son obras con licencia libre, como las de Wikimedia Commons; la fuente y la licencia se muestran en pantalla.
3. Los derechos de autor de los registros de visita creados por un miembro pertenecen al miembro; el Servicio puede usarlos en la medida necesaria para operar y promocionar el Servicio.`,
          },
          {
            title: 'Artículo 12 (Limitación de responsabilidad)',
            body: `1. Los horarios de misa, de apertura y datos similares pueden cambiar según las circunstancias locales; el Servicio no responde de los inconvenientes derivados de una visita realizada sin confirmarlos previamente.
2. En este Servicio gratuito, la responsabilidad queda limitada salvo dolo o negligencia grave del Servicio.`,
          },
        ],
      },
    ],
  },
  fr: {
    effectiveDate: '18 août 2026',
    chapters: [
      {
        title: 'Chapitre 1. Dispositions générales',
        articles: [
          {
            title: 'Article 1 (Objet)',
            body: `Les présentes conditions définissent les modalités et procédures d’utilisation de Visit Holy Korea (le « Service ») ainsi que les droits, obligations et responsabilités des utilisateurs et du fournisseur du Service.`,
          },
          {
            title: 'Article 2 (Définitions)',
            body: `1. « Utilisateur » désigne toute personne qui utilise le Service conformément aux présentes conditions.
2. « Membre » désigne un utilisateur ayant créé un compte avec une adresse e-mail ou un compte de réseau social.
3. « Connexion sociale » désigne l’authentification via le compte d’un fournisseur externe tel que Kakao ou Google.
4. « Carnets de visite » désigne les contenus créés par un membre dans le Service, tels que les tampons de visite et les notes d’une ligne.`,
          },
          {
            title: 'Article 3 (Effet et modification des conditions)',
            body: `1. Les présentes conditions prennent effet dès leur publication dans le Service.
2. Le fournisseur du Service peut modifier les conditions dans les limites de la loi applicable et annonce les modifications au moins 7 jours avant leur entrée en vigueur.
3. Le membre qui n’accepte pas les conditions modifiées peut fermer son compte ; la poursuite de l’utilisation après la date d’entrée en vigueur vaut acceptation.`,
          },
          {
            title: 'Article 4 (Protection des données personnelles)',
            body: `1. Le Service traite l’adresse e-mail et le nom ou pseudonyme nécessaires à la création d’un compte. Les carnets de visite, photos et données similaires sont traités lorsque vous utilisez ces fonctions.
2. Les informations reçues d’un fournisseur de connexion sociale se limitent à ce qui est nécessaire pour identifier le compte ; le mot de passe du fournisseur n’est jamais transmis.
3. Les données traitées, les finalités, les durées de conservation, les modalités de suppression et l’utilisation de services tiers sont régies par la notice de confidentialité distincte.`,
          },
        ],
      },
      {
        title: 'Chapitre 2. Utilisation du Service',
        articles: [
          {
            title: 'Article 5 (Formation du contrat)',
            body: `Le contrat est formé lorsque l’utilisateur accepte les conditions, demande son inscription et que le Service l’accepte. Les personnes de moins de 14 ans ne peuvent pas s’inscrire.`,
          },
          {
            title: 'Article 6 (Contenu du Service)',
            body: `1. Le Service propose des informations sur les sanctuaires catholiques de Corée, des itinéraires de pèlerinage et des carnets de visite (tampons de visite et notes d’une ligne).
2. Les présentations des sanctuaires sont rédigées à partir de sources vérifiées, telles que les documents officiels des diocèses ; les informations touristiques à proximité sont récupérées en direct depuis la TourAPI de l’Office du tourisme de Corée.
3. Les réponses du guide de pèlerinage Michel sont fournies à titre indicatif ; les informations importantes, comme les horaires des messes et d’ouverture, doivent être confirmées auprès du bureau du sanctuaire.`,
          },
          {
            title: 'Article 7 (Suspension du Service)',
            body: `Tout ou partie du Service peut être suspendu temporairement pour des raisons inévitables telles que la maintenance du système, une panne d’API externe ou une catastrophe naturelle. Un avis est donné avant ou après la suspension.`,
          },
          {
            title: 'Article 8 (Services tiers)',
            body: `Les services externes tels que la connexion sociale, les cartes et les itinéraires sont soumis aux conditions et politiques de leurs fournisseurs. Les problèmes causés par une panne ou un changement de politique d’un service externe peuvent devoir être signalés à ce fournisseur.`,
          },
        ],
      },
      {
        title: 'Chapitre 3. Obligations et responsabilité',
        articles: [
          {
            title: 'Article 9 (Obligations du fournisseur du Service)',
            body: `1. Nous respectons la loi applicable et les présentes conditions et nous efforçons de fournir le Service de manière fiable.
2. Lorsqu’une erreur est constatée dans les informations d’un sanctuaire, nous la corrigeons rapidement sur la base de sources primaires vérifiées.
3. Nous maintenons des mesures de sécurité pour protéger les données personnelles des utilisateurs.`,
          },
          {
            title: 'Article 10 (Obligations des utilisateurs)',
            body: `1. Il est interdit d’utiliser le compte d’autrui ou d’enregistrer de fausses informations.
2. Il est interdit de publier dans les carnets de visite des contenus portant atteinte aux droits d’autrui ou des propos insultants ou haineux envers des institutions religieuses ou des fidèles.
3. Il est interdit de collecter (crawler) les données du Service sans autorisation ou de les redistribuer à des fins commerciales.
4. Tout manquement peut entraîner la suppression de contenus, une restriction d’utilisation ou d’autres mesures.`,
          },
          {
            title: 'Article 11 (Droits d’auteur)',
            body: `1. Les droits d’auteur des présentations de sanctuaires rédigées par le Service appartiennent au Service. Lorsque des documents officiels d’un diocèse ont été consultés, la source est indiquée.
2. Certaines photos utilisées dans le Service sont des œuvres sous licence libre, notamment issues de Wikimedia Commons ; la source et la licence sont affichées à l’écran.
3. Les droits d’auteur des carnets de visite créés par un membre appartiennent au membre ; le Service peut les utiliser dans la mesure nécessaire à l’exploitation et à la promotion du Service.`,
          },
          {
            title: 'Article 12 (Limitation de responsabilité)',
            body: `1. Les horaires des messes, d’ouverture et autres informations similaires peuvent varier selon les circonstances locales ; le Service n’est pas responsable des désagréments résultant d’une visite effectuée sans vérification préalable.
2. Pour ce Service gratuit, la responsabilité est limitée sauf faute intentionnelle ou négligence grave du Service.`,
          },
        ],
      },
    ],
  },
  pt: {
    effectiveDate: '18 de agosto de 2026',
    chapters: [
      {
        title: 'Capítulo 1. Disposições gerais',
        articles: [
          {
            title: 'Artigo 1 (Finalidade)',
            body: `Estes termos estabelecem as condições e os procedimentos de uso do Visit Holy Korea (o «Serviço») e os direitos, obrigações e responsabilidades dos usuários e do provedor do Serviço.`,
          },
          {
            title: 'Artigo 2 (Definições)',
            body: `1. «Usuário» é qualquer pessoa que utiliza o Serviço conforme estes termos.
2. «Membro» é o usuário que criou uma conta com um e-mail ou uma conta de rede social.
3. «Login social» é a autenticação por meio da conta de um provedor externo, como Kakao ou Google.
4. «Registros de visita» são os conteúdos que um membro cria no Serviço, como carimbos de visita e notas de uma linha.`,
          },
          {
            title: 'Artigo 3 (Vigência e alteração dos termos)',
            body: `1. Estes termos entram em vigor ao serem publicados no Serviço.
2. O provedor do Serviço pode alterar os termos dentro dos limites da lei aplicável e anunciará as alterações com pelo menos 7 dias de antecedência.
3. O membro que não concordar com os termos alterados pode encerrar a conta; o uso continuado após a data de vigência é considerado aceitação.`,
          },
          {
            title: 'Artigo 4 (Proteção de dados pessoais)',
            body: `1. O Serviço processa o e-mail e o nome ou apelido necessários para criar uma conta. Registros de visita, fotos e dados semelhantes são processados quando essas funções são usadas.
2. As informações recebidas de um provedor de login social limitam-se ao necessário para identificar a conta; a senha do provedor nunca é recebida.
3. Os dados processados, as finalidades, os prazos de retenção, os métodos de exclusão e o uso de serviços de terceiros seguem o aviso de privacidade separado.`,
          },
        ],
      },
      {
        title: 'Capítulo 2. Uso do Serviço',
        articles: [
          {
            title: 'Artigo 5 (Formação do contrato)',
            body: `O contrato é formado quando o usuário aceita os termos, solicita o cadastro e o Serviço o aceita. Menores de 14 anos não podem se cadastrar.`,
          },
          {
            title: 'Artigo 6 (Conteúdo do Serviço)',
            body: `1. O Serviço oferece informações sobre os santuários católicos da Coreia, orientação sobre rotas de peregrinação e registros de visita (carimbos de visita e notas de uma linha).
2. As descrições dos santuários são escritas a partir de fontes verificadas, como materiais oficiais das dioceses; as informações turísticas próximas são obtidas em tempo real da TourAPI da Organização de Turismo da Coreia.
3. As respostas do guia de peregrinação Miguel são apenas referenciais; dados importantes, como horários de missa e de abertura, devem ser confirmados com o escritório do santuário.`,
          },
          {
            title: 'Artigo 7 (Suspensão do Serviço)',
            body: `O Serviço, total ou parcialmente, pode ser suspenso temporariamente por motivos inevitáveis, como manutenção do sistema, falhas de APIs externas ou desastres naturais. Haverá aviso antes ou depois da suspensão.`,
          },
          {
            title: 'Artigo 8 (Serviços de terceiros)',
            body: `Serviços externos, como login social, mapas e rotas, seguem os termos e políticas de seus provedores. Problemas causados por falha ou mudança de política de um serviço externo podem precisar ser tratados com esse provedor.`,
          },
        ],
      },
      {
        title: 'Capítulo 3. Obrigações e responsabilidade',
        articles: [
          {
            title: 'Artigo 9 (Obrigações do provedor do Serviço)',
            body: `1. Cumprimos a lei aplicável e estes termos e nos esforçamos para prestar o Serviço de forma estável.
2. Ao encontrar um erro nas informações de um santuário, corrigimos prontamente com base em fontes primárias verificadas.
3. Mantemos medidas de segurança para proteger os dados pessoais dos usuários.`,
          },
          {
            title: 'Artigo 10 (Obrigações dos usuários)',
            body: `1. Não é permitido usar a conta de outra pessoa nem cadastrar informações falsas.
2. Não é permitido publicar nos registros de visita conteúdo que viole direitos de terceiros ou expressões ofensivas ou de ódio contra instituições religiosas ou fiéis.
3. Não é permitido coletar (rastrear) os dados do Serviço sem permissão nem redistribuí-los comercialmente.
4. Violações podem resultar em remoção de conteúdo, restrição de uso ou outras medidas.`,
          },
          {
            title: 'Artigo 11 (Direitos autorais)',
            body: `1. Os direitos autorais das descrições de santuários escritas pelo Serviço pertencem ao Serviço. Quando materiais oficiais de uma diocese foram consultados, a fonte é indicada.
2. Algumas fotos usadas no Serviço são obras com licença livre, como as do Wikimedia Commons; a fonte e a licença são exibidas na tela.
3. Os direitos autorais dos registros de visita criados por um membro pertencem ao membro; o Serviço pode usá-los na medida necessária para operar e divulgar o Serviço.`,
          },
          {
            title: 'Artigo 12 (Limitação de responsabilidade)',
            body: `1. Horários de missa, de abertura e dados semelhantes podem mudar conforme as circunstâncias locais; o Serviço não se responsabiliza por transtornos decorrentes de uma visita feita sem confirmação prévia.
2. Neste Serviço gratuito, a responsabilidade é limitada, salvo dolo ou negligência grave do Serviço.`,
          },
        ],
      },
    ],
  },
  it: {
    effectiveDate: '18 agosto 2026',
    chapters: [
      {
        title: 'Capitolo 1. Disposizioni generali',
        articles: [
          {
            title: 'Articolo 1 (Scopo)',
            body: `Le presenti condizioni stabiliscono le modalità e le procedure di utilizzo di Visit Holy Korea (il «Servizio») e i diritti, gli obblighi e le responsabilità degli utenti e del fornitore del Servizio.`,
          },
          {
            title: 'Articolo 2 (Definizioni)',
            body: `1. «Utente» è chiunque utilizzi il Servizio secondo le presenti condizioni.
2. «Membro» è l’utente che ha creato un account con un’e-mail o un account social.
3. «Accesso social» è l’autenticazione tramite l’account di un fornitore esterno come Kakao o Google.
4. «Diari di visita» sono i contenuti che un membro crea nel Servizio, come timbri di visita e note di una riga.`,
          },
          {
            title: 'Articolo 3 (Efficacia e modifica delle condizioni)',
            body: `1. Le presenti condizioni hanno effetto dalla pubblicazione nel Servizio.
2. Il fornitore del Servizio può modificare le condizioni nei limiti della legge applicabile e annuncia le modifiche almeno 7 giorni prima della loro entrata in vigore.
3. Il membro che non accetta le condizioni modificate può chiudere l’account; l’uso continuato dopo la data di entrata in vigore vale come accettazione.`,
          },
          {
            title: 'Articolo 4 (Protezione dei dati personali)',
            body: `1. Il Servizio tratta l’e-mail e il nome o soprannome necessari per creare un account. Diari di visita, foto e dati simili vengono trattati quando si usano quelle funzioni.
2. Le informazioni ricevute da un fornitore di accesso social si limitano a quanto necessario per identificare l’account; la password del fornitore non viene mai ricevuta.
3. I dati trattati, le finalità, i periodi di conservazione, le modalità di eliminazione e l’uso di servizi di terze parti seguono l’informativa sulla privacy separata.`,
          },
        ],
      },
      {
        title: 'Capitolo 2. Uso del Servizio',
        articles: [
          {
            title: 'Articolo 5 (Conclusione del contratto)',
            body: `Il contratto si conclude quando l’utente accetta le condizioni, richiede la registrazione e il Servizio la accetta. I minori di 14 anni non possono registrarsi.`,
          },
          {
            title: 'Articolo 6 (Contenuto del Servizio)',
            body: `1. Il Servizio offre informazioni sui santuari cattolici della Corea, indicazioni sui percorsi di pellegrinaggio e diari di visita (timbri di visita e note di una riga).
2. Le descrizioni dei santuari sono redatte a partire da fonti verificate, come i materiali ufficiali delle diocesi; le informazioni turistiche nelle vicinanze vengono recuperate in tempo reale dalla TourAPI dell’Organizzazione del Turismo Coreana.
3. Le risposte della guida al pellegrinaggio Michele sono solo indicative; le informazioni importanti, come gli orari delle messe e di apertura, vanno confermate con l’ufficio del santuario.`,
          },
          {
            title: 'Articolo 7 (Sospensione del Servizio)',
            body: `Il Servizio, in tutto o in parte, può essere sospeso temporaneamente per cause inevitabili come manutenzione del sistema, guasti di API esterne o calamità naturali. Ne verrà dato avviso prima o dopo la sospensione.`,
          },
          {
            title: 'Articolo 8 (Servizi di terze parti)',
            body: `I servizi esterni come accesso social, mappe e indicazioni stradali seguono le condizioni e le politiche dei rispettivi fornitori. I problemi causati da un guasto o da un cambio di politica di un servizio esterno potrebbero dover essere segnalati a quel fornitore.`,
          },
        ],
      },
      {
        title: 'Capitolo 3. Obblighi e responsabilità',
        articles: [
          {
            title: 'Articolo 9 (Obblighi del fornitore del Servizio)',
            body: `1. Rispettiamo la legge applicabile e le presenti condizioni e ci impegniamo a fornire il Servizio in modo affidabile.
2. Quando viene rilevato un errore nelle informazioni di un santuario, lo correggiamo tempestivamente sulla base di fonti primarie verificate.
3. Manteniamo misure di sicurezza per proteggere i dati personali degli utenti.`,
          },
          {
            title: 'Articolo 10 (Obblighi degli utenti)',
            body: `1. Non è consentito usare l’account di un’altra persona né registrare informazioni false.
2. Non è consentito pubblicare nei diari di visita contenuti che violino i diritti altrui o espressioni offensive o d’odio verso istituzioni religiose o fedeli.
3. Non è consentito raccogliere (crawling) i dati del Servizio senza autorizzazione né ridistribuirli a fini commerciali.
4. Le violazioni possono comportare la rimozione dei contenuti, limitazioni d’uso o altre misure.`,
          },
          {
            title: 'Articolo 11 (Diritto d’autore)',
            body: `1. Il diritto d’autore sulle descrizioni dei santuari redatte dal Servizio appartiene al Servizio. Quando sono stati consultati materiali ufficiali di una diocesi, la fonte viene indicata.
2. Alcune foto usate nel Servizio sono opere con licenza libera, come quelle di Wikimedia Commons; fonte e licenza sono mostrate sullo schermo.
3. Il diritto d’autore sui diari di visita creati da un membro appartiene al membro; il Servizio può usarli nella misura necessaria a gestire e promuovere il Servizio.`,
          },
          {
            title: 'Articolo 12 (Limitazione di responsabilità)',
            body: `1. Orari delle messe, di apertura e dati simili possono cambiare in base alle circostanze locali; il Servizio non risponde dei disagi derivanti da una visita effettuata senza conferma preventiva.
2. Per questo Servizio gratuito, la responsabilità è limitata salvo dolo o colpa grave del Servizio.`,
          },
        ],
      },
    ],
  },
};

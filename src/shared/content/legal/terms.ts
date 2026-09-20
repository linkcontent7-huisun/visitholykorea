import type { Language } from '@/shared/i18n/dictionary';

/**
 * 이용약관 본문 — 6개 국어.
 *
 * 화면(`pages/TermsPage.tsx`)에 한국어로만 박혀 있던 것을 언어별로 나눴다 (T-031, 2026-09-20).
 * 투어원패스(pass.knto.or.kr/terms)의 장·조 구성을 참고해 우리 서비스에 맞게 쓴 한국어가 원문이고,
 * 나머지는 그 번역이다. 조항을 고칠 때는 여섯 언어를 함께 고친다 — 한 언어만 고치면 뜻이 갈라진다.
 */
export interface TermsArticle {
  title: string;
  body: string;
}
export interface TermsChapter {
  title: string;
  articles: TermsArticle[];
}
export interface TermsDocument {
  /** 시행일 — 그 언어의 날짜 표기 */
  effectiveDate: string;
  chapters: TermsChapter[];
}

export const TERMS: Record<Language, TermsDocument> = {
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
            body: `These terms set out the conditions and procedures for using Visit Holy Korea (the "Service"), and the rights, obligations and responsibilities of users and the service provider.`,
          },
          {
            title: 'Article 2 (Definitions)',
            body: `1. "User" means anyone who uses the Service under these terms.
2. "Member" means a user who has created an account with an email address or a social account.
3. "Social sign-in" means verifying your identity with an account from an external provider such as Kakao or Google.
4. "Visit record" means content a member creates in the Service, such as visit stamps and one-line notes.`,
          },
          {
            title: 'Article 3 (Effect and changes)',
            body: `1. These terms take effect when posted in the Service.
2. The service provider may change the terms within the limits of applicable law, and will announce changes at least 7 days before they take effect.
3. A member who does not agree to the changed terms may close their account; continued use after the effective date is regarded as agreement.`,
          },
          {
            title: 'Article 4 (Protection of personal data)',
            body: `1. The Service processes the email address and name or nickname needed to create an account. Visit records, photos and similar data are processed when you use those features.
2. Information received from a social sign-in provider is limited to what is needed to identify the account; the provider's password is never passed to us.
3. The items processed, purposes, retention periods, deletion methods and third-party services are set out in the separate privacy notice.`,
          },
        ],
      },
      {
        title: 'Chapter 2. Using the Service',
        articles: [
          {
            title: 'Article 5 (Formation of the agreement)',
            body: `The agreement is formed when a user agrees to these terms, applies to join, and the Service accepts. Persons under 14 may not join.`,
          },
          {
            title: 'Article 6 (Content of the Service)',
            body: `1. The Service provides information on Korean Catholic shrines, pilgrimage routes and visit records (visit stamps and one-line notes).
2. Shrine descriptions are written from verified sources such as official diocesan materials; nearby tourism information is fetched live from the Korea Tourism Organization TourAPI.
3. Answers from the Michael pilgrimage guide are for reference only; important details such as Mass times and opening hours must be confirmed with the shrine office.`,
          },
          {
            title: 'Article 7 (Suspension of the Service)',
            body: `The Service may be suspended in whole or in part for unavoidable reasons such as system maintenance, external API failures or natural disasters. Notice is given beforehand or afterwards.`,
          },
          {
            title: 'Article 8 (External services)',
            body: `External services such as social sign-in, maps and directions follow their providers' terms and policies. Problems caused by an outage or policy change of an external service may need to be raised with that provider.`,
          },
        ],
      },
      {
        title: 'Chapter 3. Obligations and liability',
        articles: [
          {
            title: 'Article 9 (Obligations of the service provider)',
            body: `1. We comply with applicable law and these terms, and strive to provide the Service reliably.
2. When we find an error in shrine information, we correct it promptly based on verified primary sources.
3. We maintain security measures to protect users' personal data.`,
          },
          {
            title: 'Article 10 (Obligations of users)',
            body: `1. Do not use another person's account or register false information.
2. Do not post visit records that infringe others' rights, or that insult or express hatred toward religious sites or believers.
3. Do not collect (crawl) the Service's data without permission or redistribute it commercially.
4. Breaching these obligations may lead to removal of content or restriction of use.`,
          },
          {
            title: 'Article 11 (Copyright)',
            body: `1. Copyright in shrine descriptions written by the Service belongs to the Service. Where official diocesan materials were consulted, the source is credited.
2. Some photos used in the Service are freely licensed works, for example from Wikimedia Commons, and their source and license are shown on screen.
3. Copyright in visit records belongs to the member who wrote them; the Service may use them within the scope of operating and promoting the Service.`,
          },
          {
            title: 'Article 12 (Limitation of liability)',
            body: `1. Mass times, opening hours and similar details may change with local circumstances; the Service is not liable for inconvenience arising from a visit made without prior confirmation.
2. For this free Service, liability is limited unless the Service acted intentionally or with gross negligence.`,
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
            body: `Estas condiciones establecen los requisitos y procedimientos de uso de Visit Holy Korea (el "Servicio"), así como los derechos, obligaciones y responsabilidades de los usuarios y del proveedor del Servicio.`,
          },
          {
            title: 'Artículo 2 (Definiciones)',
            body: `1. "Usuario" es toda persona que utiliza el Servicio conforme a estas condiciones.
2. "Miembro" es el usuario que ha creado una cuenta con un correo electrónico o una cuenta de red social.
3. "Inicio de sesión social" es la verificación de identidad mediante la cuenta de un proveedor externo, como Kakao o Google.
4. "Registro de peregrinación" es el contenido que un miembro crea en el Servicio, como sellos de visita y notas de una línea.`,
          },
          {
            title: 'Artículo 3 (Vigencia y modificaciones)',
            body: `1. Estas condiciones entran en vigor al publicarse en el Servicio.
2. El proveedor puede modificarlas dentro de los límites de la ley aplicable y anunciará los cambios al menos 7 días antes de su entrada en vigor.
3. El miembro que no acepte las condiciones modificadas puede cerrar su cuenta; seguir usando el Servicio tras la fecha de vigencia se considera aceptación.`,
          },
          {
            title: 'Artículo 4 (Protección de datos personales)',
            body: `1. El Servicio trata el correo electrónico y el nombre o apodo necesarios para crear la cuenta. Los registros de peregrinación, fotos y datos similares se tratan cuando se usan esas funciones.
2. La información recibida de un proveedor de inicio de sesión social se limita a lo necesario para identificar la cuenta; nunca recibimos la contraseña del proveedor.
3. Los datos tratados, fines, plazos de conservación, formas de eliminación y servicios externos se detallan en el aviso de privacidad.`,
          },
        ],
      },
      {
        title: 'Capítulo 2. Uso del Servicio',
        articles: [
          {
            title: 'Artículo 5 (Formalización del contrato)',
            body: `El contrato se formaliza cuando el usuario acepta estas condiciones, solicita el registro y el Servicio lo acepta. Los menores de 14 años no pueden registrarse.`,
          },
          {
            title: 'Artículo 6 (Contenido del Servicio)',
            body: `1. El Servicio ofrece información sobre los santuarios católicos de Corea, rutas de peregrinación y registros de peregrinación (sellos de visita y notas de una línea).
2. Las descripciones de los santuarios se redactan a partir de fuentes verificadas, como los materiales oficiales de cada diócesis; la información turística cercana se obtiene en tiempo real de la TourAPI de la Organización de Turismo de Corea.
3. Las respuestas del guía de peregrinación Miguel son solo orientativas; los datos importantes, como horarios de misa y apertura, deben confirmarse con la oficina del santuario.`,
          },
          {
            title: 'Artículo 7 (Suspensión del Servicio)',
            body: `El Servicio puede suspenderse total o parcialmente por causas inevitables, como mantenimiento del sistema, fallos de API externas o desastres naturales. Se avisará antes o después.`,
          },
          {
            title: 'Artículo 8 (Servicios externos)',
            body: `Los servicios externos, como el inicio de sesión social, los mapas y las indicaciones, se rigen por las condiciones y políticas de sus proveedores. Los problemas causados por una interrupción o un cambio de política de un servicio externo pueden tener que plantearse a ese proveedor.`,
          },
        ],
      },
      {
        title: 'Capítulo 3. Obligaciones y responsabilidad',
        articles: [
          {
            title: 'Artículo 9 (Obligaciones del proveedor)',
            body: `1. Cumplimos la ley aplicable y estas condiciones, y procuramos prestar el Servicio de forma estable.
2. Si detectamos un error en la información de un santuario, lo corregimos con rapidez basándonos en fuentes primarias verificadas.
3. Mantenemos medidas de seguridad para proteger los datos personales de los usuarios.`,
          },
          {
            title: 'Artículo 10 (Obligaciones del usuario)',
            body: `1. No use la cuenta de otra persona ni registre información falsa.
2. No publique en los registros de peregrinación contenido que vulnere derechos ajenos ni expresiones de insulto u odio hacia lugares religiosos o fieles.
3. No recopile (rastree) los datos del Servicio sin permiso ni los redistribuya con fines comerciales.
4. El incumplimiento puede conllevar la eliminación de contenido o la restricción del uso.`,
          },
          {
            title: 'Artículo 11 (Derechos de autor)',
            body: `1. Los derechos de autor de las descripciones de santuarios redactadas por el Servicio pertenecen al Servicio. Cuando se consultaron materiales oficiales diocesanos, se indica la fuente.
2. Algunas fotos del Servicio son obras con licencia libre, por ejemplo de Wikimedia Commons, y su fuente y licencia se muestran en pantalla.
3. Los derechos de autor de los registros de peregrinación pertenecen al miembro que los escribió; el Servicio puede usarlos en el ámbito de la operación y promoción del Servicio.`,
          },
          {
            title: 'Artículo 12 (Limitación de responsabilidad)',
            body: `1. Los horarios de misa, de apertura y datos similares pueden cambiar según las circunstancias locales; el Servicio no responde por inconvenientes derivados de una visita realizada sin confirmación previa.
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
            body: `Les présentes conditions définissent les modalités d’utilisation de Visit Holy Korea (le « Service ») ainsi que les droits, obligations et responsabilités des utilisateurs et du fournisseur du Service.`,
          },
          {
            title: 'Article 2 (Définitions)',
            body: `1. « Utilisateur » désigne toute personne qui utilise le Service selon les présentes conditions.
2. « Membre » désigne un utilisateur ayant créé un compte avec une adresse e-mail ou un compte de réseau social.
3. « Connexion sociale » désigne la vérification d’identité au moyen du compte d’un fournisseur externe tel que Kakao ou Google.
4. « Carnet de pèlerinage » désigne les contenus créés par un membre dans le Service, tels que les tampons de visite et les notes d’une ligne.`,
          },
          {
            title: 'Article 3 (Effet et modification)',
            body: `1. Les présentes conditions prennent effet dès leur publication dans le Service.
2. Le fournisseur peut les modifier dans les limites de la loi applicable et annonce toute modification au moins 7 jours avant son entrée en vigueur.
3. Un membre qui n’accepte pas les conditions modifiées peut fermer son compte ; la poursuite de l’utilisation après la date d’entrée en vigueur vaut acceptation.`,
          },
          {
            title: 'Article 4 (Protection des données personnelles)',
            body: `1. Le Service traite l’adresse e-mail et le nom ou pseudonyme nécessaires à la création du compte. Le carnet de pèlerinage, les photos et données similaires sont traités lors de l’utilisation de ces fonctions.
2. Les informations reçues d’un fournisseur de connexion sociale se limitent à ce qui est nécessaire pour identifier le compte ; le mot de passe du fournisseur ne nous est jamais transmis.
3. Les données traitées, finalités, durées de conservation, modalités de suppression et services tiers sont décrits dans l’avis de confidentialité distinct.`,
          },
        ],
      },
      {
        title: 'Chapitre 2. Utilisation du Service',
        articles: [
          {
            title: 'Article 5 (Formation du contrat)',
            body: `Le contrat est formé lorsque l’utilisateur accepte les présentes conditions, demande son inscription et que le Service l’accepte. Les personnes de moins de 14 ans ne peuvent pas s’inscrire.`,
          },
          {
            title: 'Article 6 (Contenu du Service)',
            body: `1. Le Service fournit des informations sur les sanctuaires catholiques de Corée, des parcours de pèlerinage et un carnet de pèlerinage (tampons de visite et notes d’une ligne).
2. Les présentations des sanctuaires sont rédigées à partir de sources vérifiées, telles que les documents officiels des diocèses ; les informations touristiques à proximité sont récupérées en temps réel via la TourAPI de l’Office du tourisme de Corée.
3. Les réponses du guide de pèlerinage Michel sont fournies à titre indicatif ; les informations importantes, comme les horaires des messes et d’ouverture, doivent être confirmées auprès du bureau du sanctuaire.`,
          },
          {
            title: 'Article 7 (Suspension du Service)',
            body: `Le Service peut être suspendu en tout ou partie pour des raisons inévitables telles qu’une maintenance, une panne d’API externe ou une catastrophe naturelle. Un avis est donné avant ou après.`,
          },
          {
            title: 'Article 8 (Services externes)',
            body: `Les services externes tels que la connexion sociale, les cartes et les itinéraires relèvent des conditions et politiques de leurs fournisseurs. Les problèmes dus à une panne ou à un changement de politique d’un service externe peuvent devoir être signalés à ce fournisseur.`,
          },
        ],
      },
      {
        title: 'Chapitre 3. Obligations et responsabilité',
        articles: [
          {
            title: 'Article 9 (Obligations du fournisseur)',
            body: `1. Nous respectons la loi applicable et les présentes conditions, et nous nous efforçons de fournir le Service de manière stable.
2. Lorsque nous découvrons une erreur dans les informations d’un sanctuaire, nous la corrigeons rapidement sur la base de sources primaires vérifiées.
3. Nous maintenons des mesures de sécurité pour protéger les données personnelles des utilisateurs.`,
          },
          {
            title: 'Article 10 (Obligations de l’utilisateur)',
            body: `1. Ne pas utiliser le compte d’autrui ni enregistrer de fausses informations.
2. Ne pas publier dans le carnet de pèlerinage de contenu portant atteinte aux droits d’autrui, ni d’insultes ou de propos haineux envers des lieux religieux ou des fidèles.
3. Ne pas collecter (aspirer) les données du Service sans autorisation ni les redistribuer à des fins commerciales.
4. Tout manquement peut entraîner la suppression de contenus ou une restriction d’utilisation.`,
          },
          {
            title: 'Article 11 (Droits d’auteur)',
            body: `1. Les droits d’auteur des présentations de sanctuaires rédigées par le Service appartiennent au Service. Lorsque des documents officiels diocésains ont été consultés, la source est indiquée.
2. Certaines photos du Service sont des œuvres sous licence libre, par exemple issues de Wikimedia Commons ; leur source et leur licence sont affichées à l’écran.
3. Les droits d’auteur du carnet de pèlerinage appartiennent au membre qui l’a rédigé ; le Service peut l’utiliser dans le cadre de son exploitation et de sa promotion.`,
          },
          {
            title: 'Article 12 (Limitation de responsabilité)',
            body: `1. Les horaires des messes, d’ouverture et informations similaires peuvent changer selon les circonstances locales ; le Service n’est pas responsable des désagréments liés à une visite effectuée sans confirmation préalable.
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
            title: 'Artigo 1 (Objetivo)',
            body: `Estes termos estabelecem as condições e os procedimentos de uso do Visit Holy Korea (o "Serviço"), bem como os direitos, obrigações e responsabilidades dos usuários e do provedor do Serviço.`,
          },
          {
            title: 'Artigo 2 (Definições)',
            body: `1. "Usuário" é toda pessoa que utiliza o Serviço conforme estes termos.
2. "Membro" é o usuário que criou uma conta com e-mail ou conta de rede social.
3. "Login social" é a verificação de identidade por meio da conta de um provedor externo, como Kakao ou Google.
4. "Registro de peregrinação" é o conteúdo que um membro cria no Serviço, como carimbos de visita e notas de uma linha.`,
          },
          {
            title: 'Artigo 3 (Vigência e alterações)',
            body: `1. Estes termos entram em vigor ao serem publicados no Serviço.
2. O provedor pode alterá-los dentro dos limites da lei aplicável e anunciará as alterações com pelo menos 7 dias de antecedência.
3. O membro que não concordar com os termos alterados pode encerrar a conta; continuar usando o Serviço após a data de vigência é considerado concordância.`,
          },
          {
            title: 'Artigo 4 (Proteção de dados pessoais)',
            body: `1. O Serviço trata o e-mail e o nome ou apelido necessários para criar a conta. Registros de peregrinação, fotos e dados semelhantes são tratados quando essas funções são usadas.
2. As informações recebidas de um provedor de login social limitam-se ao necessário para identificar a conta; a senha do provedor nunca nos é repassada.
3. Os dados tratados, finalidades, prazos de retenção, formas de exclusão e serviços de terceiros estão descritos no aviso de privacidade separado.`,
          },
        ],
      },
      {
        title: 'Capítulo 2. Uso do Serviço',
        articles: [
          {
            title: 'Artigo 5 (Formação do contrato)',
            body: `O contrato é formado quando o usuário aceita estes termos, solicita o cadastro e o Serviço o aceita. Menores de 14 anos não podem se cadastrar.`,
          },
          {
            title: 'Artigo 6 (Conteúdo do Serviço)',
            body: `1. O Serviço oferece informações sobre os santuários católicos da Coreia, roteiros de peregrinação e registros de peregrinação (carimbos de visita e notas de uma linha).
2. As descrições dos santuários são escritas a partir de fontes verificadas, como materiais oficiais de cada diocese; as informações turísticas próximas são obtidas em tempo real da TourAPI da Organização de Turismo da Coreia.
3. As respostas do guia de peregrinação Miguel são apenas para referência; informações importantes, como horários de missa e de abertura, devem ser confirmadas com o escritório do santuário.`,
          },
          {
            title: 'Artigo 7 (Suspensão do Serviço)',
            body: `O Serviço pode ser suspenso total ou parcialmente por motivos inevitáveis, como manutenção do sistema, falhas de APIs externas ou desastres naturais. O aviso é dado antes ou depois.`,
          },
          {
            title: 'Artigo 8 (Serviços externos)',
            body: `Serviços externos, como login social, mapas e rotas, seguem os termos e políticas de seus provedores. Problemas causados por interrupção ou mudança de política de um serviço externo podem precisar ser tratados com esse provedor.`,
          },
        ],
      },
      {
        title: 'Capítulo 3. Obrigações e responsabilidade',
        articles: [
          {
            title: 'Artigo 9 (Obrigações do provedor)',
            body: `1. Cumprimos a lei aplicável e estes termos, e nos esforçamos para prestar o Serviço de forma estável.
2. Ao encontrar um erro nas informações de um santuário, corrigimos rapidamente com base em fontes primárias verificadas.
3. Mantemos medidas de segurança para proteger os dados pessoais dos usuários.`,
          },
          {
            title: 'Artigo 10 (Obrigações do usuário)',
            body: `1. Não use a conta de outra pessoa nem registre informações falsas.
2. Não publique nos registros de peregrinação conteúdo que viole direitos de terceiros, nem insultos ou expressões de ódio contra locais religiosos ou fiéis.
3. Não colete (rastreie) os dados do Serviço sem permissão nem os redistribua comercialmente.
4. O descumprimento pode resultar na remoção de conteúdo ou na restrição de uso.`,
          },
          {
            title: 'Artigo 11 (Direitos autorais)',
            body: `1. Os direitos autorais das descrições de santuários escritas pelo Serviço pertencem ao Serviço. Quando materiais oficiais diocesanos foram consultados, a fonte é indicada.
2. Algumas fotos usadas no Serviço são obras com licença livre, por exemplo do Wikimedia Commons, e sua fonte e licença são exibidas na tela.
3. Os direitos autorais dos registros de peregrinação pertencem ao membro que os escreveu; o Serviço pode usá-los no âmbito da operação e divulgação do Serviço.`,
          },
          {
            title: 'Artigo 12 (Limitação de responsabilidade)',
            body: `1. Horários de missa, de abertura e informações semelhantes podem mudar conforme as circunstâncias locais; o Serviço não se responsabiliza por transtornos decorrentes de visitas feitas sem confirmação prévia.
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
            title: 'Articolo 1 (Finalità)',
            body: `Le presenti condizioni stabiliscono i requisiti e le procedure di utilizzo di Visit Holy Korea (il "Servizio"), nonché i diritti, gli obblighi e le responsabilità degli utenti e del fornitore del Servizio.`,
          },
          {
            title: 'Articolo 2 (Definizioni)',
            body: `1. "Utente" è chiunque utilizzi il Servizio secondo le presenti condizioni.
2. "Membro" è l'utente che ha creato un account con un indirizzo e-mail o un account social.
3. "Accesso social" è la verifica dell'identità tramite l'account di un fornitore esterno, come Kakao o Google.
4. "Diario di pellegrinaggio" è il contenuto che un membro crea nel Servizio, come i timbri di visita e le note di una riga.`,
          },
          {
            title: 'Articolo 3 (Efficacia e modifiche)',
            body: `1. Le presenti condizioni hanno effetto dalla pubblicazione nel Servizio.
2. Il fornitore può modificarle nei limiti della legge applicabile e annuncia le modifiche almeno 7 giorni prima della loro entrata in vigore.
3. Il membro che non accetta le condizioni modificate può chiudere l'account; l'uso continuato dopo la data di entrata in vigore vale come accettazione.`,
          },
          {
            title: 'Articolo 4 (Protezione dei dati personali)',
            body: `1. Il Servizio tratta l'indirizzo e-mail e il nome o nickname necessari alla creazione dell'account. Diario di pellegrinaggio, foto e dati simili sono trattati quando si usano tali funzioni.
2. Le informazioni ricevute da un fornitore di accesso social sono limitate a quanto necessario per identificare l'account; la password del fornitore non ci viene mai trasmessa.
3. Dati trattati, finalità, periodi di conservazione, modalità di cancellazione e servizi di terzi sono descritti nell'informativa sulla privacy separata.`,
          },
        ],
      },
      {
        title: 'Capitolo 2. Utilizzo del Servizio',
        articles: [
          {
            title: 'Articolo 5 (Conclusione del contratto)',
            body: `Il contratto si conclude quando l'utente accetta le presenti condizioni, richiede la registrazione e il Servizio la accetta. I minori di 14 anni non possono registrarsi.`,
          },
          {
            title: 'Articolo 6 (Contenuto del Servizio)',
            body: `1. Il Servizio fornisce informazioni sui santuari cattolici della Corea, percorsi di pellegrinaggio e un diario di pellegrinaggio (timbri di visita e note di una riga).
2. Le descrizioni dei santuari sono redatte da fonti verificate, come i materiali ufficiali delle diocesi; le informazioni turistiche nelle vicinanze sono recuperate in tempo reale dalla TourAPI dell'Organizzazione del Turismo Coreano.
3. Le risposte della guida al pellegrinaggio Michele sono solo indicative; le informazioni importanti, come gli orari delle messe e di apertura, vanno confermate con l'ufficio del santuario.`,
          },
          {
            title: 'Articolo 7 (Sospensione del Servizio)',
            body: `Il Servizio può essere sospeso in tutto o in parte per cause inevitabili, come manutenzione del sistema, guasti di API esterne o calamità naturali. L'avviso è dato prima o dopo.`,
          },
          {
            title: 'Articolo 8 (Servizi esterni)',
            body: `I servizi esterni, come l'accesso social, le mappe e le indicazioni stradali, seguono le condizioni e le politiche dei rispettivi fornitori. I problemi causati da un'interruzione o da un cambio di politica di un servizio esterno potrebbero dover essere segnalati a quel fornitore.`,
          },
        ],
      },
      {
        title: 'Capitolo 3. Obblighi e responsabilità',
        articles: [
          {
            title: 'Articolo 9 (Obblighi del fornitore)',
            body: `1. Rispettiamo la legge applicabile e le presenti condizioni e ci impegniamo a fornire il Servizio in modo stabile.
2. Quando individuiamo un errore nelle informazioni di un santuario, lo correggiamo rapidamente sulla base di fonti primarie verificate.
3. Manteniamo misure di sicurezza per proteggere i dati personali degli utenti.`,
          },
          {
            title: "Articolo 10 (Obblighi dell'utente)",
            body: `1. Non usare l'account di altri né registrare informazioni false.
2. Non pubblicare nel diario di pellegrinaggio contenuti che violino i diritti altrui, né insulti o espressioni di odio verso luoghi religiosi o fedeli.
3. Non raccogliere (crawling) i dati del Servizio senza autorizzazione né ridistribuirli a fini commerciali.
4. La violazione di questi obblighi può comportare la rimozione dei contenuti o la limitazione dell'uso.`,
          },
          {
            title: "Articolo 11 (Diritto d'autore)",
            body: `1. Il diritto d'autore sulle descrizioni dei santuari redatte dal Servizio appartiene al Servizio. Quando sono stati consultati materiali ufficiali diocesani, la fonte è indicata.
2. Alcune foto usate nel Servizio sono opere con licenza libera, ad esempio da Wikimedia Commons, e la loro fonte e licenza sono mostrate sullo schermo.
3. Il diritto d'autore sul diario di pellegrinaggio appartiene al membro che lo ha scritto; il Servizio può usarlo nell'ambito della gestione e della promozione del Servizio.`,
          },
          {
            title: 'Articolo 12 (Limitazione di responsabilità)',
            body: `1. Orari delle messe, di apertura e informazioni simili possono cambiare secondo le circostanze locali; il Servizio non risponde dei disagi derivanti da una visita effettuata senza conferma preventiva.
2. Per questo Servizio gratuito, la responsabilità è limitata salvo dolo o colpa grave del Servizio.`,
          },
        ],
      },
    ],
  },
};

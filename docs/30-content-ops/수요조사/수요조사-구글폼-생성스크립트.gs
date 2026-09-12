/**
 * 비지트홀리 교인 수요조사 — 구글 설문지 자동 생성 스크립트
 *
 * 왜 있는가
 *   이 노트북 크롬에서 구글폼 편집 화면이 스크롤할 때마다 멈춘다.
 *   자동화로 만지면 클릭이 빗나가 항목이 삭제되는 사고까지 났다.
 *   이 스크립트를 돌리면 완성된 설문이 통째로 새로 만들어진다 — 2분이면 된다.
 *
 * 쓰는 법
 *   1. script.google.com → "새 프로젝트"
 *   2. 편집기 내용을 다 지우고 이 파일 전체를 붙여넣기
 *   3. ▷ 실행 → 권한 요청 승인
 *      ("확인되지 않은 앱" 경고가 뜨면 고급 → 안전하지 않은 페이지로 이동 → 허용.
 *       내가 방금 붙여넣은 스크립트라 정상이다)
 *   4. 아래 "실행 로그"에 설문 링크·응답 시트 주소가 찍힌다
 *
 * 주의
 *   질문 문구를 바꾸지 말 것. 응답 집계 도구가 질문 제목으로 열을 찾는다.
 *   바꾸려면 수요조사 키트의 집계 탭도 같이 고쳐야 한다.
 *   https://claude.ai/code/artifact/9c32b6b4-0ba2-499c-bb4e-de2a00bb5c5c
 */

function 설문지만들기() {
  var form = FormApp.create('성지 순례에 대해 여쭙습니다');

  form.setDescription(
    '속도가 빠르다고 해서 반드시 목적지에 잘 도착하는 것은 아닙니다.\n' +
    '세상의 욕망을 향해 달리던 길에서 잠시 멈춰 서는 것.\n' +
    '깨어 있는 마음으로 앞으로 나아가는 길,\n' +
    '이제 그 길을 함께 걷고자 합니다.\n\n' +
    '마당의 나무는 오래 그 자리에 서 있고\n' +
    '스테인드글라스를 지나온 빛이 고요합니다.\n' +
    '누구에게나 열려 있는 전국의 아름다운 성지를\n' +
    '찾아가는 길이 어렵지 않도록\n' +
    "'비지트홀리코리아'라는 웹앱을 만들고 있습니다.\n\n" +
    '성지와 성당, 공소와 본당을 다녀오신 분들께\n' +
    '무엇이 도움이 되었고 무엇이 불편했는지, 무엇을 바라시는지.\n' +
    '여쭤봅니다. 3분이면 됩니다.\n\n' +
    '익명이고, 이름은 받지 않습니다.\n' +
    '좋게 적어주시지 않아도 괜찮습니다. 솔직한 맘을 알려주세요.'
  );

  form.setCollectEmail(false);      // 익명이어야 솔직해진다
  form.setProgressBar(true);
  form.setAllowResponseEdits(false);
  form.setConfirmationMessage(
    '고맙습니다. 남겨주신 의견은 앱을 고치는 데 그대로 쓰겠습니다.\n\n' +
    '앱은 여기서 보실 수 있습니다 — https://visitholykorea-app.vercel.app'
  );

  // ── 1
  form.addMultipleChoiceItem()
    .setTitle('연령대를 알려주세요.')
    .setChoiceValues(['30대 이하', '40대', '50대', '60대', '70대 이상'])
    .setRequired(true);

  // ── 2  과거 행동을 묻는다. 미래 의향은 믿을 수 없다
  form.addMultipleChoiceItem()
    .setTitle('최근 1년간 성지 순례를 몇 곳 다녀오셨나요?')
    .setChoiceValues(['없다', '1~2곳', '3~5곳', '6곳 이상'])
    .setRequired(true);

  // ── 3  '혼자 계획하는 사람'이 실재하는지. 없으면 팔 곳은 개인이 아니라 본당이다
  form.addMultipleChoiceItem()
    .setTitle('성지에 가실 때 주로 어떻게 가시나요?')
    .setChoiceValues([
      '본당 단체순례로',
      '가족·지인과 함께',
      '혼자 계획해서',
      '성지순례 수첩 코스대로',
      '다녀본 적 없다'
    ])
    .setRequired(true);

  // ── 4  코스 설계의 단위를 정한다 — 반나절짜리인지 1박2일짜리인지
  form.addMultipleChoiceItem()
    .setTitle('성지 순례에 시간을 낸다면 어느 정도가 좋으신가요?')
    .setChoiceValues([
      '반나절 (2~4시간)',
      '하루 당일 코스',
      '1박 2일',
      '2박 3일 이상',
      '아직 시간을 내기 어렵다'
    ])
    .setRequired(true);

  // ── 5  앱이 푸는 문제는 '어디로 갈지 몰라서' 하나뿐이다
  form.addMultipleChoiceItem()
    .setTitle('성지에 가려다 못 가신 적이 있다면 가장 큰 이유는 무엇이었나요?')
    .setChoiceValues([
      '시간이 없어서',
      '교통이 불편하고 멀어서',
      '어디로 갈지 몰라서',
      '혼자 가기 부담스러워서',
      '못 간 적 없다'
    ])
    .setRequired(true);

  // ── 6  ★ 이 앱의 존재 이유를 정면으로 검증한다.
  //        마지막 보기는 우리 전제가 틀렸을 때 그 사실이 드러나라고 넣었다
  form.addMultipleChoiceItem()
    .setTitle('성지에 갔을 때 "사람이 많아 불편하다"고 느끼신 적이 있나요?')
    .setChoiceValues([
      '자주 있다',
      '가끔 있다',
      '거의 없다',
      '오히려 너무 한산해서 아쉬웠다'
    ])
    .setRequired(true);

  // ── 7  도슨트 수요. 6번이 낮고 이것이 높으면 사업의 중심을 해설로 옮겨야 한다
  form.addMultipleChoiceItem()
    .setTitle('성지 현장에서 설명이 부족하다고 느끼신 적이 있나요? (건축·성상·스테인드글라스·역사 등)')
    .setChoiceValues(['자주 있다', '가끔 있다', '거의 없다'])
    .setRequired(true);

  // ── 8  불편은 하나가 아니라 여러 개가 겹치므로 체크박스다.
  //        해설 부족은 7번이 빈도까지 물으므로 여기 보기에서 뺐다
  form.addCheckboxItem()
    .setTitle('다녀오시면서 불편했던 점이 있다면 골라주세요. (여러 개 고르셔도 됩니다)')
    .setChoiceValues([
      '가는 길과 교통편을 찾기 어려웠다',
      '문이 닫혀 있거나 개방 시간을 알 수 없었다',
      '미사·전례 시간을 알기 어려웠다',
      '화장실·주차·앉아 쉴 곳이 마땅치 않았다',
      '비신자나 외국인이 이해할 안내가 없었다',
      '어디부터 어떻게 봐야 할지 몰랐다',
      '특별히 불편한 점은 없었다'
    ])
    .setRequired(false);

  // ── 9  순례를 여행으로 넓힐 때 무엇을 같이 담아야 하는지
  form.addCheckboxItem()
    .setTitle('성지에 가실 때 주변 정보도 함께 있으면 좋겠다 싶은 것을 골라주세요. (여러 개)')
    .setChoiceValues([
      '근처 맛집·식당',
      '숙박 (피정의집·게스트하우스·호텔)',
      '주변 관광지·명소',
      '카페·쉴 곳',
      '주차장·대중교통 안내',
      '지역 특산물·기념품',
      '함께 묶어 볼 만한 다른 성지'
    ])
    .setRequired(false);

  // ── 10  ★ 지불 의사. "얼마면 내시겠어요"라고 묻지 않는다 — 그러면 다들 후하게 답한다
  form.addMultipleChoiceItem()
    .setTitle('성지에서 1박2일 쉼 프로그램이 있다면 어떠세요? (미사·묵상·성지 해설·식사·숙박 포함, 참가비 5만 원)')
    .setChoiceValues([
      '지금이라도 신청하고 싶다',
      '관심은 있으나 일정을 봐야 한다',
      '가격이 부담된다',
      '프로그램 자체에 관심 없다'
    ])
    .setRequired(true);

  // ── 11  실제 지불 가능선. 2만 원대에 몰리면 프로그램은 수익원이 아니다
  form.addTextItem()
    .setTitle('(앞에서 "가격이 부담된다"고 하셨다면) 얼마면 참가하시겠어요?')
    .setHelpText('해당하지 않으시면 비워두셔도 됩니다.')
    .setRequired(false);

  // ── 12  ★ 기능 우선순위 + 앱을 실제로 열게 만드는 질문
  form.addMultipleChoiceItem()
    .setTitle('앱을 잠깐 열어보시고 여쭙니다. 가장 필요해 보이는 기능 하나만 골라주세요.')
    .setHelpText('https://visitholykorea-app.vercel.app — 설치 없이 바로 열립니다')
    .setChoiceValues([
      '오늘 한산한 성지 알려주기',
      '성지 해설 (성당 안의 건축·성상 설명)',
      '순례 여권 스탬프',
      '주변 본당·피정의집 안내',
      '영어 안내',
      '딱히 필요한 것이 없다'
    ])
    .setRequired(true);

  // ── 개인정보 안내 (연락처를 받으므로 반드시 앞에 둔다)
  form.addSectionHeaderItem()
    .setTitle('개인정보 수집 안내')
    .setHelpText(
      '아래에서 연락처를 남기시는 경우에만 해당합니다.\n' +
      '· 수집 항목 : 연락처(휴대전화 또는 이메일)\n' +
      '· 수집 목적 : 앱 베타 테스트 안내\n' +
      '· 보유 기간 : 베타 테스트 종료 후 즉시 파기\n' +
      '· 남기지 않으셔도 설문 제출에는 아무 지장이 없습니다.'
    );

  // ── 13  설문을 사용자 확보로 바꾸는 질문
  form.addMultipleChoiceItem()
    .setTitle('앱을 미리 써보시고 의견을 주실 수 있나요? (베타 사용자)')
    .setChoiceValues(['예 (연락처를 남기겠습니다)', '아니오'])
    .setRequired(true);

  form.addTextItem()
    .setTitle("연락처 (위에서 '예'를 고르신 분만 적어주세요)")
    .setHelpText('베타 안내 외의 목적으로는 쓰지 않습니다.')
    .setRequired(false);

  // ── 14  "자유롭게"보다 무엇을 적으라고 지목하는 쪽이 답이 훨씬 많이 나온다
  form.addParagraphTextItem()
    .setTitle('"이런 게 있으면 좋겠다" 싶은 것을 적어주세요.')
    .setRequired(false);

  // ── 응답이 쌓일 스프레드시트를 같이 만들어 연결한다
  var sheet = SpreadsheetApp.create('성지 순례 설문 응답');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  Logger.log('');
  Logger.log('=====================================================');
  Logger.log('  설문지가 만들어졌습니다.');
  Logger.log('=====================================================');
  Logger.log('');
  Logger.log('[교인들께 보낼 링크]');
  Logger.log(form.shortenFormUrl(form.getPublishedUrl()));
  Logger.log('');
  Logger.log('[내가 수정할 때 쓰는 링크]');
  Logger.log(form.getEditUrl());
  Logger.log('');
  Logger.log('[응답이 쌓이는 시트]');
  Logger.log(sheet.getUrl());
  Logger.log('');
  Logger.log('머리글 이미지는 코드로 못 넣습니다. 편집 화면에서');
  Logger.log('테마 → 머리글 → 이미지 선택 으로 직접 올리세요.');
  Logger.log('예비 이미지: https://visitholykorea-app.vercel.app/survey-header.png');
  Logger.log('');
}

/**
 * 만든 카드 그림을 휴대폰 공유창(인스타·카톡)으로 보낸다. 공유창이 없는 PC 는 내려받기로.
 * 9/14 「내 기록 최소화」 때 지웠던 것을 v7.0(2026-11-13)에서 되살렸다 — 산사가 퍼진 길이 이미지 공유였다.
 */
export async function shareOrDownloadCard(blob: Blob, fileName: string, title: string): Promise<void> {
  const file = new File([blob], fileName, { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (e) {
      // 사용자가 공유창을 닫은 것은 실패가 아니다 — 아무것도 하지 않는다
      if (e instanceof DOMException && e.name === 'AbortError') return;
      // 그 밖의 실패(권한 등)는 내려받기로 대신한다
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

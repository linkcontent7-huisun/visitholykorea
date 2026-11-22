/**
 * 기록에 사진을 이어 붙일 자리 번호(1부터).
 *
 * 예전에는 「지금 장수 + 1」을 썼다. 그런데 사진을 지우면 자리 번호에 빈 곳이 생겨
 * (예: 1·2·3 에서 1을 지우면 2·3 이 남아 장수는 2), 다음 사진이 3번 자리에 올라가
 * **남아 있던 3번 사진을 덮어썼다** — 저장소 파일 이름도 `<자리>.jpg` 라 파일까지 바뀐다
 * (2026-11-22 사장님 「사진 넣는 것이 성지마다 다르다」 조사). 가장 큰 자리 번호 다음을 쓴다.
 */
export function nextPhotoPosition(photos: readonly { position: number }[]): number {
  return photos.reduce((max, p) => Math.max(max, p.position), 0) + 1;
}

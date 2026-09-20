export interface PhotoEntry {
  name: string;
  id: string | null;
}

export interface DeleteAccountOperations {
  listPhotos(prefix: string, offset: number): Promise<PhotoEntry[]>;
  removePhotos(paths: string[]): Promise<void>;
  deleteRows(table: string, userId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
}

const PAGE_SIZE = 100;

/** 폴더 안의 파일을 먼저 모두 찾는다. 사진 삭제 전 목록 조회에 실패하면 계정은 그대로 둔다. */
async function collectPhotoPaths(
  prefix: string,
  operations: DeleteAccountOperations,
): Promise<string[]> {
  const paths: string[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const entries = await operations.listPhotos(prefix, offset);
    for (const entry of entries) {
      const path = `${prefix}/${entry.name}`;
      if (entry.id === null) paths.push(...(await collectPhotoPaths(path, operations)));
      else paths.push(path);
    }
    if (entries.length < PAGE_SIZE) break;
  }
  return paths;
}

export async function deleteAccountData(
  userId: string,
  operations: DeleteAccountOperations,
): Promise<void> {
  const photoPaths = await collectPhotoPaths(userId, operations);
  for (let i = 0; i < photoPaths.length; i += PAGE_SIZE) {
    await operations.removePhotos(photoPaths.slice(i, i + PAGE_SIZE));
  }

  // auth.users 를 지우면 FK 행은 연쇄 삭제되지만, SET NULL 또는 FK 가 없는 행은 먼저 지워야 한다.
  await operations.deleteRows('events', userId);
  await operations.deleteRows('visit_note_reports', userId);
  await operations.deleteRows('rest_spot_reports', userId);
  await operations.deleteUser(userId);
}

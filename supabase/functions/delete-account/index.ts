/** 본인 계정과 연결 자료를 삭제한다. service_role 키는 서버에서만 읽는다. */
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { deleteAccountData, type PhotoEntry } from '../_shared/delete-account.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function respond(status: number, body: { error?: string; success?: boolean }): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return respond(405, { error: 'METHOD_NOT_ALLOWED' });

  const bearer = req.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!bearer) return respond(401, { error: 'UNAUTHORIZED' });

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return respond(500, { error: 'SERVER_NOT_CONFIGURED' });

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error: authError } = await admin.auth.getUser(bearer);
  if (authError || !data.user) return respond(401, { error: 'UNAUTHORIZED' });
  const userId = data.user.id;

  try {
    await deleteAccountData(userId, {
      async listPhotos(prefix, offset): Promise<PhotoEntry[]> {
        const { data: files, error } = await admin.storage
          .from('pilgrim-photos')
          .list(prefix, { limit: 100, offset });
        if (error) throw error;
        return (files ?? []).map((file) => ({ name: file.name, id: file.id ?? null }));
      },
      async removePhotos(paths) {
        const { error } = await admin.storage.from('pilgrim-photos').remove(paths);
        if (error) throw error;
      },
      async deleteRows(table, uid) {
        const column = table === 'visit_note_reports' ? 'reporter' : 'user_id';
        const { error } = await admin.from(table).delete().eq(column, uid);
        // 배포 시점에 아직 생성되지 않은 선택 기능의 표에는 지울 자료도 없다.
        if (error && error.code !== 'PGRST205' && error.code !== '42P01') throw error;
      },
      async deleteUser(uid) {
        const { error } = await admin.auth.admin.deleteUser(uid);
        if (error) throw error;
      },
    });
    return respond(200, { success: true });
  } catch (error) {
    console.error('delete-account failed:', error);
    return respond(500, { error: 'DELETE_FAILED' });
  }
});

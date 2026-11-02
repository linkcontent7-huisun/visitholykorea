-- 2026-11-02 사장님 지시: 제주교구 홈페이지 「성지·순례지」 메뉴의 하논성당 순례지·순례길을 성지로.
-- · 하논성당 순례지 → 새 성지로 추가 (앱에 없었음)
-- · 순례길 → 교구 메뉴가 santoviaggio.com 으로 이어진다 = 이미 있는 「산토비아조 순례길」. 새로 만들지 않고 보강.
-- 출처: 뉴스제주 [향토문화] 호근동 하논성당터(2014 작성) · 제주교구 서귀포본당 연혁(diocesejeju.or.kr/church_southsite03)
--       · 천주교제주순례길 홈페이지(santoviaggio.com, 2026-11-02 확인) · 좌표는 카카오 지도 「하논성당터」(호근동 194-1)
-- 운영 DB 에 2026-11-02 적용. 다시 돌려도 같은 이름이 두 번 생기지 않게 막아 두었다.

begin;

insert into public.holy_sites (
  name, category, diocese, region_province, location, lat, lng,
  description, history, seo_title, seo_description, emotion_tag
)
select
  '하논성당 순례지',
  '역사사적지',
  '제주',
  '제주',
  '제주특별자치도 서귀포시 호근동 194-1 (하논 분화구 옆)',
  33.2497432296595,
  126.541385805573,
  '서귀포 하논 분화구 곁, 큰 소나무가 선 자리에 제주 남쪽 지역 최초의 성당이 있었다. 1899년 11월 한논공소로 시작해 1900년 6월 12일 김원영 아우구스티노 신부가 초가 성당을 세우며 본당이 되었고, 한때 신자 137명과 예비신자 600여 명이 모였다. 1901년 신축교안으로 공동체가 크게 무너지자 1902년 홍로(지금의 서홍동 면형의 집)로 옮겨 갔고, 1937년 지금의 서귀포성당에 자리 잡았다. 서귀포·모슬포·성산포·효돈 등 산남 지역 여러 본당의 뿌리가 된 곳이다. 지금은 안내판이 성당 터를 알려 주고, 천주교 제주 순례길 「하논성당길」이 이곳을 지난다.',
  '1899년 11월 11일 한논공소 설립 → 1900년 6월 12일 한논본당 설립(제주교구 두 번째 본당, 김원영 아우구스티노 신부) → 1901년 신축교안으로 폐허 → 1902년 6월 17일 홍로본당(서홍동)으로 이전 → 1937년 8월 15일 현 서귀포성당으로 이전. 2010년 서귀포성당 설립 110주년 사업으로 성당 터를 찾아 순례길로 조성했다.',
  '하논성당 순례지 - 제주 남쪽 첫 성당의 터',
  '서귀포 하논 분화구 곁, 1900년 산남 지역 최초의 성당이 섰던 자리. 서귀포성당의 뿌리를 따라 걷는 하논성당길.',
  '평온'
where not exists (select 1 from public.holy_sites where name = '하논성당 순례지');

-- 5개 국어 (사람 검수 전 → machine)
insert into public.holy_site_translations (site_id, language, name, description, history, address_romanized, translation_status)
select s.id, t.language, t.name, t.description, t.history, '194-1 Hogeun-dong, Seogwipo-si, Jeju', 'machine'
from public.holy_sites s
cross join (values
  ('en', 'Hanon Church Pilgrimage Site',
   'Beside the Hanon crater in Seogwipo, where a large pine tree stands, was the first Catholic church in southern Jeju. It began as the Hanon mission station in November 1899 and became a parish on 12 June 1900, when Fr Augustine Kim Won-yeong built a thatched-roof church; at one point 137 faithful and some 600 catechumens gathered here. After the 1901 Sinchuk incident devastated the community, the parish moved to Hongno (today''s Myeonhyeong House in Seohong-dong) in 1902 and settled at the present Seogwipo Church in 1937. It is the root of many parishes in southern Jeju, including Seogwipo, Moseulpo, Seongsanpo and Hyodon. Today a signboard marks the site, and the Hanon Church Trail of the Jeju Catholic pilgrimage route passes by.',
   'Mission station founded 11 Nov 1899 → parish founded 12 Jun 1900 (second parish of the Jeju diocese, Fr Augustine Kim Won-yeong) → ruined in the 1901 Sinchuk incident → moved to Hongno parish (Seohong-dong) on 17 Jun 1902 → moved to the present Seogwipo Church on 15 Aug 1937. The site was rediscovered in 2010 for Seogwipo Church''s 110th anniversary and made part of a pilgrimage trail.'),
  ('es', 'Lugar de peregrinación de la iglesia de Hanon',
   'Junto al cráter de Hanon, en Seogwipo, donde se alza un gran pino, estuvo la primera iglesia católica del sur de Jeju. Empezó como estación misional en noviembre de 1899 y se convirtió en parroquia el 12 de junio de 1900, cuando el P. Agustín Kim Won-yeong levantó una iglesia con techo de paja; llegó a reunir a 137 fieles y unos 600 catecúmenos. Tras el incidente de Sinchuk de 1901, que deshizo la comunidad, la parroquia se trasladó a Hongno (hoy la Casa Myeonhyeong, en Seohong-dong) en 1902 y se estableció en la actual iglesia de Seogwipo en 1937. Es la raíz de muchas parroquias del sur de Jeju, como Seogwipo, Moseulpo, Seongsanpo y Hyodon. Hoy un panel señala el lugar y por aquí pasa el Camino de la iglesia de Hanon de la ruta católica de Jeju.',
   'Estación misional fundada el 11 nov. 1899 → parroquia el 12 jun. 1900 (segunda parroquia de la diócesis de Jeju, P. Agustín Kim Won-yeong) → arruinada en el incidente de Sinchuk de 1901 → trasladada a Hongno (Seohong-dong) el 17 jun. 1902 → trasladada a la actual iglesia de Seogwipo el 15 ago. 1937. El lugar se redescubrió en 2010 por el 110.º aniversario de la iglesia de Seogwipo y se incorporó a un camino de peregrinación.'),
  ('fr', 'Lieu de pèlerinage de l’église de Hanon',
   'Près du cratère de Hanon, à Seogwipo, là où se dresse un grand pin, s’élevait la première église catholique du sud de Jeju. Simple station missionnaire en novembre 1899, elle devint paroisse le 12 juin 1900, lorsque le P. Augustin Kim Won-yeong bâtit une église au toit de chaume ; jusqu’à 137 fidèles et quelque 600 catéchumènes s’y rassemblèrent. Après l’incident de Sinchuk (1901), qui brisa la communauté, la paroisse fut transférée à Hongno (l’actuelle maison Myeonhyeong, à Seohong-dong) en 1902, puis à l’actuelle église de Seogwipo en 1937. C’est la racine de nombreuses paroisses du sud de Jeju : Seogwipo, Moseulpo, Seongsanpo, Hyodon… Un panneau signale aujourd’hui le site, sur le Chemin de l’église de Hanon du pèlerinage catholique de Jeju.',
   'Station missionnaire fondée le 11 nov. 1899 → paroisse le 12 juin 1900 (deuxième paroisse du diocèse de Jeju, P. Augustin Kim Won-yeong) → ruinée lors de l’incident de Sinchuk en 1901 → transférée à Hongno (Seohong-dong) le 17 juin 1902 → transférée à l’actuelle église de Seogwipo le 15 août 1937. Le site, retrouvé en 2010 pour les 110 ans de l’église de Seogwipo, fait partie d’un chemin de pèlerinage.'),
  ('pt', 'Local de peregrinação da igreja de Hanon',
   'Junto à cratera de Hanon, em Seogwipo, onde se ergue um grande pinheiro, ficava a primeira igreja católica do sul de Jeju. Começou como estação missionária em novembro de 1899 e tornou-se paróquia a 12 de junho de 1900, quando o P. Agostinho Kim Won-yeong construiu uma igreja de colmo; chegou a reunir 137 fiéis e cerca de 600 catecúmenos. Depois de o incidente de Sinchuk (1901) desfazer a comunidade, a paróquia mudou-se para Hongno (hoje a Casa Myeonhyeong, em Seohong-dong) em 1902 e fixou-se na atual igreja de Seogwipo em 1937. É a raiz de muitas paróquias do sul de Jeju, como Seogwipo, Moseulpo, Seongsanpo e Hyodon. Hoje uma placa assinala o local, por onde passa o Caminho da igreja de Hanon da rota católica de Jeju.',
   'Estação missionária fundada a 11 nov. 1899 → paróquia a 12 jun. 1900 (segunda paróquia da diocese de Jeju, P. Agostinho Kim Won-yeong) → arruinada no incidente de Sinchuk de 1901 → transferida para Hongno (Seohong-dong) a 17 jun. 1902 → transferida para a atual igreja de Seogwipo a 15 ago. 1937. O local foi redescoberto em 2010, no 110.º aniversário da igreja de Seogwipo, e integrado num caminho de peregrinação.'),
  ('it', 'Luogo di pellegrinaggio della chiesa di Hanon',
   'Accanto al cratere di Hanon, a Seogwipo, dove sorge un grande pino, c’era la prima chiesa cattolica del sud di Jeju. Nata come stazione missionaria nel novembre 1899, divenne parrocchia il 12 giugno 1900, quando p. Agostino Kim Won-yeong costruì una chiesa con il tetto di paglia; arrivò a riunire 137 fedeli e circa 600 catecumeni. Dopo che l’incidente di Sinchuk (1901) disperse la comunità, la parrocchia si trasferì a Hongno (oggi la Casa Myeonhyeong, a Seohong-dong) nel 1902 e si stabilì nell’attuale chiesa di Seogwipo nel 1937. È la radice di molte parrocchie del sud di Jeju, come Seogwipo, Moseulpo, Seongsanpo e Hyodon. Oggi un cartello indica il luogo, attraversato dal Cammino della chiesa di Hanon del percorso cattolico di Jeju.',
   'Stazione missionaria fondata l’11 nov. 1899 → parrocchia il 12 giu. 1900 (seconda parrocchia della diocesi di Jeju, p. Agostino Kim Won-yeong) → distrutta nell’incidente di Sinchuk del 1901 → trasferita a Hongno (Seohong-dong) il 17 giu. 1902 → trasferita all’attuale chiesa di Seogwipo il 15 ago. 1937. Il luogo è stato ritrovato nel 2010 per i 110 anni della chiesa di Seogwipo ed è entrato in un cammino di pellegrinaggio.')
) as t(language, name, description, history)
where s.name = '하논성당 순례지'
  and not exists (select 1 from public.holy_site_translations x where x.site_id = s.id and x.language = t.language);

insert into public.site_sources (site_id, kind, title, url, collected_at, collected_by, note)
select s.id, v.kind, v.title, v.url, date '2026-11-02', 'claude', v.note
from public.holy_sites s
cross join (values
  ('web', '뉴스제주 [향토문화] 호근동 하논성당(한논성당)터', 'https://www.newsje.com/news/articleView.html?idxno=261722', '설립 연도·신자 수·이전 경위·안내판 문구'),
  ('web', '천주교 제주교구 서귀포본당 안내', 'https://www.diocesejeju.or.kr/church_southsite03', '1900.6.12 설립, 1902 홍로, 1937 서귀리 이전 — 위 기사와 일치'),
  ('web', '천주교제주순례길(산토비아조) — 하논성당길', 'http://santoviaggio.com/', '하논성당길 스탬프 장소에 하논성지 포함')
) as v(kind, title, url, note)
where s.name = '하논성당 순례지'
  and not exists (select 1 from public.site_sources x where x.site_id = s.id and x.url = v.url);

-- 산토비아조 순례길 보강 — 코스 6개·스탬프 장소·홈페이지 (santoviaggio.com, 2026-11-02 확인)
update public.holy_sites set
  homepage_url = 'http://santoviaggio.com/',
  history = '스페인의 산티아고 순례길에서 영감을 받아 조성된 제주교구의 도보 순례 코스로, 제주 곳곳에 흩어진 천주교 성지와 순례지를 잇는다. 코스는 여섯 갈래다 — 김대건길(고산성당·용수성지·신창성당), 하논성당길(서귀포성당·하논성지·면형의 집·서귀복자성당), 김기량길(조천성당·김기량순교기념관), 정난주길(대정성지·모슬포성당), 신축화해길(황사평성지·화북성당·중앙주교좌성당), 이시돌길(성 이시돌센터·클라라수녀원·조수공소·청수공소). 코스마다 스탬프가 있어 모두 찍으면 완주 인증서를 신청할 수 있다(문의 mail@santoviaggio.com). 제주 올레길과 일부 구간이 겹친다.'
where name like '산토비아조%';

update public.holy_site_translations t set history = v.history
from (values
  ('en', 'A walking pilgrimage of the Jeju diocese inspired by the Camino de Santiago, linking Catholic holy sites across the island. There are six routes: Kim Dae-geon Trail (Gosan Church, Yongsu Holy Site, Sinchang Church), Hanon Church Trail (Seogwipo Church, Hanon site, Myeonhyeong House, Seogwi Bokja Church), Kim Gi-ryang Trail (Jocheon Church, Kim Gi-ryang Martyrdom Memorial), Jeong Nan-ju Trail (Daejeong Holy Site, Moseulpo Church), Sinchuk Reconciliation Trail (Hwangsapyeong, Hwabuk Church, Jungang Cathedral) and Isidore Trail (St Isidore Center, Clare convent, Josu and Cheongsu chapels). Each route has stamps; collect them all to apply for a completion certificate (mail@santoviaggio.com). Parts overlap with the Jeju Olle trails.'),
  ('es', 'Peregrinación a pie de la diócesis de Jeju inspirada en el Camino de Santiago, que une los lugares santos católicos de la isla. Tiene seis rutas: Camino de Kim Dae-geon (iglesia de Gosan, santuario de Yongsu, iglesia de Sinchang), Camino de la iglesia de Hanon (iglesia de Seogwipo, lugar de Hanon, Casa Myeonhyeong, iglesia Seogwi Bokja), Camino de Kim Gi-ryang (iglesia de Jocheon, memorial del mártir Kim Gi-ryang), Camino de Jeong Nan-ju (santuario de Daejeong, iglesia de Moseulpo), Camino de la reconciliación de Sinchuk (Hwangsapyeong, iglesia de Hwabuk, catedral de Jungang) y Camino de Isidro (Centro San Isidro, convento de clarisas, capillas de Josu y Cheongsu). Cada ruta tiene sellos; con todos se solicita el certificado (mail@santoviaggio.com). Algunos tramos coinciden con los senderos Olle.'),
  ('fr', 'Pèlerinage à pied du diocèse de Jeju inspiré du chemin de Compostelle, reliant les lieux saints catholiques de l’île. Six itinéraires : chemin de Kim Dae-geon (église de Gosan, sanctuaire de Yongsu, église de Sinchang), chemin de l’église de Hanon (église de Seogwipo, site de Hanon, maison Myeonhyeong, église Seogwi Bokja), chemin de Kim Gi-ryang (église de Jocheon, mémorial du martyr Kim Gi-ryang), chemin de Jeong Nan-ju (sanctuaire de Daejeong, église de Moseulpo), chemin de la réconciliation de Sinchuk (Hwangsapyeong, église de Hwabuk, cathédrale de Jungang) et chemin d’Isidore (centre Saint-Isidore, couvent des clarisses, chapelles de Josu et Cheongsu). Chaque itinéraire a ses tampons ; avec tous, on demande le certificat (mail@santoviaggio.com). Certaines portions suivent les sentiers Olle.'),
  ('pt', 'Peregrinação a pé da diocese de Jeju inspirada no Caminho de Santiago, que liga os lugares santos católicos da ilha. Tem seis rotas: Caminho de Kim Dae-geon (igreja de Gosan, santuário de Yongsu, igreja de Sinchang), Caminho da igreja de Hanon (igreja de Seogwipo, local de Hanon, Casa Myeonhyeong, igreja Seogwi Bokja), Caminho de Kim Gi-ryang (igreja de Jocheon, memorial do mártir Kim Gi-ryang), Caminho de Jeong Nan-ju (santuário de Daejeong, igreja de Moseulpo), Caminho da reconciliação de Sinchuk (Hwangsapyeong, igreja de Hwabuk, catedral de Jungang) e Caminho de Isidoro (Centro Santo Isidoro, convento das clarissas, capelas de Josu e Cheongsu). Cada rota tem carimbos; com todos pede-se o certificado (mail@santoviaggio.com). Alguns troços coincidem com os trilhos Olle.'),
  ('it', 'Pellegrinaggio a piedi della diocesi di Jeju ispirato al Cammino di Santiago, che collega i luoghi santi cattolici dell’isola. Sei percorsi: Cammino di Kim Dae-geon (chiesa di Gosan, santuario di Yongsu, chiesa di Sinchang), Cammino della chiesa di Hanon (chiesa di Seogwipo, luogo di Hanon, Casa Myeonhyeong, chiesa Seogwi Bokja), Cammino di Kim Gi-ryang (chiesa di Jocheon, memoriale del martire Kim Gi-ryang), Cammino di Jeong Nan-ju (santuario di Daejeong, chiesa di Moseulpo), Cammino della riconciliazione di Sinchuk (Hwangsapyeong, chiesa di Hwabuk, cattedrale di Jungang) e Cammino di Isidoro (Centro Sant’Isidoro, monastero delle clarisse, cappelle di Josu e Cheongsu). Ogni percorso ha i suoi timbri; raccogliendoli tutti si chiede l’attestato (mail@santoviaggio.com). Alcuni tratti coincidono con i sentieri Olle.')
) as v(language, history)
where t.language = v.language and t.site_id = (select id from public.holy_sites where name like '산토비아조%');

insert into public.site_sources (site_id, kind, title, url, collected_at, collected_by, note)
select s.id, 'web', '천주교제주순례길(산토비아조) 홈페이지', 'http://santoviaggio.com/', date '2026-11-02', 'claude', '코스 6개·스탬프 장소·완주 인증서 신청 방법'
from public.holy_sites s
where s.name like '산토비아조%'
  and not exists (select 1 from public.site_sources x where x.site_id = s.id and x.url = 'http://santoviaggio.com/');

commit;

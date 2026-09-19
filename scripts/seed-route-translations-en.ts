/**
 * 순례 코스(pilgrimage_routes) · 경유지 메모(pilgrimage_route_sites.note)의
 * 영어 번역을 채운다. 지금은 영어만 — ENABLED_LANGUAGES 가 ko/en 뿐이라
 * 나머지 언어는 나중에 검수가 끝나면 같은 방식으로 추가한다.
 *
 *   npx tsx scripts/seed-route-translations-en.ts
 *
 * 경유지 메모는 순서(position)로 맞춘다 — pilgrimage_route_sites 에 자체 id가
 * 없어 (route_id, position) 로 site_id 를 찾아 번역을 붙인다.
 */
import { loadEnvLocal } from './lib/env.ts';
loadEnvLocal();
import { connectAdminDb } from './lib/db.ts';

interface RouteTranslation {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  /** position 순서대로. 원문에 note 가 없는 자리는 null. */
  stopNotes: (string | null)[];
}

const ROUTES: RouteTranslation[] = [
  {
    slug: 'naepo-walk',
    title: 'Naepo, the Seedbed of Faith',
    subtitle: 'From Yeosaul to Gongseri — the fields where the Korean Church grew',
    description:
      "Naepo, in the northwest of Chungcheong province, is the ground where Korean Catholicism first took root. The route begins at Yeosaul Shrine, hometown of Yi Jon-chang, who returned baptized in 1784, and continues through Solmoe Shrine, birthplace of Fr. Kim Dae-geon, Silli Shrine, seat of the fifth apostolic vicariate of Joseon, and on to Hapdeok Church and Gongseri Shrine Church, symbols of the Church's rebuilding — linking the shrines that the Diocese of Daejeon marks as a walkable pilgrimage stretch.",
    stopNotes: [
      'Hometown of Yi Jon-chang, the "Apostle of Naepo" — the seedbed of faith',
      'Birthplace of Fr. Kim Dae-geon, from a family of four martyrs',
      "Chungcheong's first parish — the heart of the Church's rebuilding",
      "Bishop Daveluy's fifth apostolic vicariate of Joseon",
      'Site of a Catholic village never fully restored',
      "Chungcheong's first parish, built on the old Gongse grain depot site",
    ],
  },
  {
    slug: 'naepo-walk-solmoe-haemi',
    title: 'Naepo Walking Pilgrimage ① Solmoe to Haemi',
    subtitle: "40.0km · 9–10 hrs — on foot from Fr. Kim Dae-geon's birthplace to the Haemi martyrs' site",
    description:
      'The main route of the "Naepo Walking Pilgrimage Guide" published by Solmoe Shrine. Starting from Solmoe, birthplace of St. Andrew Kim Dae-geon, it passes Hapdeok Church (4.0km), Bishop Daveluy\'s Silli Shrine (4.0km), Baenadeuri Shrine (8.4km), and Deoksan Martyrdom Shrine (5.6km) before reaching Haemi Martyrdom Shrine (18.0km). Well suited to walking the Naepo fields over two days; distances and times are the guide\'s measured values.',
    stopNotes: [
      'Start — birthplace of St. Andrew Kim Dae-geon',
      '4.0km · 1 hr',
      "4.0km · 1 hr — Bishop Daveluy's vicariate seat",
      '8.4km · 2 hrs',
      '5.6km · 1 hr 30 min',
      '18.0km · 5–6 hrs — Arrival',
    ],
  },
  {
    slug: 'naepo-walk-solmoe-hongju',
    title: 'Naepo Walking Pilgrimage ② Solmoe to Hongju Eupseong',
    subtitle: '29.4km · 7–8 hrs — via Hwangmusil and Deoksan to Hongju',
    description:
      'From Solmoe Shrine through the former Hwangmusil Catholic village (6.0km), past Godeok (6.0km) and Deoksan Martyrdom Shrine (5.4km), to the Hongju Martyrdom Shrine at the old Hongju Eupseong walls (12.0km). Walk it in one long day, or rest overnight at Deoksan. Godeok is a waypoint village, not a listed shrine, so the course screen links Deoksan directly.',
    stopNotes: [
      'Start',
      '6.0km · 1 hr 30 min',
      '5.4km via Godeok (6.0km) — 3 hrs combined',
      '12.0km · 3 hrs — Arrival',
    ],
  },
  {
    slug: 'naepo-walk-hongju-darakgol',
    title: 'Naepo Walking Pilgrimage ③ Hongju Eupseong to Galmaemot and Darakgol',
    subtitle: "55.5km · 13–15 hrs — a 2-night, 3-day link between the southern martyrs' sites",
    description:
      'From Hongju Eupseong down to the seaside Galmaemot Martyrdom Shrine (30.0km), then up to the row graves of Darakgol Shrine in Cheongyang (25.5km). A long route joining three Byeongin-persecution martyrs\' sites, best split over two nights and three days. In the spirit of the guide\'s "mindset at the shrine" — walk in prayer, in reflection on one\'s own life, and in meditation on the martyrs\' lives.',
    stopNotes: ['Start', "30.0km · 7–8 hrs — seaside martyrs' site", '25.5km · 6–7 hrs — the row graves, arrival'],
  },
  {
    slug: 'naepo-walk-gongseri-yeosaul',
    title: 'Naepo Walking Pilgrimage ④ Gongseri to Yeosaul',
    subtitle: '31.0km · 8 hrs 30 min — from Asan Bay to the seedbed of Naepo faith',
    description:
      'From Gongseri Shrine Church in Asan down to Solmoe Shrine (21.0km), then via Hapdeok Church (4.0km) to Yeosaul Shrine (6.0km), hometown of Yi Jon-chang, the "Apostle of Naepo." Passing through Sinpyeong Church splits the walk into Gongseri→Sinpyeong (13.5km) and Sinpyeong→Solmoe (9.0km) — Sinpyeong Church is not a listed shrine, so it appears only as a waypoint.',
    stopNotes: [
      'Start — a church on the hill above Asan Bay',
      '21.0km · 5 hrs (13.5km + 9.0km via Sinpyeong Church)',
      '4.0km · 1 hr',
      '6.0km · 1 hr 30 min — Arrival',
    ],
  },
  {
    slug: 'hwang-seokdu',
    title: 'The Way of St. Luke Hwang Seok-du',
    subtitle: "From Yeonpung to Galmaemot — walking a lay leader's life",
    description:
      "The life of St. Luke Hwang Seok-du, who would not renounce his faith even before the executioner's blade, walked in order. It begins at his hometown Yeonpung, continues to Sanmakgol, where he lived six years with his family, to Silli Shrine, where he turned himself in alongside Bishop Daveluy, to the shores of Galmaemot, where he was martyred on Good Friday, and finally to Sapti Shrine, where his adopted son and nephew laid his body to rest.",
    stopNotes: [
      'Hometown — site of his conversion before the blade, now his grave',
      'The Catholic village where he lived six years with his family',
      '"I too will bear witness" — where he turned himself in',
      'The shore where five martyrs died on Good Friday, 1866',
      'Where his adopted son Hwang Cheon-il and nephew Hwang Gi-won laid his body to rest',
    ],
  },
  {
    slug: 'seoul-1-word',
    title: 'Seoul Camino Route 1 — The Way of the Word',
    subtitle: 'Myeongdong to Gahoe-dong, 8.7km · 3 hrs 40 min — walking the beginning of Korean Catholicism',
    description:
      'The first course of the "Catholic Pilgrimage Route of Seoul," the international pilgrimage site the Holy See approved in September 2018 — the first of its kind in Asia. It begins at the former home of Thomas Kim Beom-u, recorded as Korea\'s first confessor of the faith, and the birthplace of the Catholic Church in Korea at Yi Byeok\'s house, where the first baptism took place in 1785, retracing the resolve of a lay community that embraced the Gospel on its own. Along the way it passes Seokjeong Boreum Well, said to have been used for holy water by Fr. Zhou Wenmo, the first foreign missionary of the Korean Church, and Gahoe-dong Catholic Church in the Gyedong area where he was active — an invitation to reflect on the sacrifice of a man who chose martyrdom far from home. (Based on the Archdiocese of Seoul\'s pilgrimage route guidebook.)',
    stopNotes: [
      "Start — the heart of Korean Catholicism; martyrs' relics rest in the crypt",
      "The first gathering of faith in 1784; Korea's first confessor",
      "Yi Byeok's house — where the first baptism took place in 1785",
      'Where martyrs were interrogated',
      "Memorial hall on the site of the police bureau's prison",
      "The gate through which bodies were carried outside the city walls — a martyrs' memorial hall",
      'The birthplace of priestly formation in the Korean Church',
      'The well said to have been used for holy water by Fr. Zhou Wenmo',
      'Arrival — the Gyedong area where Fr. Zhou Wenmo offered the first Mass',
    ],
  },
  {
    slug: 'kim-daegeon',
    title: 'The Way of Fr. Kim Dae-geon (Chungcheong Section)',
    subtitle: "From Solmoe to Surichigol — the first priest's birth and return home",
    description:
      "The Chungcheong journey of St. Andrew Kim Dae-geon, Korea's first priest. It runs from Solmoe Shrine, his birthplace, to Haemi Martyrdom Shrine, where his great-grandfather Kim Jin-hu Pius was martyred, to Ganggyeong Church, where he offered his first Mass after returning home as a priest, and on to Surichigol Marian Shrine, where Bishop Ferréol and Fr. Daveluy took refuge after his arrest and founded the Society of the Sacred Heart of Mary.",
    stopNotes: [
      'Born 1821 — his birth home in a pine grove',
      'Martyrdom site of his great-grandfather Kim Jin-hu Pius',
      'The port where he offered his first Mass after returning home in 1845',
      'Where the two missionaries took refuge after his arrest and founded the Society of the Sacred Heart of Mary',
    ],
  },
  {
    slug: 'seoul-2-life',
    title: 'Seoul Camino Route 2 — The Way of Life',
    subtitle: 'Gahoe-dong to Yakhyeon, 5.9km · 2 hrs 30 min — through the sites of persecution toward eternal life',
    description:
      'The Joseon dynasty branded Catholicism, which placed God\'s word above the king\'s command, a heterodox teaching and carried out repeated persecutions. The "Way of Life" holds that history — passing Seosomun Martyrdom Shrine, where more believers were beheaded than at any other site, and the sites of the Hyeongjo (Ministry of Justice), the Right Police Bureau, and the Gyeonggi Provincial Office, where arrested Catholics were tortured and martyred. It is named the "Way of Life" because it was both the road to martyrdom and the road to eternal life. Walking over sites whose forms no longer survive, it invites reflection on what the martyrs valued above their own lives. (Based on the Archdiocese of Seoul\'s pilgrimage route guidebook.)',
    stopNotes: [
      'Start',
      "Pope Francis's beatification Mass, August 16, 2014",
      'Where arrested believers were interrogated',
      'The office that tried grave offenders — where martyrs were judged',
      'Where believers died in custody',
      'A place of torture and death in prison',
      'Where martyrs were interrogated',
      'Where the largest number of believers were beheaded — now a history museum',
      "Arrival — Korea's first Western-style church, overlooking the Seosomun martyrdom site",
    ],
  },
  {
    slug: 'seoul-3-unity',
    title: 'Seoul Camino Route 3 — The Way of Unity',
    subtitle: 'Yakhyeon to Samseongsan, 29.5km · 8 hrs — martyrs\' shrines linked along the Han River',
    description:
      'This route linking Seoul\'s foremost martyrs\' shrines is named the "Way of Unity" for its purpose — that believers might follow the martyrs\' faith and live out God\'s will. It passes Danggogae Martyrdom Shrine, which produced Korea\'s third-largest number of canonized martyrs, and Saenamteo, where the first foreign missionary Fr. Jacques Zhou Wenmo and Korea\'s first priest St. Andrew Kim Dae-geon were martyred, before meeting the Han River. Following the riverbank it reaches Jeoldusan, "the hill where Catholics were beheaded" — the relics of 27 canonized martyrs and one unnamed martyr rest in the crypt of its memorial church — then passes Waegogae, where ten martyrs lay buried for decades, on to Samseongsan. Along the way it asks what it looks like to live out the martyrs\' faith. (Based on the Archdiocese of Seoul\'s pilgrimage route guidebook.)',
    stopNotes: [
      'Start',
      "9 canonized martyrs — Korea's third-largest number of saints",
      'Martyrdom site of Fr. Zhou Wenmo and St. Andrew Kim Dae-geon',
      'Relics of 27 canonized martyrs rest in the crypt',
      "The hill where martyrs' bodies were temporarily buried",
      "Korea's first seminary — open Saturdays and Sundays only",
      'Where ten martyrs lay buried for decades',
      'Arrival — burial site of three missionaries martyred in the Gihae persecution',
    ],
  },
  {
    slug: 'choi-yangeop',
    title: 'The Way of Venerable Fr. Choi Yang-eop',
    subtitle: 'From Darakgol to Baeron — praying for the beatification of the Sweat-Stained Martyr',
    description:
      'This route follows the life of Venerable Fr. Thomas Choi Yang-eop (1821–1861), Korea\'s second priest. Born at Saeteo in Darakgol, Cheongyang, he grew up in the Catholic village of Jinsan and, in 1836, was chosen as one of Korea\'s first seminarians and sent abroad to study. During that time, the Gihae persecution (1839) claimed his father, St. Francis Choi Kyung-hwan, martyred at Surisan, and his mother, Maria Yi Seong-nye, martyred at Danggogae. Ordained a priest in 1849 and returning home, he spent twelve years walking thousands of ri every year to reach Catholic villages across the country — earning the name "the Sweat-Stained Martyr" — before dying at Jinan-ri, Mungyeong, on June 15, 1861, and being buried at Baeron. Pope Francis declared him Venerable in April 2016, and this pilgrimage route prays for his beatification and canonization. (Links the sites, among the 30 listed in the pilgrimage passport booklet, that are in the app\'s shrine data.)',
    stopNotes: [
      'Born March 1, 1821 at Saeteo — the row graves',
      'The Catholic village where his family lived, 1828–1835',
      'Martyrdom (died in prison, September 12, 1839) and grave of his father, St. Francis Choi Kyung-hwan',
      'The Catholic village where his family took refuge',
      "Martyrdom of his mother, Maria Yi Seong-nye (January 31, 1840)",
      'The church commemorating the Seosomun martyrdom site',
      'Where the relics of his parents and other martyrs rest',
      'His father Choi Kyung-hwan was canonized in 1984',
      '2014 beatification Mass — Fr. Choi Yang-eop still awaits his own beatification as Venerable',
      'A Catholic village he visited on his circuit ministry',
      'His first base of ministry after returning home in 1849',
      "Seminary of the Apostolic Vicariate of Joseon and center of Fr. Choi's ministry",
      'The Chungcheong Catholic village where he began his ministry after returning home',
      'An area of his circuit ministry — a Gongju martyrdom site',
      'A Catholic village on his circuit ministry',
      'A Catholic village on his circuit ministry',
      'A Gangwon Catholic village he visited on his circuit ministry',
      'A Catholic village where believers took refuge during the Gyeongsin persecution (1860)',
      '1.5km on foot from Jinan-ri — walked together with it',
      'Where he died on June 15, 1861',
      'His grave — the site where his beatification and canonization are prayed for',
    ],
  },
];

const client = await connectAdminDb();

try {
  let routeCount = 0;
  let noteCount = 0;

  for (const r of ROUTES) {
    const { rows } = await client.query<{ id: string }>(
      'select id from public.pilgrimage_routes where slug = $1',
      [r.slug],
    );
    const route = rows[0];
    if (!route) {
      console.warn(`건너뜀 — 코스를 못 찾음: ${r.slug}`);
      continue;
    }

    await client.query(
      `insert into public.pilgrimage_route_translations (route_id, language, title, subtitle, description, translation_status)
       values ($1, 'en', $2, $3, $4, 'machine')
       on conflict (route_id, language) do update set
         title = excluded.title,
         subtitle = excluded.subtitle,
         description = excluded.description,
         translation_status = excluded.translation_status,
         updated_at = now()`,
      [route.id, r.title, r.subtitle, r.description],
    );
    routeCount++;

    const { rows: stops } = await client.query<{ position: number; site_id: string }>(
      'select position, site_id from public.pilgrimage_route_sites where route_id = $1 order by position',
      [route.id],
    );

    if (stops.length !== r.stopNotes.length) {
      console.warn(
        `⚠️  ${r.slug}: 경유지 수(${stops.length})와 번역 메모 수(${r.stopNotes.length})가 다릅니다 — 건너뜀`,
      );
      continue;
    }

    for (const stop of stops) {
      const note = r.stopNotes[stop.position - 1];
      if (!note) continue;
      await client.query(
        `insert into public.pilgrimage_route_site_translations (route_id, site_id, language, note, translation_status)
         values ($1, $2, 'en', $3, 'machine')
         on conflict (route_id, site_id, language) do update set
           note = excluded.note,
           translation_status = excluded.translation_status,
           updated_at = now()`,
        [route.id, stop.site_id, note],
      );
      noteCount++;
    }

    console.log(`  ${r.slug} — 제목·부제·설명 1 + 메모 ${stops.length}`);
  }

  console.log(`\n완료 — 코스 ${routeCount}개, 경유지 메모 ${noteCount}개.\n`);
} finally {
  await client.end();
}

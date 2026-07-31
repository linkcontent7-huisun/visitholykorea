export type EmotionTag = '위로' | '새출발' | '평온' | '치유' | '감사';

export const EMOTION_TAGS: EmotionTag[] = ['위로', '새출발', '평온', '치유', '감사'];

export interface HolySite {
  id: string;
  name: string;
  category: '순교성지' | '역사사적지' | '주교좌성당' | '순례길' | string;
  location: string;
  description: string | null;
  imageUrl: string | null;
  history: string | null;
  coordinates: {
    lat: number | null;
    lng: number | null;
  };
  region: string; // Diocese (교구)
  emotionTag: EmotionTag | null;
  seoTitle: string | null;
  seoDescription: string | null;
  nearbyAttractions: string | null;
  nearbyLodging: string | null;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export interface PilgrimageLog {
  id: string;
  user_id: string;
  site_id: string;
  title: string;
  content: string;
  visit_date: string;
  site_name?: string;
  site_image?: string;
}

export type TabType = 'home' | 'map' | 'explore' | 'record' | 'menu';

export const DIOCESES = [
  '서울', '수원', '인천', '의정부', '춘천', '원주',
  '대전', '청주', '전주', '광주', '대구', '안동', '부산', '마산', '제주'
];

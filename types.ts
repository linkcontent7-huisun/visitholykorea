
export enum SiteCategory {
  CATHEDRAL = '주교좌성당/성당',
  MARTYRDOM = '순교성지',
  HISTORICAL = '역사사적지',
  PILGRIMAGE_ROUTE = '순례길'
}

export interface HolySite {
  id: string;
  name: string;
  category: SiteCategory;
  location: string;
  description: string;
  imageUrl: string;
  history: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface GroundingChunk {
  maps?: {
    uri: string;
    title: string;
  };
  web?: {
    uri: string;
    title: string;
  };
}

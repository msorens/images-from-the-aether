// Used http://www.jsontots.com/ to convert a JSON example to interface definitions below.
// Notes:
// 1. The response object described at https://www.pexels.com/api/documentation/#photos-search
//    is incomplete. It is missing the prev_page property.
//    Instead grabbed actual output from the browser to generate the schema here.
// 2. Renamed the canned RootObject to the more meaningful PageResponse.

export interface PageResponse {
  page: number;
  per_page: number;
  photos: Photo[];
  total_results: number;
  next_page: string;
  prev_page: string;
}

export interface Photo {
  refIndex: number;
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: Src;
  liked: boolean;
}

export interface Src {
  original: string;
  large2x: string;
  large: string;
  medium: string;
  small: string;
  portrait: string;
  landscape: string;
  tiny: string;
}

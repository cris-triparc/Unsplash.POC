export interface UnsplashUser {
  name: string;
  username: string;
  links: {
    html: string;
  };
}

export interface UnsplashPhoto {
  id: string;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
    small_s3: string;
  };
  links: {
    html: string;
    download: string;
    download_location: string;
  };
  user: UnsplashUser;
}

export interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

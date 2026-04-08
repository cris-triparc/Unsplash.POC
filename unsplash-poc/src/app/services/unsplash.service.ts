import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UnsplashPhoto, UnsplashSearchResponse } from '../models/unsplash';

@Injectable({
  providedIn: 'root'
})
export class UnsplashService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api';

  searchPhotos(query: string, page = 1, perPage = 12): Observable<UnsplashSearchResponse> {
    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<UnsplashSearchResponse>(`${this.baseUrl}/search/photos`, { params });
  }

  getPhotoDetails(id: string): Observable<UnsplashPhoto> {
    return this.http.get<UnsplashPhoto>(`${this.baseUrl}/photos/${id}`);
  }

  trackDownload(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/photos/${id}/download`, {});
  }
}

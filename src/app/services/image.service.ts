import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { PageResponse } from 'src/app/models/Photo';
import { KeyService } from './key.service';

@Injectable({
  providedIn: 'root',
})
export class ImageService implements IImageService {
  constructor(
    private readonly http: HttpClient,
    private keyStore: KeyService
  ) { }

  private url = 'https://api.pexels.com/v1/search';

  testPage(apiKey: string): Observable<PageResponse> {
    return this.fetch(apiKey, 'cat', 10, 1);
  }

  loadPage(pageId: number, itemsPerPage: number, searchString: string): Observable<PageResponse> {

    const apiKey = this.keyStore.get();
    if (!apiKey) {
      // UI safeguard against empty key should make this line unreachable
      return throwError(new Error('no api key loaded!'));
    }
    return this.fetch(apiKey, searchString, itemsPerPage, pageId);
  }

  private fetch(apiKey: string, searchString: string, itemsPerPage: number, pageId: number): Observable<PageResponse> {
    return this.http.get<PageResponse>(this.url, {
      headers: {
        Authorization: apiKey
      },
      params: {
        query: searchString,
        per_page: String(itemsPerPage),
        page: String(pageId)
      }
    });
  }
}

export interface IImageService {
  loadPage(pageId: number, itemsPerPage: number, searchString: string): Observable<PageResponse>;
  testPage(apiKey: string): Observable<PageResponse>;
}

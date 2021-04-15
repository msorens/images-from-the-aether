import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/Giphy';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  loadPage(pageId: number, searchString: string): Observable<PageResponse> {

    const url = 'https://api.giphy.com/v1/gifs/search';
    const apiKey = 'dc6zaTOxFJmzC';
    const itemsPerPage = 30;
    return this.http.get<PageResponse>(url, {
      params: {
        api_key: apiKey,
        q: searchString,
        limit: String(itemsPerPage),
        offset: String(pageId)
      }
    });
  }
}

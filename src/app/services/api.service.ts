import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/Post';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  loadPage(pageId: number, searchString: string): Observable<PageResponse> {

    const url = 'https://api.pexels.com/v1/search';
    const apiKey = 'FILL THIS IN';
    const itemsPerPage = 16;
    return this.http.get<PageResponse>(url, {
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

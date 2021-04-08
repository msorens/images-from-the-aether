import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '../models/Post';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  loadPage(pageId: number): Observable<Post[]> {

    const url = `https://5cafa607f7850e0014629525.mockapi.io/products`;
    const limit = 8;
    return this.http.get<Post[]>(url, {
      params: {
        page: String(pageId),
        limit: String(limit),
      }
    });
  }
}

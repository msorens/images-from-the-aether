import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer } from 'rxjs';
import { Store } from '@ngxs/store';
import { PageResponse } from '../models/Post';
import { delayWhen, retryWhen, shareReplay, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  loadPage(pageId: number, itemsPerPage: number, searchString: string): Observable<PageResponse> {

    const url = 'https://api.pexels.com/v1/search';
    const apiKey = 'FILL THIS IN';
    return this.http.get<PageResponse>(url, {
        headers: {
          Authorization: apiKey
        },
        params: {
          query: searchString,
          per_page: String(itemsPerPage),
          page: String(pageId)
        }
      })
      // cf https://blog.angular-university.io/rxjs-error-handling/
      .pipe(
        shareReplay(),
        retryWhen((errors) => {
          return errors.pipe(
            delayWhen(() => timer(2000)),
            tap(() => console.log('retrying...'))
          );
        })
      );
  }
}

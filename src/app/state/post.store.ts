import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { Photo } from '../models/Post';

import { ApiService } from '../services/api.service';
import { FetchPosts } from './post.actions';

export interface PostStateModel {
  posts: Photo[];
  loading: boolean;
  itemsPerPage: number;
}

@State<PostStateModel>({
  name: 'posts',
  defaults: {
    posts: [],
    loading: true,
    itemsPerPage: 20
  },
})
@Injectable()
export class PostState {
  constructor(private http: HttpClient, private readonly api: ApiService) {}

  @Selector()
  public static loading(state: PostStateModel): boolean {
    return state.loading;
  }

  @Selector()
  public static posts(state: PostStateModel): Photo[] {
    return state.posts;
  }

  @Action(FetchPosts)
  getPosts(
    { getState, patchState }: StateContext<PostStateModel>,
    { pageId, searchString }: FetchPosts
  ): void {
    const itemsPerPage = getState().itemsPerPage;
    this.api.loadPage(pageId, itemsPerPage, searchString)
      .subscribe((response) => {
      console.log(
        `Received ${response.photos.length} photos on page ${response.page} (${response.total_results} total)`
      );
      // Add local display indices before storing data
      for (let i = 0; i < response.photos.length; i++) {
        response.photos[i].refIndex = (pageId - 1) * itemsPerPage + i + 1;
      }
      patchState({
        posts: response.photos,
        loading: false,
      });
      },
      (errResponse: HttpErrorResponse) => {
        console.log(errResponse.message);
      }
    );
  }
}

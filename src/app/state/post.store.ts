import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { Photo } from '../models/Giphy';

import { ApiService } from '../services/api.service';
import { FetchPosts } from './post.actions';

export interface PostStateModel {
  posts: Photo[];
  loading: boolean;
}

@State<PostStateModel>({
  name: 'posts',
  defaults: {
    posts: [],
    loading: true,
  },
})
@Injectable()
export class PostState {
  constructor(private http: HttpClient, private readonly api: ApiService) {}

  @Selector()
  public static loading(state: PostStateModel) {
    return state.loading;
  }

  @Selector()
  public static posts(state: PostStateModel) {
    return state.posts;
  }

  @Action(FetchPosts)
  getPosts(
    { getState, patchState }: StateContext<PostStateModel>,
    { pageId, searchString }: FetchPosts
  ) {
    const state = getState();
    this.api.loadPage(pageId, searchString).subscribe((response) => {
      console.log(
        `Received ${response.pagination.count} photos on page ${response.pagination.offset} (${response.pagination.total_count} total)`
      );
      // Add local indices before storing data
      for (let i = 0; i < response.data.length; i++) {
        response.data[i].refIndex = (pageId - 1) * 30 + i;
      }
      patchState({
        posts: response.data,
        loading: false,
      });
      },
      (errResponse: HttpErrorResponse) => {
        console.log(errResponse.message);
      }
    );
  }
}

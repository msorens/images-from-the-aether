import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { Photo } from '../models/Post';

import { ApiService } from '../services/api.service';
import { FetchPosts, SetSearchString } from './post.actions';

export interface PostStateModel {
  searchString: string;
  posts: Photo[];
  loading: boolean;
  currentPage: number;
  itemsPerPage: number;
}

@State<PostStateModel>({
  name: 'posts',
  defaults: {
    searchString: '',
    posts: [],
    loading: true,
    currentPage: 0,
    itemsPerPage: 20
  },
})
@Injectable()
export class PostState {
  constructor(private http: HttpClient, private readonly api: ApiService) {}

  @Selector()
  public static searchString(state: PostStateModel): string {
    return state.searchString;
  }

  @Selector()
  public static loading(state: PostStateModel): boolean {
    return state.loading;
  }

  @Selector()
  public static posts(state: PostStateModel): Photo[] {
    return state.posts;
  }

  @Action(SetSearchString)
  setSearchString(
    { patchState }: StateContext<PostStateModel>,
    { searchString }: SetSearchString
  ): void {
      patchState({
        searchString,
        currentPage: 0,
        posts: []
      });
  }

  @Action(FetchPosts)
  getPosts(
    { getState, patchState }: StateContext<PostStateModel>
  ): void {
    const state = getState();
    const [itemsPerPage, currentPage] = [state.itemsPerPage, ++state.currentPage];
    patchState({ currentPage });

    // page index is 1-based not 0-based here
    this.api.loadPage(currentPage, itemsPerPage, state.searchString)
      .subscribe((response) => {
      console.log(
        `Received ${response.photos.length} photos on page ${response.page} (${response.total_results} total)`
      );
      // Add local display indices before storing data
      for (let i = 0; i < response.photos.length; i++) {
        response.photos[i].refIndex = (currentPage - 1) * itemsPerPage + i + 1;
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

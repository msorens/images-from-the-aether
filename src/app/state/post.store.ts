import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';

import { Post } from '../models/Post';
import { ApiService } from '../services/api.service';
import { FetchPosts } from './post.actions';

export interface PostStateModel {
  posts: Post[];
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
    let posts: Post[] = [];
    this.api.loadPage(pageId).subscribe((post) => {
      posts = post;

      console.log(`${posts[0].id}: ${posts[0].name}`);

      patchState({
        posts,
        loading: false,
      });
    });
  }
}

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';

import { Post } from '../models/Post';
import { FetchPosts } from './post.actions';

export interface PostStateModel {
  posts: Post[];
  loading: boolean;
}

@State<PostStateModel>({
  name: 'posts',
  defaults: {
    posts: [],
    loading: true
  }
})
@Injectable()
export class PostState {
  /**
   *
   */
  constructor(private http: HttpClient) { }

  @Selector()
  public static loading(state: PostStateModel) {
    return state.loading;
  }

  @Selector()
  public static posts(state: PostStateModel) {
    return state.posts;
  }

  @Action(FetchPosts)
  getPosts({ getState, patchState }: StateContext<PostStateModel>) {
    const state = getState();
    let posts: Post[] = [];
    const page = 1;
    const limit = 8;
    const url = `https://5cafa607f7850e0014629525.mockapi.io/products?page=${page}&limit=${limit}`;
    this.http.get<Post[]>(url).subscribe(post => {
      posts = post;

      console.log(`${posts[0].id}: ${posts[0].name}`);

      patchState({
        posts,
        loading: false
      });
    });
  }

}

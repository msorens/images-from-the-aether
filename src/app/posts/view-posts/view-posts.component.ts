import { Observable } from 'rxjs';

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Select, Store } from '@ngxs/store';

import { FetchPosts } from '../../state/post.actions';
import { PostState } from '../../state/post.store';
import { Photo } from 'src/app/models/Post';

@Component({
  selector: 'app-view-posts',
  templateUrl: './view-posts.component.html',
  styleUrls: ['./view-posts.component.scss']
})
export class ViewPostsComponent {

  constructor(private store: Store, private route: ActivatedRoute) { }

  @Select(PostState.loading) loading$: Observable<boolean>;
  @Select(PostState.posts) posts$: Observable<Photo[]>;

  // ngOnInit(): void {
  //   this.store.dispatch(new FetchPosts(2, 'cat'));
  // }

}

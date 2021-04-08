import { Observable } from 'rxjs';

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Select, Store } from '@ngxs/store';

import { Post } from '../../models/Post';
import { FetchPosts } from '../../state/post.actions';
import { PostState } from '../../state/post.store';

@Component({
  selector: 'app-view-posts',
  templateUrl: './view-posts.component.html',
  styleUrls: ['./view-posts.component.scss']
})
export class ViewPostsComponent implements OnInit {

  constructor(private store: Store, private route: ActivatedRoute) { }

  @Select(PostState.loading) loading$: Observable<boolean>;
  @Select(PostState.posts) posts$: Observable<Post[]>;

  ngOnInit(): void {
    this.store.dispatch(new FetchPosts(2, 'cat'));
  }

}

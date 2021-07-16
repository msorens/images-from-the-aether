
import { Component, NgZone, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { IPageInfo } from 'ngx-virtual-scroller';

import { PostState } from '../../state/post.store';
import { Photo } from 'src/app/models/Post';
import { FetchPosts } from 'src/app/state/post.actions';

@Component({
  selector: 'app-view-posts',
  templateUrl: './view-posts.component.html',
  styleUrls: ['./view-posts.component.scss'],
})
export class ViewPostsComponent implements OnInit {
  photos: Photo[] = [];
  title = 'Angular Infinite Scrolling List';
  loading = false;

  constructor(private store: Store, private ngZone: NgZone) {}

  @Select(PostState.loading) loading$: Observable<boolean>;
  @Select(PostState.posts) posts$: Observable<Photo[]>;
  @Select(PostState.searchString) searchString$: Observable<string>;

  ngOnInit(): void {
    this.posts$
      .pipe(filter(newPhotos => !!newPhotos))
      .subscribe(newPhotos => {
        this.loading = false;
        this.photos = this.photos.concat(newPhotos);
        console.log(`received ${newPhotos.length} new photos; total now ${this.photos.length}`);
      });
    this.searchString$
      .pipe( filter(searchString => !!searchString))
      .subscribe(() => {
        console.log('Dispatching from user search change...');
        this.fetchNext();
      });
  }

  fetchMore(event: IPageInfo): void {
    if (this.loading ||
      event.endIndex === -1 || // essentially suppress page load event with empty search
      event.endIndex !== this.photos.length - 1) { // wait until reaching the bottom
      return;
    }
    console.log(`Dispatching from event: ${event.endIndex}`);
    this.fetchNext();
  }

  private fetchNext(): void {
    this.loading = true;
    this.store.dispatch(new FetchPosts());
  }

}

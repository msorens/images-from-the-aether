
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
  loading = false;
  endOfInputReached = false;

  constructor(private store: Store, private ngZone: NgZone) {}

  @Select(PostState.loading) loading$: Observable<boolean>;
  @Select(PostState.endOfInputReached) endOfInputReached$: Observable<boolean>;
  @Select(PostState.posts) posts$: Observable<Photo[]>;
  @Select(PostState.searchString) searchString$: Observable<string>;

  ngOnInit(): void {
    this.posts$
      .pipe(filter(newPhotos => !!newPhotos))
      .subscribe(newPhotos => {
        this.photos = this.photos.concat(newPhotos);
      });

    this.searchString$
      .pipe( filter(searchString => !!searchString))
      .subscribe(() => {
        this.photos = []; // new search; clear display
        this.fetchNext();
      });

    this.loading$.subscribe(flag => { this.loading = flag; });

    this.endOfInputReached$.subscribe(flag => { this.endOfInputReached = flag; });
  }

  fetchMore(event: IPageInfo): void {
    if (this.loading ||
      this.endOfInputReached ||
      event.endIndex === -1 || // essentially suppress page load event with empty search
      event.endIndex !== this.photos.length - 1) { // wait until reaching the bottom
      return;
    }
    this.fetchNext();
  }

  private fetchNext(): void {
    this.store.dispatch(new FetchPosts());
  }

}


import { Component, NgZone, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { IPageInfo } from 'ngx-virtual-scroller';

import { PhotoState } from '../../state/photo.store';
import { Photo } from 'src/app/models/Post';
import { FetchPosts } from 'src/app/state/photo.actions';

@Component({
  selector: 'app-view-photos',
  templateUrl: './view-photos.component.html',
  styleUrls: ['./view-photos.component.scss'],
})
export class ViewPhotosComponent implements OnInit {
  photos: Photo[] = [];
  loading = false;
  endOfInputReached = false;

  constructor(private store: Store, private ngZone: NgZone) {}

  @Select(PhotoState.loading) loading$: Observable<boolean>;
  @Select(PhotoState.endOfInputReached) endOfInputReached$: Observable<boolean>;
  @Select(PhotoState.photos) posts$: Observable<Photo[]>;
  @Select(PhotoState.searchString) searchString$: Observable<string>;

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

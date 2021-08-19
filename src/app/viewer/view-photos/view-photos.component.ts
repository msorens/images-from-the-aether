
import { Component, EventEmitter, NgZone, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { IPageInfo } from 'ngx-virtual-scroller';

import { ExecutionState, PhotoState } from 'src/app/state/photo.store';
import { Photo } from 'src/app/models/Photo';
import { FetchPhotos } from 'src/app/state/photo.actions';

@Component({
  selector: 'app-view-photos',
  templateUrl: './view-photos.component.html',
  styleUrls: ['./view-photos.component.scss'],
})
export class ViewPhotosComponent implements OnInit {
  photos: Photo[] = [];
  fetchStatus = ExecutionState.Uninitialized;
  endOfInputReached = false;
  currentPhoto: Photo | null = null;
  detailModalVisibility = new EventEmitter<boolean>();
  searchString = '';

  ExecutionState = ExecutionState; // This peculiar statement exposes the enum in the template.

  constructor(private store: Store, private ngZone: NgZone) {}

  @Select(PhotoState.fetchStatus) fetchStatus$!: Observable<ExecutionState>;
  @Select(PhotoState.endOfInputReached) endOfInputReached$!: Observable<boolean>;
  @Select(PhotoState.photos) photos$!: Observable<Photo[]>;
  @Select(PhotoState.searchString) searchString$!: Observable<string>;

  ngOnInit(): void {
    this.photos$
      .pipe(filter((newPhotos) => !!newPhotos))
      .subscribe((newPhotos) => {
        this.photos = this.photos.concat(newPhotos);
      });

    this.searchString$
      .pipe(filter((searchString) => !!searchString))
      .subscribe((searchString) => {
        this.searchString = searchString;
        this.photos = []; // new search; clear display
        this.fetchNext();
      });

    this.fetchStatus$.subscribe((status) => {
      this.fetchStatus = status;
    });

    this.endOfInputReached$.subscribe((flag) => {
      this.endOfInputReached = flag;
    });
  }

  fetchMore(event: IPageInfo): void {
    if (
      this.fetchStatus === ExecutionState.Loading ||
      this.endOfInputReached ||
      event.endIndex === -1 || // essentially suppress page load event with empty search
      event.endIndex !== this.photos.length - 1 // wait until reaching the bottom of list
    ) {
      return;
    }
    this.fetchNext();
  }

  private fetchNext(): void {
    this.store.dispatch(new FetchPhotos());
  }

  showDetail(item: Photo): void {
    this.currentPhoto = item;
    this.detailModalVisibility.emit(true);
  }
}

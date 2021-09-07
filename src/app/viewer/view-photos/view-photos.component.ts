
import { Component, EventEmitter, NgZone, OnInit, OnDestroy } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { IPageInfo } from 'ngx-virtual-scroller';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { saveAs } from 'file-saver';

import { ApiResponse, ExecutionState, PhotoState } from 'src/app/state/photo.store';
import { Photo } from 'src/app/models/Photo';
import { FetchPhotos } from 'src/app/state/photo.actions';

@Component({
  selector: 'app-view-photos',
  templateUrl: './view-photos.component.html',
  styleUrls: ['./view-photos.component.scss'],
})
export class ViewPhotosComponent implements OnInit, OnDestroy {
  photos: Photo[] = [];
  fetchStatus = ExecutionState.Uninitialized;
  endOfInputReached = false;
  apiResponse: ApiResponse = { statusMsg: '', statusCode: 0 };
  currentPhoto: Photo | null = null;
  detailModalVisibility = new EventEmitter<boolean>();
  searchString = '';
  private isDestroyed = new Subject<boolean>();

  // These peculiar statements expose the entities in the template.
  ExecutionState = ExecutionState;
  StatusCodes = StatusCodes;

  constructor(private store: Store, private ngZone: NgZone) {}

  @Select(PhotoState.fetchStatus) fetchStatus$!: Observable<ExecutionState>;
  @Select(PhotoState.apiResponse) apiResponse$!: Observable<ApiResponse>;
  @Select(PhotoState.endOfInputReached) endOfInputReached$!: Observable<boolean>;
  @Select(PhotoState.photos) photos$!: Observable<Photo[]>;
  @Select(PhotoState.searchString) searchString$!: Observable<string>;

  ngOnInit(): void {
    this.photos$
      .pipe(
        filter((newPhotos) => !!newPhotos),
        takeUntil(this.isDestroyed)
      )
      .subscribe((newPhotos) => {
        this.photos = this.photos.concat(newPhotos);
      });

    this.searchString$
      .pipe(
        filter((searchString) => !!searchString),
        takeUntil(this.isDestroyed)
      )
      .subscribe((searchString) => {
        this.searchString = searchString;
        this.photos = []; // new search; clear display
        this.fetchNext();
      });

    this.fetchStatus$
      .pipe(takeUntil(this.isDestroyed))
      .subscribe((status) => {
      this.fetchStatus = status;
    });

    this.endOfInputReached$
      .pipe(takeUntil(this.isDestroyed))
      .subscribe((flag) => {
        this.endOfInputReached = flag;
      });

    this.apiResponse$
      .pipe(takeUntil(this.isDestroyed))
      .subscribe((response) => {
        this.apiResponse = response;
      });
  }

  ngOnDestroy(): void {
    this.isDestroyed.next(true);
    this.isDestroyed.complete();
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

  formatErrorInfo(): string {
    // There is technically no HTTP status code zero, but an incomplete or empty response would
    // still yield a status code of zero, so need to check for it.
    const resp = this.apiResponse;
    return resp.statusCode
      ? `[ ${resp.statusCode} ${getReasonPhrase(resp.statusCode)} ] ${resp.statusMsg}`
      : '[ empty response ]';
  }

  download(url: string): void {
    saveAs(url, this.getFileName(url));
  }

  getFileName(url: string): string {
    // URL class returns encoded values (e.g. `some image.jpg` would be returned as `some%20image.jpg`)
    // The decodeURIComponent() call decodes the encoded values for space and other specially handled characters.
    try {
      return decodeURIComponent(
        url
          ? new URL(url) // could throw exception for invalid values
            .pathname.split('/').pop()
            || '' // return empty string for any non-truthy path
          : ''); // return empty string for any non-truthy URL
    }
    catch {
      console.log(`invalid URL encountered: ${url}`);
      return '';
    }
  }
}

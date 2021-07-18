import { state } from '@angular/animations';
import { HttpClientModule } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxsModule, Select, Store } from '@ngxs/store';
import { Observable, of } from 'rxjs';

import { PostState, PostStateModel, STATE_NAME } from 'src/app/state/post.store';
import { PageResponse, Photo } from 'src/app/models/Post';
import { ApiService } from 'src/app/services/api.service';
import { FetchPosts, SetSearchString } from './post.actions';

describe('SetSearchString', () => {
  let store: Store;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        [NgxsModule.forRoot([PostState])],
      ],
      providers: [Store],
    }).compileComponents();
    store = TestBed.inject(Store);
  });

  it('puts search string into state', () => {
    expect(store.selectSnapshot(s => stateModel(s).searchString)).toBe('');

    store.dispatch(new SetSearchString('cat'));

    expect(store.selectSnapshot(s => stateModel(s).searchString)).toBe('cat');
  });

  it('resets page counter to zero', () => {
    const snapshot = store.snapshot();
    const ANY_NON_ZERO = 29;
    stateModel(snapshot).currentPage = ANY_NON_ZERO;
    store.reset(snapshot);
    expect(store.selectSnapshot(s => stateModel(s).currentPage)).toBe(ANY_NON_ZERO);

    store.dispatch(new SetSearchString('cat'));

    expect(store.selectSnapshot(s => stateModel(s).currentPage)).toBe(0);
  });

  it('resets photos to empty list', () => {
    const snapshot = store.snapshot();
    const ANY_NON_EMPTY_LIST: Photo[] = [{} as Photo, {} as Photo];
    stateModel(snapshot).posts = ANY_NON_EMPTY_LIST;
    store.reset(snapshot);
    expect(store.selectSnapshot(s => stateModel(s).posts)).toEqual(ANY_NON_EMPTY_LIST);

    store.dispatch(new SetSearchString('cat'));

    expect(store.selectSnapshot(s => stateModel(s).posts)).toEqual([]);
  });

});

describe('FetchPosts', () => {
  let store: Store;
  let initialState: PostStateModel;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule, [NgxsModule.forRoot([PostState])]],
      providers: [
        Store,
        { provide: ApiService, useClass: MockApiService }
      ],
    }).compileComponents();
    store = TestBed.inject(Store);

    initialState = genState();
    const snapshot = store.snapshot();
    snapshot[STATE_NAME] = { ...initialState };
    store.reset(snapshot);
  });

  it('increments page number', () => {
    expect(store.selectSnapshot(s => stateModel(s).currentPage)).toBe(initialState.currentPage);
    store.dispatch(new FetchPosts());
    expect(store.selectSnapshot(s => stateModel(s).currentPage)).toBe(initialState.currentPage + 1);
  });

  it('stores new photos in state', () => {
    expect(store.selectSnapshot(s => stateModel(s).posts.length)).toBe(STATE_PHOTO_COUNT);

    store.dispatch(new FetchPosts());

    const photos = store.selectSnapshot(s => stateModel(s).posts);
    expect(photos.length).toBe(RESPONSE_PHOTO_COUNT);
    // IDs in the response are offset by a constant amount from IDs in the initial state,
    // so a simple addition allows checking each item
    for (let i = 0; i < photos.length; i++) {
      expect(photos[i].id).toBe(initialState.posts[i].id + BASE_OFFSET);
    }
  });

  it('annotates photos with sequence number', () => {
    store.dispatch(new FetchPosts());

    const photos = store.selectSnapshot(s => stateModel(s).posts);
    for (let i = 0; i < photos.length; i++) {
      expect(photos[i].refIndex).toBe(initialState.currentPage * initialState.itemsPerPage + i + 1);
    }
  });

  it('indicates processing by setting loading to true then back to false', () => {
    const obsClass = new ObsClass();
    expect(obsClass.events.length).toBe(0);

    store.dispatch(new FetchPosts());

    expect(obsClass.events.length).toBe(2);
    expect(obsClass.events[0]).toBeTrue();
    expect(obsClass.events[1]).toBeFalse();
  });

});

class ObsClass {
  @Select(PostState.loading) loading$: Observable<boolean>;
  public events: boolean[] = [];
  private initializeEvent = true;

  constructor() {
    this.loading$.subscribe(flag => {
      if (!this.initializeEvent) {
        this.events.push(flag);
      }
      this.initializeEvent = false;
    });
  }
}

@Injectable()
export class MockApiService extends ApiService {

  public static endOfInput: boolean;

  loadPage(pageId: number, itemsPerPage: number, searchString: string): Observable<PageResponse> {
    return of(genResponse(MockApiService.endOfInput));
  }
}

function stateModel(snapshot: any): PostStateModel {
  return snapshot[STATE_NAME] as PostStateModel;
}

export function genPhotos(prefix: number, count: number): Photo[] {
  const photos: Photo[] = [];
  for (let i = 0; i < count; i++) {
    photos[i] = {
      id: prefix + i
    } as Photo;

  }
  return photos;
}

const STATE_BASE = 1000;
const RESPONSE_BASE = 5000;
const BASE_OFFSET = RESPONSE_BASE - STATE_BASE;
export const STATE_PHOTO_COUNT = 12;
export const RESPONSE_PHOTO_COUNT = 9;

export function genState(): PostStateModel {
  return {
    searchString: 'dog',
    posts: genPhotos(STATE_BASE, STATE_PHOTO_COUNT),
    loading: false,
    endOfInputReached: false,
    currentPage: 10,
    itemsPerPage: 20
  };
}

function genResponse(endOfInput?: boolean): PageResponse {
  return {
    page: 5,
    per_page: 20,
    photos: genPhotos(RESPONSE_BASE, RESPONSE_PHOTO_COUNT),
    total_results: 100,
    next_page: endOfInput ? null : 'any next page',
    prev_page: ''
  };
}


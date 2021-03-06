import { HttpClientModule } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { Observable, of, throwError } from 'rxjs';
import { StatusCodes } from 'http-status-codes';

import { setStoreSnapshot, StoreSnapshot } from 'src/app/utility/storeHelper';
import { PhotoState, PhotoStateModel, STATE_NAME, ExecutionState } from 'src/app/state/photo.store';
import { PageResponse, Photo } from 'src/app/models/Photo';
import { generateErrorResponse, IImageService, ImageService } from 'src/app/services/image.service';
import { FetchPhotos, SetSearchString } from './photo.actions';

describe('Store actions', () => {

  describe('SetSearchString action', () => {
    let store: Store;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          HttpClientModule,
          [NgxsModule.forRoot([PhotoState])],
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
      const ANY_NON_ZERO = 29;
      setStoreSnapshot(store, model => model.currentPage = ANY_NON_ZERO);
      expect(store.selectSnapshot(s => stateModel(s).currentPage)).toBe(ANY_NON_ZERO);

      store.dispatch(new SetSearchString('cat'));

      expect(store.selectSnapshot(s => stateModel(s).currentPage)).toBe(0);
    });

    it('resets photos to empty list', () => {
      const ANY_NON_EMPTY_LIST: Photo[] = [{} as Photo, {} as Photo];
      setStoreSnapshot(store, model => model.photos = ANY_NON_EMPTY_LIST);
      expect(store.selectSnapshot(s => stateModel(s).photos)).toEqual(ANY_NON_EMPTY_LIST);

      store.dispatch(new SetSearchString('cat'));

      expect(store.selectSnapshot(s => stateModel(s).photos)).toEqual([]);
    });

    it('resets total to zero', () => {
      setStoreSnapshot(store, model => model.total = STATE_TOTAL);
      expect(store.selectSnapshot(s => stateModel(s).total)).toEqual(STATE_TOTAL);

      store.dispatch(new SetSearchString('cat'));

      expect(store.selectSnapshot(s => stateModel(s).total)).toEqual(0);
    });

  });

  describe('FetchPhotos action', () => {
    let store: Store;
    let initialState: PhotoStateModel;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientModule, [NgxsModule.forRoot([PhotoState])]],
        providers: [
          Store,
          { provide: ImageService, useClass: MockImageService }
        ],
      }).compileComponents();
      store = TestBed.inject(Store);

      initialState = genState();
      const snapshot = store.snapshot();
      snapshot[STATE_NAME] = { ...initialState };
      store.reset(snapshot);
    });

    it('increments page number with each subsequent fetch', () => {
      expect(store.selectSnapshot(s => stateModel(s).currentPage)).toBe(initialState.currentPage);
      store.dispatch(new FetchPhotos());
      expect(store.selectSnapshot(s => stateModel(s).currentPage)).toBe(initialState.currentPage + 1);
    });

    it('stores new photos in state', () => {
      expect(store.selectSnapshot(s => stateModel(s).photos.length)).toBe(STATE_PHOTO_COUNT);

      store.dispatch(new FetchPhotos());

      const photos = store.selectSnapshot(s => stateModel(s).photos);
      expect(photos.length).toBe(RESPONSE_PHOTO_COUNT);
      // IDs in the response are offset by a constant amount from IDs in the initial state,
      // so a simple addition allows checking each item
      for (let i = 0; i < photos.length; i++) {
        expect(photos[i].id).toBe(initialState.photos[i].id + BASE_OFFSET);
      }
    });

    it('stores total in state', () => {
      expect(store.selectSnapshot(s => stateModel(s).total)).toBe(STATE_TOTAL);

      store.dispatch(new FetchPhotos());

      expect(store.selectSnapshot(s => stateModel(s).total)).toBe(101);
    });

    it('annotates photos with sequence number', () => {
      store.dispatch(new FetchPhotos());

      const photos = store.selectSnapshot(s => stateModel(s).photos);
      for (let i = 0; i < photos.length; i++) {
        expect(photos[i].refIndex).toBe(initialState.currentPage * initialState.itemsPerPage + i + 1);
      }
    });

    describe('end-of-input (DEPTH COVERAGE)', () => {
      [true, false].forEach(endOfInput => {
        it(`end of input reflects in state with value '${endOfInput}'`, () => {
          MockImageService.endOfInput = endOfInput;
          expect(store.selectSnapshot(s => stateModel(s).endOfInputReached)).toBeFalse();

          store.dispatch(new FetchPhotos());

          expect(store.selectSnapshot(s => stateModel(s).endOfInputReached)).toBe(endOfInput);
        });
      });
    });
  });

  describe('FetchPhotos action (error return)', () => {
    let store: Store;
    let initialState: PhotoStateModel;
    let imageServiceSpy: jasmine.SpyObj<IImageService>;

    beforeEach(() => {
      imageServiceSpy = jasmine.createSpyObj('ImageService', ['loadPage']);
      TestBed.configureTestingModule({
        imports: [HttpClientModule, [NgxsModule.forRoot([PhotoState])]],
        providers: [
          Store,
          { provide: ImageService, useValue: imageServiceSpy }
        ],
      }).compileComponents();
      store = TestBed.inject(Store);

      initialState = genState();
      const snapshot = store.snapshot();
      snapshot[STATE_NAME] = { ...initialState };
      store.reset(snapshot);

      imageServiceSpy.loadPage.and
        .returnValue(throwError(
          generateErrorResponse(StatusCodes.FORBIDDEN, 'unauthorized')
        ));
    });

    it('resets photos to empty list upon error', () => {
      const ANY_NON_EMPTY_LIST: Photo[] = [{} as Photo, {} as Photo];
      setStoreSnapshot(store, model => model.photos = ANY_NON_EMPTY_LIST);
      expect(store.selectSnapshot(s => stateModel(s).photos)).toEqual(ANY_NON_EMPTY_LIST);

      store.dispatch(new FetchPhotos());

      expect(store.selectSnapshot(s => stateModel(s).photos)).toEqual([]);
    });

    it('resets total to zero upon error', () => {
      setStoreSnapshot(store, model => model.total = STATE_TOTAL);
      expect(store.selectSnapshot(s => stateModel(s).total)).toEqual(STATE_TOTAL);

      store.dispatch(new FetchPhotos());

      expect(store.selectSnapshot(s => stateModel(s).total)).toEqual(0);
    });



  });

});

@Injectable()
export class MockImageService extends ImageService {

  public static endOfInput: boolean;

  loadPage(pageId: number, itemsPerPage: number, searchString: string): Observable<PageResponse> {
    return of(genResponse({ endOfInput: MockImageService.endOfInput }));
  }
}

export function stateModel(snapshot: StoreSnapshot): PhotoStateModel {
  return snapshot[STATE_NAME];
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
export const STATE_TOTAL = 509;
export const RESPONSE_PHOTO_COUNT = 9;

export function genState(): PhotoStateModel {
  return {
    searchString: 'dog',
    photos: genPhotos(STATE_BASE, STATE_PHOTO_COUNT),
    total: STATE_TOTAL,
    fetchStatus: ExecutionState.Uninitialized,
    testStatus: ExecutionState.Uninitialized,
    endOfInputReached: false,
    currentPage: 10,
    itemsPerPage: 20,
    apiResponse: {
      statusCode: StatusCodes.OK,
      statusMsg: ''
    }
  };
}

export function genResponse({ endOfInput = false, includePhotos = true } ): PageResponse {
  return {
    page: 5,
    per_page: 20,
    photos: genPhotos(RESPONSE_BASE, includePhotos ? RESPONSE_PHOTO_COUNT : 0),
    total_results: includePhotos ? 101 : 0,
    next_page: endOfInput ? '' : 'any next page',
    prev_page: ''
  };
}

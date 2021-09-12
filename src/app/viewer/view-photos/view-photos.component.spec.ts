import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { NgxsModule, Select, Store } from '@ngxs/store';
import { IPageInfo } from 'ngx-virtual-scroller';
import { Observable, of, throwError } from 'rxjs';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { find, findAllAs, findAs, findParentAs, setFixture } from 'src/app/utility/queryHelper';
import { generateErrorResponse, IImageService, ImageService } from 'src/app/services/image.service';
import { Photo } from 'src/app/models/Photo';
import { ExecutionState, PhotoState } from 'src/app/state/photo.store';
import { FetchPhotos, SetSearchString } from 'src/app/state/photo.actions';
import { genPhotos, genResponse, MockImageService, RESPONSE_PHOTO_COUNT } from 'src/app/state/photo.store.spec';
import { ViewerModule } from 'src/app/viewer/viewer.module';
import { ViewPhotosComponent } from './view-photos.component';

describe('ViewPhotosComponent', () => {
  let component: ViewPhotosComponent;
  let fixture: ComponentFixture<ViewPhotosComponent>;
  let store: Store;

  const baseConfig = {
    declarations: [ViewPhotosComponent],
    imports: [
      RouterTestingModule,
      HttpClientModule,
      [NgxsModule.forRoot([PhotoState])],
    ],
    providers: [Store],
    schemas: [NO_ERRORS_SCHEMA]
  };

  describe('with mock API', () => {

    beforeEach(() => {
      const config = {
        ...baseConfig,
        providers: [...baseConfig.providers, { provide: ImageService, useClass: MockImageService }]
      };
      TestBed.configureTestingModule(config).compileComponents();
      store = TestBed.inject(Store);
      fixture = TestBed.createComponent(ViewPhotosComponent);
      setFixture(fixture);
      component = fixture.debugElement.componentInstance;
    });

    describe('status indicators', () => {

      it('displays end marker when collection exhausted (logic)', () => {
        MockImageService.endOfInput = true;
        const monitor = new EndOfInputMonitor();
        expect(monitor.events).toEqual([false]); // initialization

        store.dispatch(new FetchPhotos());
        expect(monitor.events).toEqual([false, true]);
      });

      it('displays end marker when collection exhausted (rendering)', () => {
        MockImageService.endOfInput = true;
        const originalPhotoQty = 10;
        component.photos = genPhotos(1000, originalPhotoQty);
        expect(component.photos.length).toBe(originalPhotoQty);

        expect(find('#endFlag')).toBeNull();

        component.fetchMore({ endIndex: originalPhotoQty - 1 } as IPageInfo);
        fixture.detectChanges();

        expect(find('#endFlag')).not.toBeNull();
      });

      it('displays spinner while fetching photos', () => {
        const monitor = new LoadingMonitor();
        expect(monitor.events).toEqual([ExecutionState.Uninitialized]); // initialization

        store.dispatch(new FetchPhotos());

        // Spinner only appears during loading state, so if this sequence is observed
        // then spinner visibility is correct.
        expect(monitor.events).toEqual(
          [ExecutionState.Uninitialized, ExecutionState.Loading, ExecutionState.Success],
          'should have seen (0) Uninitialized, (1) Loading, and (2) Success'
        );
      });
    });

    describe('fetching more photos during scrolling (DEPTH COVERAGE)', () => {
      const originalPhotoQty = 10;
      const indexOfLastPhoto = originalPhotoQty - 1;

      beforeEach(() => {
        component.photos = genPhotos(1000, originalPhotoQty);
      });

      it('more photos are fetched when final photo is encountered', () => {

        spyOn(store, 'dispatch').and.callThrough();

        // Each photo emits an event with its index; the only one that should cause more photos
        // to be fetched is the last one.
        component.fetchMore({ endIndex:  indexOfLastPhoto} as IPageInfo);
        fixture.detectChanges();

        // Intermediate check: state action to fetch more photos occurred
        expect(store.dispatch).toHaveBeenCalledWith(new FetchPhotos());
        // Result check: more photos actually resulted
        expect(component.photos.length).toBe(originalPhotoQty + RESPONSE_PHOTO_COUNT);
      });

      it('more photos are NOT fetched when any non-final photo is encountered', () => {

        // Going along with prior test, any index less than n-1 may be used here.
        const targetIndex = 7;
        expect(targetIndex).toBeLessThan(originalPhotoQty - 1);
        component.fetchMore({ endIndex:  targetIndex} as IPageInfo);
        fixture.detectChanges();

        expect(component.photos.length).toBe(originalPhotoQty);
      });

      it('more photos are NOT fetched while still loading previous batch', () => {

        component.fetchStatus = ExecutionState.Loading;

        // In a test above this index was sufficient to fetch more photos;
        // that is averted here because of the loading state.
        component.fetchMore({ endIndex: indexOfLastPhoto } as IPageInfo);
        fixture.detectChanges();

        expect(component.photos.length).toBe(originalPhotoQty);
      });

      it('more photos are NOT fetched when end of input reached', () => {
        component.endOfInputReached = true;

        component.fetchMore({ endIndex: indexOfLastPhoto } as IPageInfo);
        fixture.detectChanges();

        expect(component.photos.length).toBe(originalPhotoQty);
      });

      it('more photos are NOT fetched when initializing event triggers', () => {
        component.photos = [];

        component.fetchMore({ endIndex: -1 } as IPageInfo);
        fixture.detectChanges();

        expect(component.photos.length).toBe(0);
      });
    });

  });

  describe('with spy API', () => {
    let imageServiceSpy: jasmine.SpyObj<IImageService>;

    beforeEach(() => {
      imageServiceSpy = jasmine.createSpyObj('ImageService', ['loadPage']);
      const config = {
        ...baseConfig,
        providers: [...baseConfig.providers, { provide: ImageService, useValue: imageServiceSpy }]
      };
      TestBed.configureTestingModule(config).compileComponents();

      store = TestBed.inject(Store);
      fixture = TestBed.createComponent(ViewPhotosComponent);
      setFixture(fixture);
      component = fixture.debugElement.componentInstance;
    });

    describe('result graphics', () => {

      it('displays no-search-started graphic with no input', () => {
        fixture.detectChanges();
        expectOnlyVisibleImage('noSearchPerformed');
      });

      it('displays no-results graphic with some input but no results', () => {
        imageServiceSpy.loadPage.and
          .returnValue(of(genResponse({ includePhotos: false })));
        store.dispatch(new SetSearchString('any'));
        fixture.detectChanges();
        expectOnlyVisibleImage('noResultsFound');
      });

      it('displays unauthorized graphic for authorization failure', () => {
        imageServiceSpy.loadPage.and
          .returnValue(throwError(
            generateErrorResponse(StatusCodes.FORBIDDEN, 'unauthorized')
          ));

        store.dispatch(new SetSearchString('any'));
        fixture.detectChanges();

        expectOnlyVisibleImage('unauthorized');
      });

      it('displays note for authorization failure', () => {
        imageServiceSpy.loadPage.and
          .returnValue(throwError(
            generateErrorResponse(StatusCodes.FORBIDDEN, 'unauthorized')
          ));

        store.dispatch(new SetSearchString('any'));
        fixture.detectChanges();

        const note = find('#unauthorized + .notice-note');
        expect(note?.textContent).toMatch('Select the key.*re-enter your API key');
      });

      it('displays general-error graphic for NON-authorization failure', () => {
        imageServiceSpy.loadPage.and
          .returnValue(throwError(
            generateErrorResponse(StatusCodes.GATEWAY_TIMEOUT, 'some other error')
          ));

        store.dispatch(new SetSearchString('any'));
        fixture.detectChanges();

        expectOnlyVisibleImage('generalError');
      });

      it('displays error code and message for NON-authorization failure', () => {
        imageServiceSpy.loadPage.and
          .returnValue(throwError(
            generateErrorResponse(StatusCodes.GATEWAY_TIMEOUT, 'some other error')
          ));

        store.dispatch(new SetSearchString('any'));
        fixture.detectChanges();

        const note = find('#generalError + .notice-note');
        expect(note?.textContent).toMatch('some other error');
        expect(note?.textContent).toMatch(String(StatusCodes.GATEWAY_TIMEOUT));
        expect(note?.textContent).toMatch(getReasonPhrase(StatusCodes.GATEWAY_TIMEOUT));
      });

      it('displays general-error graphic for empty response', () => {
        imageServiceSpy.loadPage.and
          .returnValue(throwError(
            generateErrorResponse(0, 'some other error')
          ));

        store.dispatch(new SetSearchString('any'));
        fixture.detectChanges();

        expectOnlyVisibleImage('generalError');
      });

      it('displays "empty response" for empty response', () => {
        imageServiceSpy.loadPage.and
          .returnValue(throwError(
            generateErrorResponse(0, 'some other error')
          ));

        store.dispatch(new SetSearchString('any'));
        fixture.detectChanges();

        const note = find('#generalError + .notice-note');
        expect(note?.textContent).toMatch('[ empty response ]');
      });

      it('does not display any graphic while loading', () => {
        fixture.detectChanges();
        component.fetchStatus = ExecutionState.Loading;
        fixture.detectChanges();

        expect(findAllAs<HTMLImageElement>('.notice img')).toEqual([]);
      });
    });
  });

  describe('with modal component', () => {

    beforeEach(() => {

      const config = {
        ...baseConfig,
        imports: [...baseConfig.imports, ViewerModule],
        schemas: []
      };
      TestBed.configureTestingModule(config).compileComponents();

      store = TestBed.inject(Store);
      fixture = TestBed.createComponent(ViewPhotosComponent);
      setFixture(fixture);
      component = fixture.debugElement.componentInstance;
    });

    describe('detail view', () => {
      it('signals modal to open when user selects an image', () => {
        let emitted = false;
        component.detailModalVisibility.subscribe((event: string) => {
          emitted = true;
        });
        component.showDetail(genPhoto());
        fixture.detectChanges();

        expect(emitted).toBeTrue();
      });

      it('renders larger image of selected photo', () => {
        const photo = genPhoto();
        component.showDetail(photo);
        fixture.detectChanges();

        const imageElement = findAs<HTMLImageElement>('app-base-modal img');
        expect(imageElement.src).toBe(photo.src.large);
      });

      describe('author name', () => {

        it('renders with detail view', () => {
          const photo = genPhoto();
          component.showDetail(photo);
          fixture.detectChanges();

          expect(find('app-base-modal #test-author')?.textContent).toBe(photo.photographer);
        });

        it('enclosed with link to author details', () => {
          const photo = genPhoto();
          component.showDetail(photo);
          fixture.detectChanges();

          const anchorElement = findParentAs<HTMLAnchorElement>('app-base-modal #test-author');
          expect(anchorElement.href).toBe(photo.photographer_url);
        });

        it('author link will open in a new tab (or window)', () => {
          // Default is a new tab; users can configure otherwise.
          // See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-target
          component.showDetail(genPhoto());
          fixture.detectChanges();

          const anchorElement = findAs<HTMLAnchorElement>('app-base-modal a');
          expect(anchorElement.target).toBe('_blank');
        });
      });

      describe('save button', () => {

        it('renders with detail view', () => {
          const photo = genPhoto();
          component.showDetail(photo);
          fixture.detectChanges();

          expect(find('app-base-modal #test-download-button')).toBeTruthy();
        });

        it('displays download icon from material icons', () => {
          const photo = genPhoto();
          component.showDetail(photo);
          fixture.detectChanges();

          expect(find('app-base-modal #test-download-button mat-icon')).toBeTruthy();
          expect(find('app-base-modal #test-download-button mat-icon')?.textContent).toBe('download');
        });

        it('downloads image file URL when clicked', () => {
          spyOn(component, 'download');
          const photo = genPhoto();
          component.showDetail(photo);

          find('app-base-modal #test-download-button')?.click();

          expect(component.download).toHaveBeenCalledWith(photo.src.large);
        });
      });

      describe('save button tooltip displays filename (DEPTH COVERAGE)', () => {
        [
          ['http://www.foo.com/some-large-url.jpg', 'some-large-url.jpg', 'for domain + only file + extension'],
          ['http://www.foo.com/some-large-url', 'some-large-url', 'for domain + only file + NO extension'],
          ['http://www.foo.com/path/a/b/c/some-large-url.jpg', 'some-large-url.jpg', 'for domain + path + file'],
          ['http://www.foo.com/path/a/b/c/some large url.jpg', 'some large url.jpg', 'for domain + path + file with spaces'],
          ['',                    '', 'exception: handles empty url gracefully with empty string'],
          ['http://www.foo.com/', '', 'exception: handles empty path gracefully with empty string'],
          ['not-a-valid-url',     '', 'exception: handles invalid url gracefully with empty string'],
        ].forEach(([url, filename, description]) => {
          it(description, () => {
            const photo = genPhoto();
            photo.src.large = url;
            component.showDetail(photo);
            fixture.detectChanges();

            expect(find('app-base-modal #test-download-button')?.title).toBe(`Save ${filename}`);
          });
        });
      });

    });
  });

  function expectOnlyVisibleImage(imgId: string): void {
    findAllAs<HTMLImageElement>('.notice img').forEach(img => {
      if (img.id === imgId) {
        expect(img).not.toBeNull();
      } else {
        expect(img).toBeNull();
      }
    });
  }

  function genPhoto(): Photo {
    return {
      src: {
        large: 'http://www.foo.com/some-large-url',
        medium: 'http://www.foo.com/some-medium-url'
      },
      photographer: 'bob smith',
      photographer_url: 'http://www.any.com/',
    } as Photo;
  }
});

class LoadingMonitor {
  @Select(PhotoState.fetchStatus) fetchStatus$!: Observable<ExecutionState>;
  public events: ExecutionState[] = [];

  constructor() {
    this.fetchStatus$.subscribe(
      status => { this.events.push(status); });
  }
}

class EndOfInputMonitor {
  @Select(PhotoState.endOfInputReached) endOfInputReached$!: Observable<boolean>;
  public events: boolean[] = [];

  constructor() {
    this.endOfInputReached$.subscribe(flag => { this.events.push(flag); });
  }
}

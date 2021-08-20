import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { NgxsModule, Select, Store } from '@ngxs/store';
import { IPageInfo } from 'ngx-virtual-scroller';
import { Observable, of, throwError } from 'rxjs';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { find, findAllAs, findAs, findParentAs, setFixture } from 'src/app/utility/queryHelper';
import { ExecutionState, PhotoState } from 'src/app/state/photo.store';
import { generateErrorResponse, IImageService, ImageService } from 'src/app/services/image.service';
import { Photo } from 'src/app/models/Photo';
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

  describe('default', () => {

    beforeEach(() => {
      const config = { ...baseConfig };
      TestBed.configureTestingModule(config).compileComponents();
      store = TestBed.inject(Store);
      fixture = TestBed.createComponent(ViewPhotosComponent);
      component = fixture.debugElement.componentInstance;
    });

    it('more photos are NOT fetched while still loading previous batch', () => {
      const originalPhotoQty = 10;
      component.photos = genPhotos(1000, originalPhotoQty);
      expect(component.photos.length).toBe(originalPhotoQty);
      component.fetchStatus = ExecutionState.Loading;

      component.fetchMore({ endIndex: originalPhotoQty - 1 } as IPageInfo);
      fixture.detectChanges();

      expect(component.photos.length).toBe(originalPhotoQty);
    });

    it('more photos are NOT fetched when event is triggered by any other photo', () => {
      const originalPhotoQty = 10;
      component.photos = genPhotos(1000, originalPhotoQty);
      expect(component.photos.length).toBe(originalPhotoQty);

      component.fetchMore({ endIndex: 7 } as IPageInfo);
      fixture.detectChanges();

      expect(component.photos.length).toBe(originalPhotoQty);
    });

    it('more photos are NOT fetched when end of input reached', () => {
      const originalPhotoQty = 10;
      component.photos = genPhotos(1000, originalPhotoQty);
      expect(component.photos.length).toBe(originalPhotoQty);
      component.endOfInputReached = true;

      component.fetchMore({ endIndex: originalPhotoQty - 1 } as IPageInfo);
      fixture.detectChanges();

      expect(component.photos.length).toBe(originalPhotoQty);
    });

    it('more photos are NOT fetched when initializing event triggers', () => {
      component.photos = [];

      component.fetchMore({ endIndex: -1 } as IPageInfo);
      fixture.detectChanges();

      expect(component.photos.length).toBe(0);
    });

    it('dispatch is invoked when more photos available', () => {
      spyOn(store, 'dispatch');
      const originalPhotoQty = 10;
      component.photos = genPhotos(1000, originalPhotoQty);

      component.fetchMore({ endIndex: originalPhotoQty - 1 } as IPageInfo);
      fixture.detectChanges();

      expect(store.dispatch).toHaveBeenCalledWith(new FetchPhotos());
    });

    it('signals modal to open when user selects an image', () => {
      let emitted = false;
      component.detailModalVisibility.subscribe((event: string) => {
        emitted = true;
      });
      component.showDetail(genPhoto());
      fixture.detectChanges();

      expect(emitted).toBeTrue();
    });

  });

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

    it('displays end marker when collection exhausted (logic)', () => {
      MockImageService.endOfInput = true;
      const monitor = new EndOfInputMonitor();
      expect(monitor.events).toEqual([false]); // initialization

      store.dispatch(new FetchPhotos());
      expect(monitor.events).toEqual([false, true]);
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

    it('more photos are fetched when event is triggered by final photo', () => {
      const originalPhotoQty = 10;
      component.photos = genPhotos(1000, originalPhotoQty);
      expect(component.photos.length).toBe(originalPhotoQty);

      component.fetchMore({ endIndex: originalPhotoQty - 1 } as IPageInfo);
      fixture.detectChanges();

      expect(component.photos.length).toBe(originalPhotoQty + RESPONSE_PHOTO_COUNT);
    });

  });

  describe('with spy API', () => {
    let imageServiceSpy: jasmine.SpyObj<IImageService>;

    beforeEach(() => {
      imageServiceSpy = jasmine.createSpyObj('ImageService', ['loadPage']);
      imageServiceSpy.loadPage.and
        .returnValue(of(genResponse({ includePhotos: false })));
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

    it('displays no-search-started-graphic with no input', () => {
      fixture.detectChanges();
      expectOnlyVisibleImage('noSearchPerformed');
    });

    it('displays no-results-graphic with some input but no results', () => {
      store.dispatch(new SetSearchString('any'));
      fixture.detectChanges();
      expectOnlyVisibleImage('noResultsFound');
    });

    it('displays unauthorized-graphic for authorization failure', () => {
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
      expect(note?.textContent?.indexOf('Go to Dev Tools')).toBeGreaterThanOrEqual(0);
    });

    it('displays general-error-graphic for NON-authorization failure', () => {
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
      expect(note?.textContent?.indexOf('some other error')).toBeGreaterThanOrEqual(0);
      expect(note?.textContent?.indexOf(String(StatusCodes.GATEWAY_TIMEOUT))).toBeGreaterThanOrEqual(0);
      expect(note?.textContent?.indexOf(getReasonPhrase(StatusCodes.GATEWAY_TIMEOUT))).toBeGreaterThanOrEqual(0);
    });

    it('does not display any graphic while loading', () => {
      fixture.detectChanges();
      component.fetchStatus = ExecutionState.Loading;
      fixture.detectChanges();

      expect(findAllAs<HTMLImageElement>('.notice img')).toEqual([]);
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

    it('renders larger image of selected photo in modal', () => {
      const photo = genPhoto();
      component.showDetail(photo);
      fixture.detectChanges();

      const imageElement = findAs<HTMLImageElement>('app-base-modal img');
      expect(imageElement.src.substring(imageElement.baseURI.length)).toBe(photo.src.large);
    });

    it('renders author of photo\'s name in modal', () => {
      const photo = genPhoto();
      component.showDetail(photo);
      fixture.detectChanges();

      expect(find('app-base-modal #author')?.textContent).toBe(photo.photographer);
    });

    it('renders link to author enclosing the name', () => {
      const photo = genPhoto();
      component.showDetail(photo);
      fixture.detectChanges();

      const anchorElement = findParentAs<HTMLAnchorElement>('app-base-modal #author');
      expect(anchorElement.href).toBe(photo.photographer_url);
    });

    it('link to author will open in a new tab (or window)', () => {
      // Default is a new tab; users can configure otherwise.
      // See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-target
      component.showDetail(genPhoto());
      fixture.detectChanges();

      const anchorElement = findAs<HTMLAnchorElement>('app-base-modal a');
      expect(anchorElement.target).toBe('_blank');
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
        large: 'some-large-url',
        medium: 'some-medium-url'
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

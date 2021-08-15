import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';

import { Photo } from 'src/app/models/Photo';
import { ImageService } from 'src/app/services/image.service';
import { FetchPhotos, SetSearchString, TestApi } from './photo.actions';


export enum TestState {
  Uninitialized,
  Loading,
  Success,
  Failure,
}

export const STATE_NAME = 'imageCollection';
export interface PhotoStateModel {
  searchString: string;
  photos: Photo[];
  loading: boolean;
  testStatus: TestState;
  endOfInputReached: boolean;
  currentPage: number;
  itemsPerPage: number;
}

@State<PhotoStateModel>({
  name: STATE_NAME,
  defaults: {
    searchString: '',
    photos: [],
    loading: false,
    testStatus: TestState.Uninitialized,
    endOfInputReached: false,
    currentPage: 0,
    itemsPerPage: 20
  },
})
@Injectable()
export class PhotoState {
  constructor(private http: HttpClient, private readonly api: ImageService) {}

  @Selector()
  public static searchString(state: PhotoStateModel): string {
    return state.searchString;
  }

  @Selector()
  public static loading(state: PhotoStateModel): boolean {
    return state.loading;
  }

  @Selector()
  public static photos(state: PhotoStateModel): Photo[] {
    return state.photos;
  }

  @Selector()
  public static endOfInputReached(state: PhotoStateModel): boolean {
    return state.endOfInputReached;
  }

  @Selector()
  public static testStatus(state: PhotoStateModel): TestState {
    return state.testStatus;
  }

  @Action(SetSearchString)
  setSearchString(
    { patchState }: StateContext<PhotoStateModel>,
    { searchString }: SetSearchString
  ): void {
      patchState({
        searchString,
        currentPage: 0,
        photos: [],
        loading: false,
        endOfInputReached: false
      });
  }

  @Action(FetchPhotos)
  getPhotos(
    { getState, patchState }: StateContext<PhotoStateModel>
  ): void {
    const state = getState();
    const [itemsPerPage, currentPage] = [state.itemsPerPage, ++state.currentPage];
    patchState({
      currentPage,
      loading: true
    });

    // page index is 1-based not 0-based here
    this.api
      .loadPage(currentPage, itemsPerPage, state.searchString)
      .subscribe(
        (response) => {
          console.log(
            `Received ${response.photos.length} photos on page ${response.page} (${response.total_results} total)`
          );
          // Add local display indices before storing data
          for (let i = 0; i < response.photos.length; i++) {
            response.photos[i].refIndex = (currentPage - 1) * itemsPerPage + i + 1;
          }
          patchState({
            photos: response.photos,
            loading: false,
            endOfInputReached: !response.next_page
          });
        },
        (errResponse: HttpErrorResponse) => {
          console.log(errResponse.message);
          patchState({
            photos: [],
            loading: false,
            endOfInputReached: false
          });
        }
      );
  }

  @Action(TestApi)
  testApi(
    { getState, patchState }: StateContext<PhotoStateModel>,
    { apiKey }: TestApi
  ): void {
    const state = getState();
    const [itemsPerPage, currentPage] = [state.itemsPerPage, ++state.currentPage];
    patchState({
      testStatus: TestState.Loading,
    });

    this.api
      .testPage(apiKey)
      .subscribe(
        (response) => {
          console.log(
            `Received ${response.photos.length} photos on page ${response.page} (${response.total_results} total)`
          );
          patchState({
            testStatus: TestState.Success,
            endOfInputReached: !response.next_page
          });
        },
        (errResponse: HttpErrorResponse) => {
          console.log(errResponse.message);
          patchState({
            testStatus: TestState.Failure,
            endOfInputReached: false
          });
        }
      );
  }
}

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';

import { Photo } from 'src/app/models/Photo';
import { ImageService } from 'src/app/services/image.service';
import { FetchPhotos, SetSearchString, TestApi } from './photo.actions';


export enum ExecutionState {
  Uninitialized,
  Loading,
  Success,
  Failure,
}

export const STATE_NAME = 'imageCollection';
export interface PhotoStateModel {
  searchString: string;
  photos: Photo[];
  fetchStatus: boolean;
  testStatus: ExecutionState;
  endOfInputReached: boolean;
  currentPage: number;
  itemsPerPage: number;
}

@State<PhotoStateModel>({
  name: STATE_NAME,
  defaults: {
    searchString: '',
    photos: [],
    fetchStatus: false,
    testStatus: ExecutionState.Uninitialized,
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
  public static fetchStatus(state: PhotoStateModel): boolean {
    return state.fetchStatus;
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
  public static testStatus(state: PhotoStateModel): ExecutionState {
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
        fetchStatus: false,
        endOfInputReached: false
      });
  }

  @Action(FetchPhotos)
  getPhotos(
    { getState, patchState }: StateContext<PhotoStateModel>
  ): void {
    const state = getState();
    const [itemsPerPage, currentPage] = [state.itemsPerPage, state.currentPage + 1];
    patchState({
      currentPage,
      fetchStatus: true
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
            fetchStatus: false,
            endOfInputReached: !response.next_page
          });
        },
        (errResponse: HttpErrorResponse) => {
          console.log(errResponse.message);
          patchState({
            photos: [],
            fetchStatus: false,
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
    const [itemsPerPage, currentPage] = [state.itemsPerPage, state.currentPage + 1];
    patchState({
      testStatus: ExecutionState.Loading,
    });

    this.api
      .testPage(apiKey)
      .subscribe(
        (response) => {
          console.log(
            `Received ${response.photos.length} photos on page ${response.page} (${response.total_results} total)`
          );
          patchState({
            testStatus: ExecutionState.Success,
            endOfInputReached: !response.next_page
          });
        },
        (errResponse: HttpErrorResponse) => {
          console.log(errResponse.message);
          patchState({
            testStatus: ExecutionState.Failure,
            endOfInputReached: false
          });
        }
      );
  }
}

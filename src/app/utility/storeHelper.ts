import { Store } from '@ngxs/store';
import { PhotoStateModel, STATE_NAME } from '../state/photo.store';

export interface StoreSnapshot {
  [key: string]: PhotoStateModel;
}

export function setStoreSnapshot(
  store: Store,
  modifyStore: (model: PhotoStateModel) => void
): void {
  // see https://www.ngxs.io/recipes/unit-testing#prepping-state
  const testStore: StoreSnapshot = {};
  testStore[STATE_NAME] = store.snapshot()[STATE_NAME];
  modifyStore(testStore[STATE_NAME]);
  store.reset(testStore);
}

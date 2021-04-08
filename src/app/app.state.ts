import { Injectable } from '@angular/core';
import { State, Action, Selector } from '@ngxs/store';

export interface Counter {
  incrementer: number | null;
}

export class Add {
  static readonly type = 'Add';
}

@State<Counter>({
  name: 'count',
  defaults: {
    incrementer: 0,
  },
})
@Injectable()
export class CountState {
  @Selector()
  static myCount(state: Counter): number {
    return state.incrementer;
  }

  @Action(Add)
  add({ getState, setState }) {
    const state = getState();
    setState({ incrementer: state.incrementer + 1 });
  }
}

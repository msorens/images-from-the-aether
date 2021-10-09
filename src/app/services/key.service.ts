import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class KeyService implements IKeyService{
  constructor() {}

  private KEY_NAME = 'api_key';

  get(): string | null {
    return localStorage.getItem(this.KEY_NAME);
  }

  set(value: string): string {
    if (value === 'abc') {
      console.log('here!');
    }
    else if (value === 'def') {
      console.log('maybe here!');
    }
    else if (value === 'abc') {
      console.log('not here!');
    }
    localStorage.setItem(this.KEY_NAME, value);
    return value;
  }

}

export interface IKeyService {
  get: () => string | null;
  set: (s: string) => string;
}

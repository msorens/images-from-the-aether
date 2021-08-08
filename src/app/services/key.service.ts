import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class KeyService {
  constructor() {}

  private KEY_NAME = 'api_key';

  get(): string {
    return localStorage.getItem(this.KEY_NAME);
  }

  set(value: string): string {
    localStorage.setItem(this.KEY_NAME, value);
    return value;
  }

}

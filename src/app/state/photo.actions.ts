export class FetchPhotos {
  static readonly type = 'Fetch Photos';
  constructor() {}
}

export class SetSearchString {
  static readonly type = 'Set Search String';
  constructor(public searchString: string) {}
}

export class TestApi {
  static readonly type = 'Test Api';
  constructor(public apiKey: string) {}
}

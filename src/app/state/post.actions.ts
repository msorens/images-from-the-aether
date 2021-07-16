export class FetchPosts {
  static readonly type = 'Fetch Photos';
  constructor() {}
}

export class SetSearchString {
  static readonly type = 'Set Search String';
  constructor(public searchString: string) {}
}

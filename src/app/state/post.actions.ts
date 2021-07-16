export class FetchPosts {
  static readonly type = 'Fetch Photos';
  constructor(public searchString: string) {}
}

export class SetSearchString {
  static readonly type = 'Set Search String';
  constructor(public searchString: string) {}
}

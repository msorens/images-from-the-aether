export class FetchPosts {
  static readonly type = 'Fetch Photos';
  constructor(public pageId: number, public searchString: string) {}
}

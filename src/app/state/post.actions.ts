export class FetchPosts {
  static readonly type = '[Posts] Fetch Post';
  constructor(public pageId: number, public searchString: string) {}
}


import { Component, NgZone, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { IPageInfo } from 'ngx-virtual-scroller';

import { PostState } from '../../state/post.store';
import { Photo } from 'src/app/models/Post';
import { FetchPosts } from 'src/app/state/post.actions';

@Component({
  selector: 'app-view-posts',
  templateUrl: './view-posts.component.html',
  styleUrls: ['./view-posts.component.scss'],
})
export class ViewPostsComponent implements OnInit {
  photos: Photo[] = [];
  title = 'Angular Infinite Scrolling List';
  page = 1;
  loading = false;

  constructor(private store: Store, private ngZone: NgZone) {}

  @Select(PostState.loading) loading$: Observable<boolean>;
  @Select(PostState.posts) posts$: Observable<Photo[]>;

  ngOnInit(): void {
    this.posts$
      .pipe(filter(newPhotos => !!newPhotos))
      .subscribe(newPhotos => {
        this.loading = false;
        this.photos = this.photos.concat(newPhotos);
        console.log(`received ${newPhotos.length} new photos; total now ${this.photos.length}`);
      }
    );
    console.log('Dispatching from ngOnInit');
    this.fetchNext();
  }

  fetchMore(event: IPageInfo): void {
    if (this.loading || event.endIndex !== this.photos.length - 1) {
      return;
    }
    console.log(`Dispatching from event: ${event.endIndex}`);
    this.fetchNext();
  }

  private fetchNext(): void {
    this.loading = true;
    this.store.dispatch(new FetchPosts(this.page++, 'cat'));
  }

}


import { AfterViewInit, Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Observable } from 'rxjs';
import { map, pairwise, filter, throttleTime, tap } from 'rxjs/operators';

import { PostState } from '../../state/post.store';
import { Photo } from 'src/app/models/Post';
import { FetchPosts } from 'src/app/state/post.actions';

@Component({
  selector: 'app-view-posts',
  templateUrl: './view-posts.component.html',
  styleUrls: ['./view-posts.component.scss'],
})
export class ViewPostsComponent implements OnInit, AfterViewInit {
  constructor(private store: Store, private ngZone: NgZone) {}

  @ViewChild('scrollerElement') scroller: CdkVirtualScrollViewport;

  title = 'Angular Infinite Scrolling List';
  page = 1;

  @Select(PostState.loading) loading$: Observable<boolean>;
  @Select(PostState.posts) posts$: Observable<Photo[]>;

  ngOnInit(): void {
    this.store.dispatch(new FetchPosts(this.page++, 'cat'));
  }

  ngAfterViewInit(): void {
    this.scroller
      .elementScrolled()
      .pipe(
        map(() => this.scroller.measureScrollOffset('bottom')),
        pairwise(),
        tap(([y1, y2]) => console.log(`y1=${y1},y2=${y2}`)),
        filter(([y1, y2]) => y2 < y1 && y2 < 240),
        tap(([y1, y2]) => console.log('passed filter')),
        throttleTime(200)
      )
      .subscribe(() => {
        this.ngZone.run(() => {
          this.store.dispatch(new FetchPosts(this.page++, 'cat'));
        });
      });
  }

  // fetchMore(): void {
  //   const images = [
  //     'IuLgi9PWETU',
  //     'fIq0tET6llw',
  //     'xcBWeU4ybqs',
  //     'YW3F-C5e8SE',
  //     'H90Af2TFqng',
  //   ];

  //   const newItems = [];
  //   for (let i = 0; i < 20; i++) {
  //     const randomListNumber = Math.round(Math.random() * 100);
  //     const randomPhotoId = Math.round(Math.random() * 4);
  //     newItems.push({
  //       title: 'List Item ' + randomListNumber,
  //       content:
  //         'This is some description of the list - item # ' + randomListNumber,
  //       image: `https://source.unsplash.com/${images[randomPhotoId]}/50x50`,
  //     });
  //   }

  //   this.loading = true;
  //   timer(1000).subscribe(() => {
  //     this.loading = false;
  //     this.photos = [...this.photos, ...newItems];
  //   });
  // }
}

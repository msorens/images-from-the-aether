import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { NgxsModule, Store } from '@ngxs/store';
import { MockComponent } from 'ng2-mock-component';

import { ViewPostsComponent } from './view-posts.component';
import { PostState } from 'src/app/state/post.store';

describe('ViewPostsComponent', () => {
  let fixture;
  let component;
  let store: Store;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        ViewPostsComponent,
        MockComponent({ selector: 'virtual-scroller' }),
      ],
      imports: [
        RouterTestingModule,
        HttpClientModule,
        [NgxsModule.forRoot([PostState])],
      ],
      providers: [Store],
    }).compileComponents();
    store = TestBed.inject(Store);
    fixture = TestBed.createComponent(ViewPostsComponent);
    component = fixture.debugElement.componentInstance;
  });

  it('should create a component', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('should run #ngOnInit()', waitForAsync(() => {
    const result = component.ngOnInit();
    expect(result !== null).toBeTruthy();
  }));

});

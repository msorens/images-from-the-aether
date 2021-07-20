import { RouterModule, Routes } from '@angular/router';
import { ViewPhotosComponent } from './view-photos/view-photos.component';

const postsRoutes: Routes = [
  {
    path: 'posts',
    children: [
      { path: '', component: ViewPhotosComponent }
    ]
  }
];

export const PostsRouting = RouterModule.forChild(postsRoutes);

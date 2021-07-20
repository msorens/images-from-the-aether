import { RouterModule, Routes } from '@angular/router';
import { ViewPhotosComponent } from './view-photos/view-photos.component';

const viewerRoutes: Routes = [
  {
    path: 'photos',
    children: [
      { path: '', component: ViewPhotosComponent }
    ]
  }
];

export const ViewerRouting = RouterModule.forChild(viewerRoutes);

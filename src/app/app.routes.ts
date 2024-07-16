import { Routes } from '@angular/router';
import { RegistrationComponent } from './pages/registration/registration.component';
import { ChatComponent } from './pages/chat/chat.component';

export const routes: Routes = [
    { path: '', component: RegistrationComponent },
    { path: 'chat/:username', component: ChatComponent },
];

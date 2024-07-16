import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [RouterOutlet, ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css'
})
export class RegistrationComponent {

  formModel!: FormGroup;

  get username() { return this.formModel.get('username') };
  get chatRoom() { return this.formModel.get('chatRoom') };

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.initForm();
  }

  private initForm() {
    if (!this.formModel) {
      this.formModel = this.fb.group({
        username: ['', Validators.required],
        chatRoom: [''],
      });
    }
  }

  async onSubmit() {
    if (this.formModel.valid) {
      // go to chat
      this.router.navigateByUrl('chat/' + this.username?.value);
    }
    else {
      console.log('form not valid!')
    }
  }
}

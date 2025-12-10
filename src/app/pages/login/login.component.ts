import { Component, inject } from '@angular/core';
import { LoadingComponent } from "../../components/loading/loading.component";
import { FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';


@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, LoadingComponent],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {

  isLoading: boolean = false;
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);


  form = this.fb.nonNullable.group({
    userName: ['', [Validators.required, Validators.minLength(4)]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  })


  onSubmit() {
    console.log('form submitted');
    if (this.form.get('userName')?.value === '') {
      alert('UserName is required');
      return;
    }

    if (this.form.get('password')?.value === '') {
      alert('Password is required');
      return;
    }


    if (typeof this.form.get('userName')?.value !== 'string') {
      alert('Invalid username, username must be string');
      return;
    }

    if (this.form.valid) {
      console.log('form is valid', this.form.getRawValue());
      this.isLoading = true;                                                                                                                            

      
      this.authService.login(this.form.getRawValue()).subscribe({
        next: (res) => {
          console.log('login successful', res);
          this.isLoading = false;
          if (res.token) {
            console.log('login successful');
            localStorage.setItem('token', res.token);
            this.router.navigate(['/dashboard']).then(
              (success) => console.log('navigated to dashboard', success),
              (failure) => console.log('failed to navigate to dashboard', failure)
            );

          }
        }
      })

    }
  }
}

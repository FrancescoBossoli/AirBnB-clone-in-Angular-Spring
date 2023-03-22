import { User } from './../interfaces/user.interface';
import { JwtResponse } from './../interfaces/jwt-response.interface';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { BehaviorSubject, catchError, map, tap, throwError } from 'rxjs';
import { SignupData } from '../interfaces/signup-data.interface';
import { environment } from 'src/environments/environment.development';

@Injectable({
   providedIn: 'root'
})
export class AuthService {

   jwtHelper = new JwtHelperService();
   private authSubject = new BehaviorSubject<User | null>(null);
   user$ = this.authSubject.asObservable();
   isLoggedIn$ = this.user$.pipe(map(user => !!user));
   timeLeft:any;

   constructor(private http: HttpClient, private router: Router) {
      this.restoreSession();
   }

   signup(data: SignupData) {
      return this.http.post<JwtResponse>(`${environment.api}/signup`, data).pipe(
         tap((res) => this.generateToken(res)),
         catchError(this.errors)
      );
   }

   login(credentials: { username: string, password: string }) {
      return this.http.post<JwtResponse>(`${environment.api}/login`, credentials).pipe(
         tap((res) => this.generateToken(res)),
         catchError(this.errors)
      );
   }

   generateToken(userData:JwtResponse) {
      this.authSubject.next({ id: userData.id, username: userData.username, email: userData.email, roles: userData.roles });
      localStorage.setItem("user", JSON.stringify(userData));
      this.autoLogout(userData)
   }

   autoLogout(userData:JwtResponse) {
      const expirationDate = this.jwtHelper.getTokenExpirationDate(userData.token) as Date
      this.timeLeft = setTimeout(() => this.logout(), (expirationDate.getTime() - new Date().getTime()));
   }

   logout() {
      this.authSubject.next(null);
      localStorage.removeItem("user")
      this.router.navigate(['/'])
      if (this.timeLeft) clearTimeout(this.timeLeft)
   }

   restoreSession() {
      const userData = localStorage.getItem('user');
      if (!userData) return;
      const jwt: JwtResponse = JSON.parse(userData);
      if (this.jwtHelper.isTokenExpired(jwt.token)) return;
      this.authSubject.next({ id: jwt.id, username: jwt.username, email: jwt.email, roles: jwt.roles });
      this.autoLogout(jwt);
   }

   private errors(err: any) {
      switch (err.error) {
         case "Email and password are required":
            return throwError(() => new Error("L'e-mail e la Password sono necessarie"));
         case "Email already exists":
            return throwError(() => new Error("L'e-mail risulta già associata ad un Account esistente"));
         case "Email is invalid":
            return throwError(() => new Error("L'e-mail inserita non sembra essere formalmente corretta"));
         case "Cannot find user":
            return throwError(() => new Error("Non è stato possibile trovare un Account associato alle credenziali inserite"));
         default:
            return throwError(() => new Error("Errore della chiamata"));
      };
   }
}

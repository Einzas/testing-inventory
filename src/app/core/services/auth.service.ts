import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError, delay, switchMap } from 'rxjs';
import { User, LoginRequest, LoginResponse, RegisterRequest, UserRole } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<User | null>(null);
  private isAuthenticatedSignal = signal<boolean>(false);

  // Mock users
  private mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@empresa.com',
      firstName: 'Juan',
      lastName: 'Pérez',
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '2',
      email: 'usuario@empresa.com',
      firstName: 'María',
      lastName: 'García',
      role: UserRole.USER,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  constructor() {
    // Check if user is already logged in
    const token = this.getToken();
    if (token) {
      const user = this.getUserFromToken(token);
      if (user) {
        this.currentUserSignal.set(user);
        this.isAuthenticatedSignal.set(true);
      }
    }
  }

  // Signals for reactive state
  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = this.isAuthenticatedSignal.asReadonly();

  // Helper method for guards
  isAuthenticatedSync(): boolean {
    return this.isAuthenticatedSignal();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    // Simulate API delay
    return of(null).pipe(
      delay(1000),
      switchMap(() => {
        const user = this.mockUsers.find(u => u.email === credentials.email);
        
        if (!user || credentials.password !== 'password123') {
          return throwError(() => new Error('Credenciales inválidas'));
        }

        const token = this.generateMockToken(user);
        const response: LoginResponse = {
          user,
          token,
          refreshToken: 'mock-refresh-token'
        };

        // Store token
        localStorage.setItem('auth_token', token);
        localStorage.setItem('refresh_token', response.refreshToken);
        
        // Update signals
        this.currentUserSignal.set(user);
        this.isAuthenticatedSignal.set(true);

        return of(response);
      })
    );
  }

  register(userData: RegisterRequest): Observable<LoginResponse> {
    return of(null).pipe(
      delay(1000),
      switchMap(() => {
        // Check if user already exists
        const existingUser = this.mockUsers.find(u => u.email === userData.email);
        if (existingUser) {
          return throwError(() => new Error('El usuario ya existe'));
        }

        // Create new user
        const newUser: User = {
          id: (this.mockUsers.length + 1).toString(),
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: UserRole.USER,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.mockUsers.push(newUser);

        const token = this.generateMockToken(newUser);
        const response: LoginResponse = {
          user: newUser,
          token,
          refreshToken: 'mock-refresh-token'
        };

        // Store token
        localStorage.setItem('auth_token', token);
        localStorage.setItem('refresh_token', response.refreshToken);
        
        // Update signals
        this.currentUserSignal.set(newUser);
        this.isAuthenticatedSignal.set(true);

        return of(response);
      })
    );
  }

  logout(): Observable<void> {
    return of(null).pipe(
      delay(500),
      switchMap(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        
        this.currentUserSignal.set(null);
        this.isAuthenticatedSignal.set(false);
        
        return of(void 0);
      })
    );
  }

  refreshToken(): Observable<LoginResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }

    const currentUser = this.currentUserSignal();
    if (!currentUser) {
      return throwError(() => new Error('No current user'));
    }

    return of(null).pipe(
      delay(500),
      switchMap(() => {
        const token = this.generateMockToken(currentUser);
        const response: LoginResponse = {
          user: currentUser,
          token,
          refreshToken: 'mock-refresh-token'
        };

        localStorage.setItem('auth_token', token);
        localStorage.setItem('refresh_token', response.refreshToken);

        return of(response);
      })
    );
  }

  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private getUserFromToken(token: string): User | null {
    try {
      // In a real app, you would decode the JWT token
      // For mock purposes, we'll extract the user ID from the token
      const payload = JSON.parse(atob(token.split('.')[1]));
      return this.mockUsers.find(u => u.id === payload.userId) || null;
    } catch {
      return null;
    }
  }

  private generateMockToken(user: User): string {
    // Mock JWT token structure
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }));
    const signature = btoa('mock-signature');
    
    return `${header}.${payload}.${signature}`;
  }
}

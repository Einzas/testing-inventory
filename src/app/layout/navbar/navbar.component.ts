import { Component, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgbDropdown, NgbDropdownMenu, NgbDropdownToggle } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, NgbDropdown, NgbDropdownMenu, NgbDropdownToggle],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  toggleSidebar = output<void>();
  
  currentUser = computed(() => this.authService.currentUser());

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}

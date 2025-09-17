import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent {
  sidebarCollapsed = signal(false);
  sidebarVisible = signal(false);

  onToggleSidebar(): void {
    // On mobile, toggle visibility
    if (window.innerWidth < 992) {
      this.sidebarVisible.update(visible => !visible);
    } else {
      // On desktop, toggle collapsed state
      this.sidebarCollapsed.update(collapsed => !collapsed);
    }
  }

  onCloseSidebar(): void {
    this.sidebarVisible.set(false);
  }
}

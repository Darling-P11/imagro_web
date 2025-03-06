import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { AuthService } from '../../services/auth.service';
import { NgClass, NgIf, TitleCasePipe } from '@angular/common';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgClass, NgIf, TitleCasePipe, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userRole: string = '';
  userName: string = '';
  userPhoto: string = '';
  userEmail: string = '';
  isLoading: boolean = true;
  isSidebarCollapsed: boolean = false;
  isHeaderVisible: boolean = true;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const role = await this.authService.getUserRole(user.uid);
        this.userRole = role || 'usuario';
        this.userName = user.displayName || 'Usuario';
        this.userEmail = user.email || 'Correo no disponible';
        this.userPhoto = user.photoURL || 'assets/icons/default-profile.png';
        this.isLoading = false;
        this.triggerAnimation();
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  // ✅ Verifica si el usuario es Administrador de Cultivo
  isAdminCultivo(): boolean {
    return this.userRole === 'administrador_cultivo';
  }

  // ✅ Verifica si el usuario es Usuario Normal
  isUsuario(): boolean {
    return this.userRole === 'usuario';
  }

  // ✅ Alternar Sidebar
  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    const mainElement = document.getElementById('main');
  
    if (this.isSidebarCollapsed) {
      mainElement?.classList.add('sidebar-collapsed');
    } else {
      mainElement?.classList.remove('sidebar-collapsed');
    }
  }
  

  // ✅ Cerrar sesión
  logout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
    }).catch((error) => {
      console.error('Error al cerrar sesión:', error);
    });
  }

  // ✅ Mostrar información de "Acerca de"
  showAbout(): void {
    alert('Imagro Web - Versión 1.0. Desarrollado por Kevin Darling Ponce Rivera.');
  }

  // ✅ Animación de entrada al cargar el dashboard
  triggerAnimation() {
    const mainContainer = document.getElementById('main');
    if (mainContainer) {
      mainContainer.classList.remove('dashboard-container');
      void mainContainer.offsetWidth; // Forzar reflow
      mainContainer.classList.add('dashboard-container');
    }
  }

  toggleHeader() {
    this.isHeaderVisible = !this.isHeaderVisible; // ✅ Alternar visibilidad
  }
}

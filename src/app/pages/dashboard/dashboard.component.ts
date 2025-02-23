import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { AuthService } from '../../services/auth.service';
import { NgClass, NgIf, TitleCasePipe } from '@angular/common'; // ✅ Importar TitleCasePipe

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgClass, NgIf, TitleCasePipe], // ✅ Agregar TitleCasePipe aquí
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userRole: string = '';
  userName: string = '';
  userPhoto: string = '';
  userEmail: string = ''; // ✅ Agregar correo electrónico
  isLoading: boolean = true;
  isSidebarCollapsed: boolean = false;

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
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  // ✅ Función para alternar el sidebar
  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    const headerElement = document.getElementById('header');
    const mainElement = document.getElementById('main');

    if (this.isSidebarCollapsed) {
      headerElement?.classList.add('sidebar-collapsed');
      mainElement?.classList.add('sidebar-collapsed');
    } else {
      headerElement?.classList.remove('sidebar-collapsed');
      mainElement?.classList.remove('sidebar-collapsed');
    }
  }

  
  
  

  logout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
    }).catch((error) => {
      console.error('Error al cerrar sesión:', error);
    });
  }

  showAbout(): void {
    alert('Imagro Web - Versión 1.0. Desarrollado por Kevin Darling Ponce Rivera.');
  }
}

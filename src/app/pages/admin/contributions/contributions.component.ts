import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContributionsService } from '../../../services/contributions.service';

@Component({
  selector: 'app-contributions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contributions.component.html',
  styleUrls: ['./contributions.component.css']
})
export class ContributionsComponent implements OnInit {
  contributions: any[] = [];
  selectedConfig: any = null;
  showConfigPopup: boolean = false;

  constructor(private contributionsService: ContributionsService) {}

  async ngOnInit() {
    this.contributions = await this.contributionsService.getPendingContributions();
  }

  // ✅ Mostrar configuración en un pop-up
  async showConfiguration(userId: string, configId: string) {
    this.selectedConfig = await this.contributionsService.getContributionConfig(userId, configId);
    this.showConfigPopup = true;
  }

  closePopup() {
    this.showConfigPopup = false;
    this.selectedConfig = null;
  }

  // ✅ Acciones
  approveContribution(id: string) {
    console.log('Aprobar contribución:', id);
  }

  denyContribution(id: string) {
    console.log('Denegar contribución:', id);
  }

  viewDetails(id: string) {
    console.log('Ver detalles de la contribución:', id);
  }
}

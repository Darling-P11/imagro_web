import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMap, MapMarker, GoogleMapsModule } from '@angular/google-maps';

@Component({
  selector: 'app-georeference',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './georeference.component.html',
  styleUrls: ['./georeference.component.css'],
})
export class GeoreferenceComponent {
  apiLoaded = false;

  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;
  zoom = 6;
  center: google.maps.LatLngLiteral = { lat: -1.8312, lng: -78.1834 }; // Ecuador
  markers: google.maps.LatLngLiteral[] = [
    { lat: -0.2299, lng: -78.5249 }, // Quito
    { lat: -2.1962, lng: -79.8862 }, // Guayaquil
    { lat: -3.9868, lng: -79.1989 }  // Loja
  ];

  constructor() {
    
  }

  
}

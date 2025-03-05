import { Component, ViewChild, ViewChildren, QueryList, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMap, MapMarker, GoogleMapsModule, MapInfoWindow } from '@angular/google-maps';
import { Firestore, collection, getDocs, query } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';

interface GeoMarker {
  latitud: number;
  longitud: number;
  cultivo: string;
  enfermedad: string;
  estado: string;
  tipo: string;
  url: string;
  usuario: string; // Agregamos el usuario que subió la imagen
}

@Component({
  selector: 'app-georeference',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule, FormsModule],
  templateUrl: './georeference.component.html',
  styleUrls: ['./georeference.component.css'],
})
export class GeoreferenceComponent implements OnInit, AfterViewInit {
  @ViewChild(GoogleMap) map!: GoogleMap;
  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;
  @ViewChildren(MapMarker) markerRefs!: QueryList<MapMarker>;

  zoom = 6;
  center: google.maps.LatLngLiteral = { lat: -1.8312, lng: -78.1834 }; // Ecuador
  options: google.maps.MapOptions = {
    disableDefaultUI: false, 
    zoomControl: true,
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
  };

  markers: GeoMarker[] = [];
  selectedMarker: GeoMarker | null = null;
  userLocation: google.maps.LatLngLiteral | null = null;

  mapTypes: { label: string, value: google.maps.MapTypeId }[] = [
    { label: 'Normal', value: google.maps.MapTypeId.ROADMAP },
    { label: 'Satélite', value: google.maps.MapTypeId.SATELLITE },
    { label: 'Híbrido', value: google.maps.MapTypeId.HYBRID },
    { label: 'Terreno', value: google.maps.MapTypeId.TERRAIN }
  ];
  selectedMapType: google.maps.MapTypeId = google.maps.MapTypeId.ROADMAP;

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    await this.loadMarkersFromFirestore();
  }

  ngAfterViewInit() {
    this.getUserLocation();
  }

  async loadMarkersFromFirestore() {
    try {
      const contribucionesRef = collection(this.firestore, `historialContribuciones`);
      const usuariosSnapshot = await getDocs(contribucionesRef);
  
      let allMarkers: GeoMarker[] = [];
  
      for (const userDoc of usuariosSnapshot.docs) {
        const userId = userDoc.id;
        const userContribucionesRef = collection(this.firestore, `historialContribuciones/${userId}/enviado`);
        const contribucionesSnapshot = await getDocs(userContribucionesRef);
  
        for (const contribucionDoc of contribucionesSnapshot.docs) {
          const data = contribucionDoc.data();
          const imagenes = data['imagenes'] || []; // Extraer correctamente el array de imágenes
  
          imagenes.forEach((img: any) => {
            allMarkers.push({
              latitud: img.latitud || 0,
              longitud: img.longitud || 0,
              cultivo: img.cultivo || 'Desconocido',
              enfermedad: img.enfermedad || 'No especificada',
              estado: img.estado || 'No disponible',
              tipo: img.tipo || 'General',
              url: img.url || '',
              usuario: userId, // Agregamos el ID del usuario
            });
          });
        }
      }
  
      this.markers = allMarkers;
      console.log("✅ Marcadores cargados:", this.markers);
    } catch (error) {
      console.error("❌ Error cargando marcadores:", error);
    }
  }
  

  getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.center = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.zoom = 12;
          this.userLocation = this.center;
          console.log("✅ Ubicación obtenida:", this.userLocation);
        },
        (error) => {
          console.error('❌ Error obteniendo ubicación:', error);
          alert('No pudimos obtener tu ubicación. Verifica los permisos en tu navegador.');
        }
      );
    } else {
      alert('Tu navegador no soporta la geolocalización.');
    }
  }

  resetMap() {
    this.center = { lat: -1.8312, lng: -78.1834 };
    this.zoom = 6;
  }

  openInfoWindow(marker: GeoMarker, mapMarker: MapMarker) {
    if (this.infoWindow) {
      this.selectedMarker = marker;
      this.infoWindow.open(mapMarker);
    } else {
      console.error('❌ Error: infoWindow no está inicializado.');
    }
  }
}

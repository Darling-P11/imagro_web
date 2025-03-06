import { Component, ViewChild, ViewChildren, QueryList, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMap, MapMarker, GoogleMapsModule, MapInfoWindow } from '@angular/google-maps';
import { Firestore, collection, getDocs, doc, collectionGroup } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';

interface GeoMarker {
  latitud: number;
  longitud: number;
  direccion?: string;
  usuario: string;
  cultivo?: string;
  enfermedad?: string;
  estado?: string;
  tipo?: string;
  url?: string;
  profileImage?: string; // ✅ Agregamos la propiedad faltante
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
      const contribucionesRef = collectionGroup(this.firestore, 'aceptado');
      const contribucionesSnapshot = await getDocs(contribucionesRef);
  
      let allMarkers: GeoMarker[] = [];
  
      for (const contribucionDoc of contribucionesSnapshot.docs) {
        const data = contribucionDoc.data();
  
        if (data['ubicacion'] && data['ubicacion']['latitud'] && data['ubicacion']['longitud']) {
          const userId = data['usuario']; // ID del usuario
  
          // Buscar la foto de perfil en Firestore
          let profileImageUrl = '';
          if (userId) {
            const userDocRef = doc(this.firestore, `users/${userId}`);
            const userDocSnap = await getDocs(collection(this.firestore, `users`));
            userDocSnap.forEach(doc => {
              if (doc.id === userId) {
                profileImageUrl = doc.data()['profileImage'] || ''; // Obtener la imagen de perfil
              }
            });
          }
  
          // Crear el marcador con la imagen de perfil
          const marker: GeoMarker = {
            latitud: data['ubicacion']['latitud'],
            longitud: data['ubicacion']['longitud'],
            direccion: data['ubicacion']['direccion'] || 'Ubicación desconocida',
            usuario: userId || 'Desconocido',
            cultivo: data['imagenes']?.[0]?.['cultivo'] || 'Sin especificar',
            enfermedad: data['imagenes']?.[0]?.['enfermedad'] || 'Sin especificar',
            estado: data['imagenes']?.[0]?.['estado'] || 'Sin especificar',
            tipo: data['imagenes']?.[0]?.['tipo'] || 'Sin especificar',
            url: data['imagenes']?.[0]?.['url'] || '',
            profileImage: profileImageUrl, // Agregar la foto de perfil
          };
  
          allMarkers.push(marker);
        }
      }
  
      this.markers = allMarkers;
    } catch (error) {
      console.error("❌ Error cargando marcadores:", error);
    }
  }
  
  //CARGA MARCADOR
  getMarkerIcon(profileImageUrl?: string): google.maps.Icon {
    return {
      url: profileImageUrl || 'assets/icons/default-marker_2.png', // Imagen de perfil o marcador por defecto
      scaledSize: new google.maps.Size(40, 40) // Tamaño del icono
    };
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

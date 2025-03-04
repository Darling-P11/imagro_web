import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMap, MapMarker, GoogleMapsModule, MapInfoWindow } from '@angular/google-maps';
import { Firestore, collection, collectionData, doc, getDocs } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

interface GeoMarker {
  latitud: number;
  longitud: number;
  cultivo: string;
  enfermedad: string;
  estado: string;
  tipo: string;
  url: string;
}

@Component({
  selector: 'app-georeference',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './georeference.component.html',
  styleUrls: ['./georeference.component.css'],
})


export class GeoreferenceComponent implements OnInit {
  apiLoaded = false;

  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;
  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;

  zoom = 6;
  center: google.maps.LatLngLiteral = { lat: -1.8312, lng: -78.1834 }; // Ecuador

  markers: GeoMarker[] = [];
  selectedMarker: GeoMarker | null = null;

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    await this.loadMarkersFromFirestore();
  }

  async loadMarkersFromFirestore() {
    const userId = 'PRWCxyVh65dsy7mwDFqVMvJF6di1'; // ID del usuario (puede ser dinámico)
    const contribucionesRef = collection(this.firestore, `historialContribuciones/${userId}/enviado`);
    const snapshot = await getDocs(contribucionesRef);

    const markersData: GeoMarker[] = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data['imagenes']) {
        data['imagenes'].forEach((img: any) => {
          markersData.push({
            latitud: img.latitud,
            longitud: img.longitud,
            cultivo: img.cultivo,
            enfermedad: img.enfermedad,
            estado: img.estado,
            tipo: img.tipo,
            url: img.url,
          });
        });
      }
      
    });

    this.markers = markersData;
  }

  openInfoWindow(marker: GeoMarker) {
    this.selectedMarker = marker;
    this.infoWindow.open();
  }
}

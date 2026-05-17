"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapPickerProps {
  center: [number, number];
  zoom?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation?: [number, number] | null;
}

function LocationMarker({ selectedLocation, onLocationSelect }: { selectedLocation?: [number, number] | null, onLocationSelect: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(
    selectedLocation ? new L.LatLng(selectedLocation[0], selectedLocation[1]) : null
  );

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    if (selectedLocation) {
      const newPos = new L.LatLng(selectedLocation[0], selectedLocation[1]);
      setPosition(newPos);
      map.flyTo(newPos, map.getZoom());
    }
  }, [selectedLocation, map]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function MapPicker({ center, zoom = 13, onLocationSelect, selectedLocation }: MapPickerProps) {
  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden border border-input z-0 relative z-10">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: "100%", width: "100%", zIndex: 1 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker selectedLocation={selectedLocation} onLocationSelect={onLocationSelect} />
      </MapContainer>
    </div>
  );
}

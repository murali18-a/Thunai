import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const API = '/api';

// District centres (approximate lat/lng for all 38 TN districts)
const DISTRICT_COORDS = {
  'Ariyalur': [11.14, 79.08], 'Chengalpattu': [12.68, 79.98], 'Chennai': [13.08, 80.27],
  'Coimbatore': [11.02, 76.96], 'Cuddalore': [11.75, 79.77], 'Dharmapuri': [12.12, 78.16],
  'Dindigul': [10.36, 77.97], 'Erode': [11.34, 77.72], 'Kallakurichi': [11.74, 78.96],
  'Kancheepuram': [12.83, 79.70], 'Kanyakumari': [8.18, 77.41], 'Karur': [10.96, 78.08],
  'Krishnagiri': [12.53, 78.21], 'Madurai': [9.93, 78.12], 'Mayiladuthurai': [11.10, 79.66],
  'Nagapattinam': [10.77, 79.84], 'Namakkal': [11.22, 78.17], 'Nilgiris': [11.41, 76.69],
  'Perambalur': [11.24, 78.88], 'Pudukkottai': [10.38, 78.80], 'Ramanathapuram': [9.36, 78.84],
  'Ranipet': [12.93, 79.33], 'Salem': [11.66, 78.15], 'Sivaganga': [10.13, 78.48],
  'Tenkasi': [8.96, 77.32], 'Thanjavur': [10.79, 79.14], 'Theni': [10.01, 77.48],
  'Thoothukudi': [8.76, 78.13], 'Tiruchirappalli': [10.81, 78.69], 'Tirunelveli': [8.71, 77.76],
  'Tirupattur': [12.50, 78.57], 'Tiruppur': [11.11, 77.34], 'Tiruvallur': [13.14, 79.91],
  'Tiruvannamalai': [12.23, 79.07], 'Thiruvarur': [10.77, 79.64], 'Vellore': [12.92, 79.13],
  'Villupuram': [11.94, 79.49], 'Virudhunagar': [9.59, 77.96],
};

export default function DistrictMap() {
  const [districts, setDistricts] = useState([]);
  const [offices, setOffices] = useState([]);

  useEffect(() => {
    fetch(`${API}/analytics/summary`).then(r => r.json()).then(data => {
      setDistricts(data.by_district || []);
    }).catch(() => {});
    fetch(`${API}/offices`).then(r => r.json()).then(data => {
      setOffices(data.offices || []);
    }).catch(() => {});
  }, []);

  const maxCount = Math.max(1, ...districts.map(d => d.count || 0));

  return (
    <div style={{ height: 500, borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <MapContainer
        center={[11.0, 78.5]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* District demand circles — sized by call volume */}
        {districts.map(d => {
          const coords = DISTRICT_COORDS[d._id];
          if (!coords) return null;
          const intensity = d.count / maxCount;
          return (
            <CircleMarker
              key={d._id}
              center={coords}
              radius={8 + intensity * 22}
              pathOptions={{
                fillColor: `hsl(${25 - intensity * 25}, 90%, ${55 - intensity * 15}%)`,
                fillOpacity: 0.7,
                color: '#f97316',
                weight: 1,
              }}
            >
              <Tooltip permanent={false}>
                <strong>{d._id}</strong>: {d.count} calls
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Office markers */}
        {offices.filter(o => o.lat && o.lng).map(o => (
          <CircleMarker
            key={o.office_id}
            center={[o.lat, o.lng]}
            radius={4}
            pathOptions={{ fillColor: '#0ea5e9', fillOpacity: 0.8, color: '#0284c7', weight: 1 }}
          >
            <Popup>
              <strong>{o.name}</strong><br/>
              {o.type} · {o.district}<br/>
              📞 {o.phone}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

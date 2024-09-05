import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

const ClientSideMap = ({ report }) => {
  useEffect(() => {
    // Fix for default marker icon
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }, []);

  const circleColor = () => {
    switch (report.severity) {
      case "low":
        return { color: "green", fillColor: "green", fillOpacity: 0.5 };
      case "medium":
        return { color: "orange", fillColor: "orange", fillOpacity: 0.5 };
      case "high":
        return { color: "red", fillColor: "red", fillOpacity: 0.5 };
      default:
        return { color: "gray", fillColor: "gray", fillOpacity: 0.5 };
    }
  };

  return (
    <MapContainer
      center={
        report.localities.length > 0 ? report.localities[0].coords : [0, 0]
      }
      zoom={12}
      maxZoom={16}
      className="z-10 h-48 w-full"
    >
      {report.localities.map((local, index) => (
        <Marker key={index} position={local.coords}>
          <Popup>{local.name}</Popup>
          <Circle
            center={local.coords}
            radius={30}
            pathOptions={circleColor()}
          />
        </Marker>
      ))}
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    </MapContainer>
  );
};

export default ClientSideMap;

"use client";

import React, { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FIND_VENDOR_BY_SERVICE, FIND_SERVICE_BY_ID } from "@/graphql/queries";
import { useQuery } from "@apollo/client";
import axios from "axios";
import dynamic from "next/dynamic";
import { FiMapPin, FiExternalLink } from "react-icons/fi";

// Dynamic import for Leaflet to ensure it only renders on client side
const LeafletMap = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const { MapContainer, TileLayer, Marker, Popup } = mod;
      return function DynamicMap({
        lat,
        lng,
        address,
        businessName,
      }: {
        lat: number;
        lng: number;
        address: string;
        businessName?: string;
      }) {
        const [icon, setIcon] = useState<any>(null);

        useEffect(() => {
          // Configure Leaflet custom marker icon
          import("leaflet").then((L) => {
            const customIcon = L.icon({
              iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
              iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
              shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            });
            setIcon(customIcon);
          });
        }, []);

        if (!icon) return <Skeleton className="h-[400px] w-full rounded-2xl" />;

        return (
          <MapContainer
            center={[lat, lng]}
            zoom={15}
            scrollWheelZoom={false}
            style={{ width: "100%", height: "400px", borderRadius: "1rem", zIndex: 0 }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lng]} icon={icon}>
              <Popup>
                <div className="font-body text-xs space-y-1">
                  {businessName && <p className="font-bold text-gray-900">{businessName}</p>}
                  <p className="text-gray-600">{address}</p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        );
      };
    }),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full rounded-2xl" />,
  }
);

interface GoogleMapComponentProps {
  serviceId: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

const defaultCenter: Coordinates = {
  lat: 6.9271,
  lng: 79.8612, // Colombo, Sri Lanka
};

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({ serviceId }) => {
  const [coordinates, setCoordinates] = useState<Coordinates>(defaultCenter);
  const [isFetchingCoordinates, setIsFetchingCoordinates] = useState(false);

  const { data: sdata, loading: serviceLoading } = useQuery(FIND_SERVICE_BY_ID, {
    variables: { id: serviceId },
    skip: !serviceId,
  });

  const { data: vdata, loading: vendorLoading, error: vendorError } = useQuery(FIND_VENDOR_BY_SERVICE, {
    variables: { service_id: serviceId },
    skip: !serviceId,
  });

  const service = sdata?.findServiceById;
  const vendorData = vdata?.findVendorsByService || vdata?.findVendorsByOffering || [];
  const vendor = service?.vendor || (vendorData.length > 0 ? vendorData[0] : null);
  const displayLocation = service?.location || service?.city || vendor?.location || vendor?.city || null;
  const businessName = vendor?.busname || service?.name;

  useEffect(() => {
    // 1. If service has direct coordinates from the map picker, use them immediately
    if (service?.latitude !== undefined && service?.latitude !== null &&
        service?.longitude !== undefined && service?.longitude !== null) {
      setCoordinates({
        lat: Number(service.latitude),
        lng: Number(service.longitude),
      });
      return;
    }

    if (!displayLocation) return;

    setIsFetchingCoordinates(true);

    const fetchCoordinates = async () => {
      try {
        // 2. First try Nominatim (OpenStreetMap)
        const osmResponse = await axios.get(
          `https://nominatim.openstreetmap.org/search`,
          {
            params: {
              q: displayLocation.includes("Sri Lanka") ? displayLocation : `${displayLocation}, Sri Lanka`,
              format: "json",
              limit: 1,
            },
            headers: {
              "Accept-Language": "en",
            },
          }
        );

        if (osmResponse.data && osmResponse.data.length > 0) {
          const { lat, lon } = osmResponse.data[0];
          setCoordinates({ lat: parseFloat(lat), lng: parseFloat(lon) });
          return;
        }


      } catch (err) {
        console.warn("Geocoding notice: Using standard location coordinates", err);
      } finally {
        setIsFetchingCoordinates(false);
      }
    };

    fetchCoordinates();
  }, [service?.latitude, service?.longitude, displayLocation]);

  if (vendorLoading || isFetchingCoordinates) {
    return (
      <div className="flex flex-col gap-3 animate-fade-in">
        <Skeleton className="w-full h-[400px] rounded-2xl" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white dark:bg-darkSurface rounded-xl border border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>
    );
  }

  if (vendorError) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-900/60">
        Failed to load vendor location.
      </div>
    );
  }

  // Google Maps directions navigation URL
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    displayLocation ? `${displayLocation}` : `${coordinates.lat},${coordinates.lng}`
  )}`;

  return (
    <div className="flex flex-col gap-3">
      {/* Map display */}
      <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-sm relative z-0 isolate">
        <LeafletMap
          lat={coordinates.lat}
          lng={coordinates.lng}
          address={displayLocation || "Sri Lanka"}
          businessName={businessName}
        />
      </div>

      {/* Address details bar & Directions button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white dark:bg-darkSurface rounded-xl border border-gray-200 dark:border-zinc-800 text-sm">
        <div className="flex items-center gap-2.5 text-gray-700 dark:text-zinc-300">
          <div className="w-8 h-8 rounded-lg bg-orange/10 flex items-center justify-center text-orange flex-shrink-0">
            <FiMapPin className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-zinc-100 leading-tight">
              {businessName ? `${businessName} Location` : "Service Location"}
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              {displayLocation || "Location available on contact"}
            </p>
          </div>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 dark:bg-darkElevated hover:bg-black dark:hover:bg-zinc-700 text-white transition-all shadow-sm active:scale-95 border border-transparent dark:border-zinc-700"
        >
          <span>Open in Google Maps</span>
          <FiExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};

export default GoogleMapComponent;
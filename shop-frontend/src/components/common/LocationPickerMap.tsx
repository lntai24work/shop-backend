"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Search, Loader2, Check } from "lucide-react";
import L from "leaflet";

export interface GeoLocationResult {
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  lat: number;
  lng: number;
}

interface LocationPickerMapProps {
  onLocationSelect: (loc: GeoLocationResult) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function LocationPickerMap({
  onLocationSelect,
  initialLat = 21.028511, // Mặc định Hà Nội
  initialLng = 105.854167,
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentAddressText, setCurrentAddressText] = useState("");

  // Create custom SVG Pin Icon to avoid Next.js image asset bundling issues
  const createPinIcon = () => {
    return L.divIcon({
      className: "custom-leaflet-marker",
      html: `
        <div style="
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ef4444;
          color: white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        ">
          <svg style="transform: rotate(45deg); width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -34],
    });
  };

  // Reverse geocode lat/lng to Vietnam address using Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      setGeocoding(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=vi`,
        {
          headers: {
            "Accept-Language": "vi,en",
          },
        }
      );
      if (!res.ok) throw new Error("Reverse geocode failed");
      const data = await res.json();
      const addr = data.address || {};

      // Parse components
      const province =
        addr.city || addr.province || addr.state || addr.region || "";
      const district =
        addr.district ||
        addr.county ||
        addr.suburb ||
        addr.city_district ||
        addr.town ||
        "";
      const ward =
        addr.quarter ||
        addr.subdistrict ||
        addr.neighbourhood ||
        addr.village ||
        "";

      const roadParts = [addr.house_number, addr.road].filter(Boolean);
      const detailAddress =
        roadParts.length > 0
          ? roadParts.join(" ")
          : addr.amenity || data.name || data.display_name?.split(",")[0] || "";

      setCurrentAddressText(data.display_name || "Vị trí đã chọn");

      onLocationSelect({
        province,
        district,
        ward,
        detailAddress,
        lat,
        lng,
      });
    } catch {
      setCurrentAddressText(`Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setGeocoding(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
      }).setView([initialLat, initialLng], 15);

      // OpenStreetMap standard tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add Draggable Marker
      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: createPinIcon(),
      }).addTo(map);

      // Marker drag event
      marker.on("dragend", (e) => {
        const pos = e.target.getLatLng();
        reverseGeocode(pos.lat, pos.lng);
      });

      // Map click event: move marker and reverse geocode
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        reverseGeocode(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Initial reverse geocode
      reverseGeocode(initialLat, initialLng);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle current GPS location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ định vị GPS.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
          reverseGeocode(latitude, longitude);
        }
        setLocating(false);
      },
      () => {
        alert("Không thể lấy vị trí hiện tại. Vui lòng cấp quyền vị trí cho trình duyệt.");
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handle Search Location
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&countrycodes=vn&limit=1&accept-language=vi`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lon], 16);
          markerRef.current.setLatLng([lat, lon]);
          reverseGeocode(lat, lon);
        }
      } else {
        alert("Không tìm thấy địa điểm này. Vui lòng thử từ khóa khác.");
      }
    } catch {
      alert("Đã có lỗi khi tìm kiếm địa điểm.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3 text-xs">
      {/* Search & GPS tools */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Tìm kiếm địa điểm (Ví dụ: Hồ Gươm, Landmark 81...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-20 py-2 text-foreground focus:ring-1 focus:ring-primary focus:outline-none text-xs"
          />
          <button
            type="submit"
            disabled={searching}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-[11px] font-medium transition-colors"
          >
            {searching ? <Loader2 size={12} className="animate-spin" /> : "Tìm"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={locating}
          className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors"
          title="Định vị vị trí hiện tại"
        >
          {locating ? (
            <Loader2 size={14} className="animate-spin text-primary" />
          ) : (
            <Navigation size={14} className="text-primary" />
          )}
          <span>Vị trí hiện tại</span>
        </button>
      </div>

      {/* Map container */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 h-64 sm:h-72 w-full shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Current address overlay */}
        <div className="absolute bottom-2 left-2 right-2 z-[400] bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-2.5 text-[11px] flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
              <MapPin size={13} />
            </div>
            <div className="truncate">
              <span className="text-muted-foreground text-[10px] block">
                {geocoding ? "Đang định vị địa chỉ..." : "Vị trí đã ghim:"}
              </span>
              <span className="text-foreground font-medium truncate block">
                {currentAddressText || "Nhấp vào bản đồ để chọn"}
              </span>
            </div>
          </div>
          {geocoding ? (
            <Loader2 size={14} className="animate-spin text-primary shrink-0" />
          ) : (
            <span className="shrink-0 text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
              Đã ghim
            </span>
          )}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground italic">
        * Mẹo: Bạn có thể nhấp chuột hoặc kéo thả ghim đỏ trên bản đồ để chọn chính xác vị trí nhận hàng.
      </p>
    </div>
  );
}

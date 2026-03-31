import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Menu, MapPin, ChevronUp, ChevronDown } from 'lucide-react';
import { SubscriptionBadge } from '@/components/driver/SubscriptionPaywall';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import LoadCard from '@/components/driver/LoadCard';
import LoadDetailModal from '@/components/driver/LoadDetailModal';
import DriverFilters, { Filters, DEFAULT_FILTERS } from '@/components/driver/DriverFilters';

// Fix leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const driverIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'hue-rotate-[200deg] brightness-150 saturate-150',
});

interface GeoLoad {
  id: string;
  title: string;
  pickup_location: string;
  delivery_location: string;
  price: number | null;
  status: string;
  pickup_date: string | null;
  equipment_type: string | null;
  urgent: boolean | null;
  weight_lbs: number | null;
  load_type: string | null;
  created_at: string;
  description: string | null;
  shipper_id: string;
  lat: number;
  lng: number;
}

// Geocoding with cache
const geoCache = new Map<string, { lat: number; lng: number }>();
async function geocode(location: string): Promise<{ lat: number; lng: number } | null> {
  if (geoCache.has(location)) return geoCache.get(location)!;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location + ', Zimbabwe')}&format=json&limit=1`
    );
    const data = await res.json();
    if (data.length > 0) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geoCache.set(location, result);
      return result;
    }
    return null;
  } catch {
    return null;
  }
}

// Component to recenter map
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

// Snap points for bottom sheet (percentage of viewport)
const SNAP_COLLAPSED = 0.12;
const SNAP_HALF = 0.4;
const SNAP_FULL = 0.85;

export default function DriverHomeView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [online, setOnline] = useState(true);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedLoad, setSelectedLoad] = useState<any | null>(null);
  const [geoLoads, setGeoLoads] = useState<GeoLoad[]>([]);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [sheetHeight, setSheetHeight] = useState(SNAP_HALF);
  const containerRef = useRef<HTMLDivElement>(null);

  // Driver location
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setDriverPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Fetch loads
  const { data: loads, isLoading } = useQuery({
    queryKey: ['home-loads-driver'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loads')
        .select('*')
        .eq('status', 'posted')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('loads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, () => {
        queryClient.invalidateQueries({ queryKey: ['home-loads-driver'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Geocode loads
  useEffect(() => {
    if (!loads?.length) return;
    const geocodeAll = async () => {
      const results: GeoLoad[] = [];
      for (let i = 0; i < loads.length; i += 3) {
        const batch = loads.slice(i, i + 3);
        const geos = await Promise.all(
          batch.map(async (load: any) => {
            const coords = await geocode(load.pickup_location);
            if (coords) return { ...load, lat: coords.lat, lng: coords.lng } as GeoLoad;
            return null;
          })
        );
        results.push(...(geos.filter(Boolean) as GeoLoad[]));
        if (i + 3 < loads.length) await new Promise((r) => setTimeout(r, 1100));
      }
      setGeoLoads(results);
    };
    geocodeAll();
  }, [loads]);

  // Filter loads
  const filteredLoads = useMemo(() => {
    if (!loads) return [];
    return loads.filter((l: any) => {
      if (filters.minPrice > 0 && (l.price || 0) < filters.minPrice) return false;
      if (filters.equipment.length && !filters.equipment.includes(l.equipment_type || '')) return false;
      if (filters.cargoType.length && !filters.cargoType.includes(l.load_type || '')) return false;
      if (filters.urgentOnly && !l.urgent) return false;
      return true;
    });
  }, [loads, filters]);

  // Bottom sheet drag handler
  const handleDrag = useCallback((_: any, info: PanInfo) => {
    const vh = window.innerHeight;
    const delta = -info.offset.y / vh;
    const newHeight = Math.max(SNAP_COLLAPSED, Math.min(SNAP_FULL, sheetHeight + delta));

    // Snap to nearest
    const snaps = [SNAP_COLLAPSED, SNAP_HALF, SNAP_FULL];
    const closest = snaps.reduce((a, b) =>
      Math.abs(b - newHeight) < Math.abs(a - newHeight) ? b : a
    );
    setSheetHeight(closest);
  }, [sheetHeight]);

  const toggleSheet = () => {
    if (sheetHeight <= SNAP_COLLAPSED) setSheetHeight(SNAP_HALF);
    else if (sheetHeight <= SNAP_HALF) setSheetHeight(SNAP_FULL);
    else setSheetHeight(SNAP_HALF);
  };

  const mapCenter = driverPos || { lat: -19.0154, lng: 29.1549 };

  return (
    <div ref={containerRef} className="fixed inset-0 z-0">
      {/* Full-screen map */}
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={driverPos ? 10 : 6}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; CARTO'
        />
        {driverPos && <RecenterMap lat={driverPos.lat} lng={driverPos.lng} />}

        {/* Driver marker */}
        {driverPos && (
          <Marker position={[driverPos.lat, driverPos.lng]} icon={driverIcon}>
            <Popup>Your location</Popup>
          </Marker>
        )}

        {/* Load pins */}
        {geoLoads.map((load) => (
          <Marker
            key={load.id}
            position={[load.lat, load.lng]}
            eventHandlers={{ click: () => setSelectedLoad(load) }}
          >
            <Popup>
              <div className="min-w-[140px]">
                <p className="font-semibold text-sm">{load.title}</p>
                <p className="text-xs text-muted-foreground">
                  {load.pickup_location} → {load.delivery_location}
                </p>
                <p className="text-sm font-bold mt-1">${Number(load.price || 0).toLocaleString()}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Top bar overlay */}
      <div className="absolute top-0 left-0 right-0 z-[1000] safe-top">
        <div className="mx-3 mt-3 flex items-center justify-between">
          {/* Location */}
          <div className="flex items-center gap-2 bg-card/90 backdrop-blur-md rounded-full px-3 py-2 border border-border shadow-lg">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium truncate max-w-[140px]">
              {driverPos ? 'Your Location' : 'Zimbabwe'}
            </span>
          </div>
          <SubscriptionBadge />

          {/* Online toggle + filters */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-card/90 backdrop-blur-md rounded-full px-3 py-2 border border-border shadow-lg">
              <span className={`text-[10px] font-bold ${online ? 'text-primary' : 'text-muted-foreground'}`}>
                {online ? 'ONLINE' : 'OFFLINE'}
              </span>
              <Switch
                checked={online}
                onCheckedChange={setOnline}
                className="h-4 w-8 data-[state=checked]:bg-green-500"
              />
            </div>
            <DriverFilters filters={filters} onChange={setFilters} />
          </div>
        </div>
      </div>

      {/* Draggable bottom sheet */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-[1000] bg-background rounded-t-2xl border-t border-border shadow-2xl"
        style={{ height: `${sheetHeight * 100}vh` }}
        animate={{ height: `${sheetHeight * 100}vh` }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Drag handle */}
        <div
          className="flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
          onClick={toggleSheet}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          <div className="flex items-center gap-1 mt-1">
            {sheetHeight >= SNAP_FULL ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-3 w-3 text-muted-foreground" />
            )}
            <span className="text-[10px] text-muted-foreground font-medium">
              {filteredLoads.length} loads available
            </span>
          </div>
        </div>

        {/* Load list */}
        <div className="overflow-y-auto px-3 pb-24" style={{ height: `calc(${sheetHeight * 100}vh - 44px)` }}>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredLoads.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <p className="text-sm font-medium text-muted-foreground">No loads match your filters</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLoads.map((load: any) => (
                <LoadCard
                  key={load.id}
                  load={load}
                  onTap={() => setSelectedLoad(load)}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Load detail modal */}
      <LoadDetailModal
        load={selectedLoad}
        open={!!selectedLoad}
        onClose={() => setSelectedLoad(null)}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, MapPin, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface GeoLoad {
  id: string;
  title: string;
  pickup_location: string;
  delivery_location: string;
  price: number;
  status: string;
  pickup_date: string | null;
  equipment_type: string | null;
  urgent: boolean | null;
  lat: number;
  lng: number;
}

async function geocode(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location + ', Zimbabwe')}&format=json&limit=1`
    );
    const data = await res.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    return null;
  } catch {
    return null;
  }
}

export default function DriverHomeView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [geoLoads, setGeoLoads] = useState<GeoLoad[]>([]);
  const [mapView, setMapView] = useState(true);

  const { data: loads, isLoading } = useQuery({
    queryKey: ['home-loads-driver'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loads')
        .select('*')
        .eq('status', 'posted')
        .order('created_at', { ascending: false })
        .limit(15);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

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

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div>
        <h2 className="text-lg font-bold">Nearby Loads</h2>
        <p className="text-xs text-muted-foreground">{geoLoads.length} loads found near you</p>
      </div>

      {/* Toggle */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button onClick={() => setMapView(true)} className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${mapView ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
          Map View
        </button>
        <button onClick={() => setMapView(false)} className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${!mapView ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
          List View
        </button>
      </div>

      {/* Map */}
      <AnimatePresence mode="wait">
        {mapView && (
          <motion.div
            key="map"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 320 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl overflow-hidden border border-border"
          >
            <MapContainer
              center={[-19.0154, 29.1549]}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; CARTO'
              />
              {geoLoads.map((load) => (
                <Marker key={load.id} position={[load.lat, load.lng]}>
                  <Popup>
                    <div className="min-w-[160px]">
                      <p className="font-semibold text-sm">{load.title}</p>
                      <div className="flex items-center gap-1 text-xs mt-1">
                        <MapPin className="h-3 w-3" />
                        {load.pickup_location} → {load.delivery_location}
                      </div>
                      <div className="flex items-center gap-1 text-xs mt-0.5">
                        <DollarSign className="h-3 w-3" />${Number(load.price).toFixed(0)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Load cards below map */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : !loads?.length ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Package className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No loads nearby</p>
          <p className="text-xs text-muted-foreground mt-1">Check back soon for new postings</p>
        </div>
      ) : (
        <div className="space-y-2">
          {loads.map((load: any, i: number) => (
            <motion.div
              key={load.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card
                className="cursor-pointer hover:border-primary/30 transition-all"
                onClick={() => navigate('/driver/loads')}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-sm font-medium truncate">{load.title}</p>
                        {load.urgent && (
                          <Badge variant="outline" className="text-[9px] bg-destructive/10 text-destructive border-destructive/30 shrink-0">
                            🚨
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{load.pickup_location} → {load.delivery_location}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">${Number(load.price).toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {load.pickup_date ? format(new Date(load.pickup_date), 'MMM d') : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

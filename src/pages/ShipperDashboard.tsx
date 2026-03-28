import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, MapPin, Calendar, DollarSign, Package, Truck, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import LoadChat from '@/components/LoadChat';
import { BidList } from '@/components/BidSystem';
import { AICarrierMatch, AIDynamicPricing } from '@/components/AILoadInsights';
import StatusMilestones from '@/components/StatusMilestones';
import BottomTabs from '@/components/BottomTabs';
import ChatListView from '@/components/ChatListView';
import SettingsView from '@/components/SettingsView';
import LoadMapView from '@/components/LoadMapView';
import RouteMap from '@/components/RouteMap';
import CargoPhotoUpload from '@/components/CargoPhotoUpload';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { useLoadDraft } from '@/hooks/useLoadDraft';
import LiveTrackingMap from '@/components/LiveTrackingMap';
import { Routes, Route } from 'react-router-dom';
import { useLoadNotifications } from '@/hooks/useLoadNotifications';

const statusColors: Record<string, string> = {
  posted: 'bg-primary/10 text-primary border-primary/30',
  accepted: 'bg-primary/10 text-primary border-primary/30',
  in_transit: 'bg-warning/10 text-warning border-warning/30',
  delivered: 'bg-success/10 text-success border-success/30',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
};

function ShipperLoads() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chatLoadId, setChatLoadId] = useState<string | null>(null);
  const { draft, updateField, clearDraft, hasDraft } = useLoadDraft();
  const [cargoPhotos, setCargoPhotos] = useState<string[]>([]);

  const { data: loads, isLoading } = useQuery({
    queryKey: ['shipper-loads', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loads')
        .select('*')
        .eq('shipper_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const acceptBid = useMutation({
    mutationFn: async ({ bidId, driverId, amount, loadId }: { bidId: string; driverId: string; amount: number; loadId: string }) => {
      const { error: bidError } = await supabase.from('bids').update({ status: 'accepted' }).eq('id', bidId);
      if (bidError) throw bidError;
      await supabase.from('bids').update({ status: 'rejected' }).eq('load_id', loadId).neq('id', bidId).eq('status', 'pending');
      const platformFee = amount * 0.1;
      const { error: loadError } = await supabase.from('loads').update({
        driver_id: driverId, status: 'accepted', price: amount, platform_fee: platformFee,
        accepted_at: new Date().toISOString(),
      }).eq('id', loadId);
      if (loadError) throw loadError;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shipper-loads'] }); toast.success('Bid accepted!'); },
    onError: (err: any) => toast.error(err.message),
  });

  const createLoad = useMutation({
    mutationFn: async (form: any) => {
      const { error } = await supabase.from('loads').insert({
        shipper_id: user!.id, title: form.title, description: form.description || null,
        pickup_location: form.pickup_location, delivery_location: form.delivery_location,
        pickup_date: new Date(form.pickup_date).toISOString(), price: parseFloat(form.price),
        weight_lbs: form.weight_lbs ? parseFloat(form.weight_lbs) : null,
        equipment_type: form.equipment_type || null, load_type: form.load_type, payment_method: form.payment_method,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipper-loads'] });
      toast.success('Load posted!');
      setDialogOpen(false);
      clearDraft();
      setCargoPhotos([]);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createLoad.mutate({
      ...draft,
      cargo_photos: cargoPhotos.length > 0 ? cargoPhotos : undefined,
    });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">My Loads</h2>
        <div className="flex items-center gap-2">
          {hasDraft && !dialogOpen && (
            <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/30 cursor-pointer" onClick={() => setDialogOpen(true)}>
              Draft saved
            </Badge>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> Post Load</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader><DialogTitle>Post a New Load</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" placeholder="e.g. Harare to Bulawayo - 20t" required value={draft.title} onChange={(e) => updateField('title', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="Load details..." rows={2} value={draft.description} onChange={(e) => updateField('description', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="pickup_location">Pickup</Label>
                    <AddressAutocomplete id="pickup_location" placeholder="Start typing a city..." required value={draft.pickup_location} onChange={(v) => updateField('pickup_location', v)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery_location">Delivery</Label>
                    <AddressAutocomplete id="delivery_location" placeholder="Start typing a city..." required value={draft.delivery_location} onChange={(v) => updateField('delivery_location', v)} />
                  </div>
                </div>

                {/* Route Map with OSRM distance + price */}
                {draft.pickup_location && draft.delivery_location && (
                  <RouteMap
                    pickup={draft.pickup_location}
                    delivery={draft.delivery_location}
                    onRouteCalculated={(info) => {
                      if (!draft.price) updateField('price', String(info.suggestedPrice));
                    }}
                  />
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="pickup_date">Pickup Date</Label>
                    <Input id="pickup_date" name="pickup_date" type="date" required value={draft.pickup_date} onChange={(e) => updateField('pickup_date', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pickup_time">Pickup Time</Label>
                    <Input id="pickup_time" name="pickup_time" type="time" value={draft.pickup_time || ''} onChange={(e) => updateField('pickup_time', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="price">Budget (USD)</Label>
                    <Input id="price" name="price" type="number" step="0.01" placeholder="Auto-calculated" required value={draft.price} onChange={(e) => updateField('price', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight_lbs">Weight (kg)</Label>
                    <Input id="weight_lbs" name="weight_lbs" type="number" placeholder="Optional" value={draft.weight_lbs} onChange={(e) => updateField('weight_lbs', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipment_type">Equipment / Truck Type</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={draft.equipment_type} onChange={(e) => updateField('equipment_type', e.target.value)}>
                    <option value="">Select truck type</option>
                    <option value="Flatbed">Flatbed</option>
                    <option value="Enclosed">Enclosed / Box Body</option>
                    <option value="Refrigerated">Refrigerated (Reefer)</option>
                    <option value="Tanker">Tanker</option>
                    <option value="Lowbed">Lowbed / Low Loader</option>
                    <option value="Tipper">Tipper / Dump Truck</option>
                    <option value="Curtain-side">Curtain-side</option>
                    <option value="Container">Container Carrier</option>
                    <option value="Car Carrier">Car Carrier</option>
                    <option value="Livestock">Livestock Carrier</option>
                    <option value="Logging">Logging Truck</option>
                    <option value="Side Loader">Side Loader</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Load Type</Label>
                    <select name="load_type" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={draft.load_type} onChange={(e) => updateField('load_type', e.target.value)}>
                      <option value="FTL">Full Truck Load</option><option value="LTL">Less Than Truckload</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment</Label>
                    <select name="payment_method" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={draft.payment_method} onChange={(e) => updateField('payment_method', e.target.value)}>
                      <option value="cash">Cash</option><option value="transfer">Bank Transfer</option><option value="ecocash">EcoCash</option>
                    </select>
                  </div>
                </div>

                {/* Urgent toggle */}
                <div className="flex items-center justify-between rounded-lg border border-input p-3">
                  <div>
                    <p className="text-sm font-medium">🚨 Urgent Shipment</p>
                    <p className="text-xs text-muted-foreground">Mark if this load needs priority handling</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={draft.urgent === 'true'} onChange={(e) => updateField('urgent', e.target.checked ? 'true' : 'false')} />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-destructive after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                {/* Cargo Photo Upload */}
                <CargoPhotoUpload photos={cargoPhotos} onPhotosChange={setCargoPhotos} />

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={createLoad.isPending}>
                    {createLoad.isPending ? 'Posting...' : 'Post Load'}
                  </Button>
                  {hasDraft && (
                    <Button type="button" variant="outline" size="sm" onClick={clearDraft}>
                      Clear Draft
                    </Button>
                  )}
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : !loads?.filter((l: any) => l.status !== 'delivered').length ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted"><Truck className="h-8 w-8 text-muted-foreground" /></div>
          <h3 className="text-lg font-semibold">No loads yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Post your first load to find carriers</p>
          <Button className="mt-4" onClick={() => setDialogOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Post Your First Load</Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {loads.filter((l: any) => l.status !== 'delivered').map((load: any, i: number) => (
              <motion.div key={load.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06 }}>
                <Card className="overflow-hidden border-border/60 hover:border-primary/30 transition-all">
                  <CardContent className="p-0">
                    {/* Uber Freight-style compact header */}
                    <div className="flex items-center justify-between px-4 pt-3 pb-2">
                      <Badge variant="outline" className={`text-[10px] uppercase tracking-wide font-semibold ${statusColors[load.status] || ''}`}>
                        {load.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm font-bold text-foreground">${Number(load.price).toFixed(0)}</span>
                    </div>

                    {/* Route line */}
                    <div className="px-4 pb-3">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-0.5 pt-1">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <div className="w-px h-6 bg-border" />
                          <div className="h-2 w-2 rounded-full border-2 border-primary" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Pickup</p>
                            <p className="text-sm font-medium truncate">{load.pickup_location}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Delivery</p>
                            <p className="text-sm font-medium truncate">{load.delivery_location}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setChatLoadId(chatLoadId === load.id ? null : load.id)}>
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 border-t border-border/40 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground truncate">{load.title}</span>
                      <span className="ml-auto shrink-0">{load.pickup_date ? format(new Date(load.pickup_date), 'MMM d') : ''}</span>
                      {load.equipment_type && <span>· {load.equipment_type}</span>}
                    </div>

                    {['accepted', 'in_transit'].includes(load.status) && (
                      <div className="px-4 py-3 border-t border-border/40 space-y-3">
                        <StatusMilestones currentStatus={load.status} />
                        {load.status === 'in_transit' && load.driver_id && (
                          <LiveTrackingMap
                            loadId={load.id}
                            driverId={load.driver_id}
                            pickupLocation={load.pickup_location}
                            deliveryLocation={load.delivery_location}
                          />
                        )}
                      </div>
                    )}

                    {load.status === 'posted' && (
                      <div className="px-4 py-3 border-t border-border/40 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <AICarrierMatch load={load} />
                          <AIDynamicPricing load={load} />
                        </div>
                        <BidList loadId={load.id} onAcceptBid={(bidId, driverId, amount) => acceptBid.mutate({ bidId, driverId, amount, loadId: load.id })} />
                      </div>
                    )}
                    {chatLoadId === load.id && (
                      <div className="px-4 py-3 border-t border-border/40"><LoadChat loadId={load.id} /></div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}

export default function ShipperDashboard() {
  const { user, profile } = useAuth();
  useLoadNotifications(user?.id, 'shipper');

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="px-4 flex h-14 items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Package className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-black leading-tight">Hauliq</h1>
            <p className="text-[11px] text-muted-foreground">{profile?.full_name || 'Shipper'}</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-4">
        <Routes>
          <Route index element={<ShipperLoads />} />
          <Route path="map" element={<LoadMapView role="shipper" />} />
          <Route path="chat" element={<ChatListView />} />
          <Route path="settings" element={<SettingsView role="shipper" />} />
        </Routes>
      </main>

      <BottomTabs role="shipper" />
    </div>
  );
}

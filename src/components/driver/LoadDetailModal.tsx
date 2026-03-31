import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, Clock, DollarSign, Truck, MessageCircle, Gavel, CheckCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionPaywall from './SubscriptionPaywall';

interface LoadDetailModalProps {
  load: any | null;
  open: boolean;
  onClose: () => void;
}

export default function LoadDetailModal({ load, open, onClose }: LoadDetailModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isActive: hasSubscription } = useSubscription();
  const [bidAmount, setBidAmount] = useState('');
  const [bidNote, setBidNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  if (!load) return null;

  const guardAction = (action: () => void) => {
    if (!hasSubscription) {
      setShowPaywall(true);
      return;
    }
    action();
  };

  const handleBid = async () => {
    if (!user || !bidAmount) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('bids').insert({
        load_id: load.id,
        driver_id: user.id,
        amount: parseFloat(bidAmount),
        note: bidNote || null,
      });
      if (error) throw error;
      toast.success('Bid placed successfully!');
      setShowBidForm(false);
      setBidAmount('');
      setBidNote('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('loads')
        .update({ driver_id: user.id, status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', load.id)
        .eq('status', 'posted');
      if (error) throw error;
      toast.success('Load accepted!');
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to accept load');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            <SheetHeader className="p-4 pb-2 border-b border-border">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-base font-bold">{load.title}</SheetTitle>
                {load.urgent && <Badge variant="destructive" className="text-xs">🚨 Urgent</Badge>}
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Route */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-0.5 pt-1">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <div className="w-px h-8 bg-border" />
                  <div className="h-3 w-3 rounded-full bg-destructive" />
                </div>
                <div className="space-y-3">
                  <div><p className="text-xs text-muted-foreground">Pickup</p><p className="text-sm font-medium">{load.pickup_location}</p></div>
                  <div><p className="text-xs text-muted-foreground">Delivery</p><p className="text-sm font-medium">{load.delivery_location}</p></div>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1"><DollarSign className="h-3.5 w-3.5" /><span className="text-xs">Price</span></div>
                  <p className="text-lg font-black text-primary">${Number(load.price || 0).toLocaleString()}</p>
                </div>
                {load.weight_lbs && (
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1"><Package className="h-3.5 w-3.5" /><span className="text-xs">Weight</span></div>
                    <p className="text-sm font-semibold">{load.weight_lbs.toLocaleString()} lbs</p>
                  </div>
                )}
                {load.equipment_type && (
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1"><Truck className="h-3.5 w-3.5" /><span className="text-xs">Equipment</span></div>
                    <p className="text-sm font-semibold">{load.equipment_type}</p>
                  </div>
                )}
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1"><Clock className="h-3.5 w-3.5" /><span className="text-xs">Posted</span></div>
                  <p className="text-sm font-semibold">{formatDistanceToNow(new Date(load.created_at), { addSuffix: true })}</p>
                </div>
              </div>

              {load.pickup_date && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Pickup Date</p>
                  <p className="text-sm font-semibold">{format(new Date(load.pickup_date), 'PPP')}</p>
                </div>
              )}
              {load.description && (
                <div><p className="text-xs text-muted-foreground mb-1">Description</p><p className="text-sm">{load.description}</p></div>
              )}

              {/* Bid form */}
              {showBidForm && (
                <div className="bg-muted rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold">Place Your Bid</p>
                  <Input type="number" placeholder="Your bid amount ($)" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} />
                  <Textarea placeholder="Add a note (optional)" value={bidNote} onChange={(e) => setBidNote(e.target.value)} rows={2} />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowBidForm(false)} className="flex-1">Cancel</Button>
                    <Button size="sm" onClick={handleBid} disabled={submitting || !bidAmount} className="flex-1">{submitting ? 'Submitting...' : 'Submit Bid'}</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky actions - subscription gated */}
            <div className="border-t border-border p-4 bg-card space-y-2">
              <div className="flex gap-2">
                <Button onClick={() => guardAction(handleAccept)} disabled={submitting} className="flex-1 h-12 text-sm font-bold">
                  <CheckCircle className="h-4 w-4 mr-1" /> Accept Load
                </Button>
                <Button variant="outline" onClick={() => guardAction(() => setShowBidForm(!showBidForm))} className="flex-1 h-12 text-sm font-bold">
                  <Gavel className="h-4 w-4 mr-1" /> Place Bid
                </Button>
              </div>
              <Button variant="ghost" className="w-full h-10 text-sm" onClick={() => { onClose(); navigate('/driver/chat'); }}>
                <MessageCircle className="h-4 w-4 mr-1" /> Chat with Shipper
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Subscription paywall modal */}
      <SubscriptionPaywall open={showPaywall} onClose={() => setShowPaywall(false)} />
    </>
  );
}

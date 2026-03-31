import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Lock, Smartphone, Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const carriers = [
  { value: 'EcoCash', label: 'EcoCash' },
  { value: 'InnBucks', label: 'InnBucks' },
  { value: 'OneMoney', label: 'OneMoney' },
  { value: 'Telecash', label: 'Telecash' },
];

interface SubscriptionPaywallProps {
  open: boolean;
  onClose: () => void;
}

export default function SubscriptionPaywall({ open, onClose }: SubscriptionPaywallProps) {
  const { user } = useAuth();
  const { isPending, isFailed } = useSubscription();
  const [phone, setPhone] = useState('');
  const [carrier, setCarrier] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!phone || !carrier || !user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('contipay-subscribe', {
        body: { phone_number: phone, carrier_type: carrier },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success(data.message || 'Payment prompt sent! Check your phone.');
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || 'Payment failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">Subscribe to Hauliq</DialogTitle>
              <DialogDescription className="text-xs">
                Unlock bidding and load acceptance
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {isPending && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <Clock className="h-5 w-5 text-accent-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">Payment Pending</p>
                <p className="text-xs text-muted-foreground">Check your phone for the USSD prompt.</p>
              </div>
            </div>
          )}

          {isFailed && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Last payment failed</p>
                <p className="text-xs text-muted-foreground">Try again below.</p>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-2xl font-black text-primary">$35<span className="text-sm font-medium text-muted-foreground">/month</span></p>
            <p className="text-xs text-muted-foreground mt-1">Accept loads & place bids on all shipments</p>
          </div>

          <div className="space-y-3">
            <Select value={carrier} onValueChange={setCarrier}>
              <SelectTrigger>
                <SelectValue placeholder="Select mobile money provider" />
              </SelectTrigger>
              <SelectContent>
                {carriers.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Phone number (e.g. 0771234567)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              maxLength={15}
            />
          </div>

          <Button className="w-full h-12 text-sm font-bold" onClick={handlePay} disabled={loading || !phone || !carrier}>
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending prompt...</>
            ) : (
              <><Smartphone className="h-4 w-4 mr-2" />Pay $35.00</>
            )}
          </Button>

          <p className="text-[10px] text-center text-muted-foreground">
            Secured by ContiPay · USSD prompt sent to your phone
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Badge component for home screen
export function SubscriptionBadge() {
  const { isActive, isPending, isLoading } = useSubscription();

  if (isLoading) return null;

  if (isActive) {
    return (
      <Badge variant="outline" className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/30">
        <CheckCircle className="h-2.5 w-2.5" /> PRO
      </Badge>
    );
  }

  if (isPending) {
    return (
      <Badge variant="outline" className="text-[10px] gap-1 bg-accent/10 text-accent-foreground border-accent/30 animate-pulse">
        <Clock className="h-2.5 w-2.5" /> Pending
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-[10px] gap-1 bg-destructive/10 text-destructive border-destructive/30">
      <Lock className="h-2.5 w-2.5" /> Free
    </Badge>
  );
}

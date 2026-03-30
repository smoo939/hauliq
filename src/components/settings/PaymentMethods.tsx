import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const carriers = [
  { value: 'EcoCash', label: 'EcoCash' },
  { value: 'InnBucks', label: 'InnBucks' },
  { value: 'OneMoney', label: 'OneMoney' },
  { value: 'Telecash', label: 'Telecash' },
];

export default function PaymentMethods({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [carrier, setCarrier] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('driver_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setSubscription(data);
        setChecking(false);
      });
  }, [user]);

  const isActive = subscription?.status === 'active' && new Date(subscription.expires_at) > new Date();

  const handlePay = async () => {
    if (!phone || !carrier) {
      toast.error('Please enter your phone number and select a carrier.');
      return;
    }
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
        // Refresh subscription status
        const { data: sub } = await supabase
          .from('driver_subscriptions')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setSubscription(sub);
      }
    } catch (err: any) {
      toast.error(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-primary font-medium hover:underline">
        ← Back to Settings
      </button>
      <h2 className="text-lg font-semibold">Carrier Subscription</h2>
      <p className="text-xs text-muted-foreground">
        Pay $35/month to accept and bid on loads
      </p>

      {/* Subscription Status */}
      {isActive ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-primary">
                Subscription Active
              </p>
              <p className="text-xs text-muted-foreground">
                Expires {new Date(subscription.expires_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : subscription?.status === 'pending' ? (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-accent-foreground shrink-0" />
            <div>
              <p className="text-sm font-semibold text-accent-foreground">
                Payment Pending
              </p>
              <p className="text-xs text-muted-foreground">
                Check your phone for the payment prompt and enter your PIN.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : subscription?.status === 'failed' ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-semibold text-destructive">Payment Failed</p>
              <p className="text-xs text-muted-foreground">
                Your last payment didn't go through. Please try again below.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Payment Form */}
      {!isActive && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <Smartphone className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Pay via Mobile Money</p>
                <p className="text-xs text-muted-foreground">
                  A USSD prompt will be sent to your phone
                </p>
              </div>
            </div>

            <Select value={carrier} onValueChange={setCarrier}>
              <SelectTrigger>
                <SelectValue placeholder="Select mobile money provider" />
              </SelectTrigger>
              <SelectContent>
                {carriers.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
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

            <div className="rounded-lg bg-muted p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly subscription</span>
                <span className="font-bold">$35.00</span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handlePay}
              disabled={loading || !phone || !carrier}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending payment prompt...
                </>
              ) : (
                'Pay $35.00'
              )}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground">
              Secured by ContiPay. You'll receive a USSD prompt on your phone.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

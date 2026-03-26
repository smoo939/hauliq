import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DollarSign, User, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface BidFormProps {
  loadId: string;
}

export function BidForm({ loadId }: BidFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('bids').insert({
        load_id: loadId,
        driver_id: user.id,
        amount: parseFloat(amount),
        message: message || null,
      });
      if (error) throw error;
      toast.success('Bid submitted!');
      setAmount('');
      setMessage('');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['available-loads'] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <Button size="sm" variant="default" onClick={() => setShowForm(true)}>
        <DollarSign className="mr-1.5 h-3.5 w-3.5" /> Place Bid
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Input
        type="number"
        step="0.01"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Amount (USD)"
        className="w-32 text-sm"
      />
      <Input
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Note (optional)"
        className="w-40 text-sm"
      />
      <Button size="sm" onClick={handleSubmit} disabled={submitting || !amount}>
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

interface BidListProps {
  loadId: string;
  onAcceptBid: (bidId: string, driverId: string, amount: number) => void;
}

export function BidList({ loadId, onAcceptBid }: BidListProps) {
  const { data: bids, isLoading } = useQuery({
    queryKey: ['load-bids', loadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('load_id', loadId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch driver profiles
      const driverIds = data.map((b: any) => b.driver_id);
      if (driverIds.length === 0) return [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', driverIds);
      const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));
      return data.map((bid: any) => ({ ...bid, driver_profile: profileMap[bid.driver_id] }));
    },
    refetchInterval: 10000,
  });

  if (isLoading) return <p className="text-xs text-muted-foreground">Loading bids...</p>;
  if (!bids?.length) return <p className="text-xs text-muted-foreground">No bids yet</p>;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{bids.length} bid{bids.length !== 1 ? 's' : ''}</p>
      {bids.map((bid: any) => (
        <div key={bid.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{bid.driver_profile?.full_name || 'Driver'}</p>
              {bid.message && <p className="text-xs text-muted-foreground truncate">{bid.message}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-semibold tabular-nums">${Number(bid.amount).toFixed(2)}</span>
            {bid.status === 'pending' && (
              <Button size="sm" variant="default" onClick={() => onAcceptBid(bid.id, bid.driver_id, Number(bid.amount))}>
                Accept
              </Button>
            )}
            {bid.status !== 'pending' && (
              <Badge variant="outline" className={bid.status === 'accepted' ? 'text-success border-success/30' : 'text-muted-foreground'}>
                {bid.status}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['driver-subscription', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  // Realtime updates for subscription status
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('subscription-status')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'driver_subscriptions',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['driver-subscription', user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const isActive = !!(
    subscription?.status === 'active' &&
    subscription?.expires_at &&
    new Date(subscription.expires_at) > new Date()
  );

  const isPending = subscription?.status === 'pending';
  const isFailed = subscription?.status === 'failed';

  return { subscription, isActive, isPending, isFailed, isLoading };
}

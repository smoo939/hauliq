
-- Fix overly permissive RLS on bids UPDATE
DROP POLICY "Load owners can update bids" ON public.bids;
CREATE POLICY "Load owners can update bids" ON public.bids FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.loads WHERE loads.id = bids.load_id AND loads.shipper_id = auth.uid()));

-- Fix overly permissive RLS on notifications INSERT
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

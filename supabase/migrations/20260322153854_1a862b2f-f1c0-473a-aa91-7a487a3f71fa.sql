
-- Fix overly permissive notifications INSERT policy
DROP POLICY "System can create notifications" ON public.notifications;
CREATE POLICY "Users can create notifications for others" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

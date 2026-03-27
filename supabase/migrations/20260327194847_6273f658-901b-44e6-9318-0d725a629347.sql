
ALTER TABLE public.driver_verifications
  ADD COLUMN IF NOT EXISTS manual_review_requested boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_review_notes text;

ALTER TABLE public.truck_verifications
  ADD COLUMN IF NOT EXISTS manual_review_requested boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_review_notes text;

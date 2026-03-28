ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS urgent boolean DEFAULT false;
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS pickup_time text;
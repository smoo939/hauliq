-- Driver verifications table
CREATE TABLE public.driver_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  license_url text,
  license_number text,
  license_expiry date,
  license_name text,
  national_id_url text,
  national_id_number text,
  national_id_name text,
  selfie_url text,
  selfie_match_score numeric,
  license_status text NOT NULL DEFAULT 'pending',
  id_status text NOT NULL DEFAULT 'pending',
  selfie_status text NOT NULL DEFAULT 'pending',
  overall_status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Truck verifications table
CREATE TABLE public.truck_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  truck_label text,
  registration_url text,
  registration_number text,
  registration_expiry date,
  insurance_url text,
  insurance_number text,
  insurance_expiry date,
  truck_photo_url text,
  plate_from_photo text,
  reg_status text NOT NULL DEFAULT 'pending',
  insurance_status text NOT NULL DEFAULT 'pending',
  photo_status text NOT NULL DEFAULT 'pending',
  overall_status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.driver_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.truck_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own driver verification" ON public.driver_verifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own driver verification" ON public.driver_verifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own driver verification" ON public.driver_verifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can view own truck verifications" ON public.truck_verifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own truck verifications" ON public.truck_verifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own truck verifications" ON public.truck_verifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-documents', 'verification-documents', false);

-- Storage RLS
CREATE POLICY "Users can upload verification docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'verification-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own verification docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'verification-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

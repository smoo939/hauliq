DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

-- Also allow reading truck verifications for bid display (non-sensitive fields only)
DROP POLICY IF EXISTS "Users can view own truck verifications" ON public.truck_verifications;
CREATE POLICY "Authenticated can view truck verifications" ON public.truck_verifications FOR SELECT TO authenticated USING (true);
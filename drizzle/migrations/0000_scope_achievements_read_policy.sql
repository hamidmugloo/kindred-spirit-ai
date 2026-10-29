DROP POLICY IF EXISTS "Achievements are viewable by authenticated users" ON public.achievements;

CREATE POLICY "Achievements catalog is viewable by all signed-in users"
  ON public.achievements
  FOR SELECT
  TO authenticated
  USING (id IS NOT NULL);
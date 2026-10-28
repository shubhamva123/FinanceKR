
-- Migration: Secure signup and profile permissions

-- 1. Helper function: check whether the current user is an admin.
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_user_admin()
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_current_user_admin()
TO authenticated;


-- 2. Replace the financer SELECT policy.
DROP POLICY IF EXISTS "select_own_financer" ON public.financers;

CREATE POLICY "select_own_financer"
ON public.financers
FOR SELECT
TO authenticated
USING (
  id = public.get_user_financer_id()
  OR public.is_current_user_admin()
);


-- 3. Replace the profile SELECT policy to avoid recursion.
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;

CREATE POLICY "select_own_profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR public.is_current_user_admin()
);


-- 4. Prevent users from inserting or changing protected profile fields
-- directly through the frontend.
REVOKE INSERT, UPDATE
ON public.profiles
FROM authenticated;

-- Allow updates only to these specific columns.
GRANT UPDATE (name, email, last_login)
ON public.profiles
TO authenticated;


-- 5. Create a secure signup trigger.
-- A new signup automatically creates the business and its profile.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_name text;
  v_business_name text;
  v_financer_id uuid;
BEGIN
  v_name := NULLIF(
    BTRIM(NEW.raw_user_meta_data ->> 'name'),
    ''
  );

  v_business_name := NULLIF(
    BTRIM(NEW.raw_user_meta_data ->> 'business_name'),
    ''
  );

  IF v_name IS NULL OR v_business_name IS NULL THEN
    RAISE EXCEPTION
      'Name and business name are required for signup.';
  END IF;

  IF NEW.email IS NULL THEN
    RAISE EXCEPTION
      'An email address is required for signup.';
  END IF;

  INSERT INTO public.financers (
    business_name,
    owner_name
  )
  VALUES (
    v_business_name,
    v_name
  )
  RETURNING id INTO v_financer_id;

  INSERT INTO public.profiles (
    id,
    financer_id,
    name,
    email,
    role,
    status
  )
  VALUES (
    NEW.id,
    v_financer_id,
    v_name,
    NEW.email,
    'financer',
    'ACTIVE'
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_auth_user()
FROM PUBLIC, anon, authenticated;


-- 6. Install the signup trigger.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

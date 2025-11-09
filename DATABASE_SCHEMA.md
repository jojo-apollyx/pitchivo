# Database Schema

> **Auto-generated:** 2025-11-09T09:28:50.812Z
> **Purpose:** This file serves as a reference for the current database schema.
> It helps developers and AI assistants understand the data structure.

## Quick Reference

### Tables Overview

| Table | Estimated Rows |
|-------|----------------|
| `email_domain_policy` | 18 |
| `organizations` | 1 |
| `user_profiles` | 2 |
| `waitlist` | 1 |

## Complete Schema

```sql



SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."can_user_login"("email" "text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  -- Check if domain is blocked
  IF is_email_domain_blocked(email) THEN
    RETURN false;
  END IF;
  
  -- Check if user is whitelisted
  IF NOT is_user_whitelisted(email) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;


ALTER FUNCTION "public"."can_user_login"("email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_organization_onboarding"("p_organization_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE organizations
  SET onboarding_completed_at = NOW()
  WHERE id = p_organization_id;
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."complete_organization_onboarding"("p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_organization_setup"("p_org_id" "uuid", "p_company_name" "text" DEFAULT NULL::"text", "p_industry" "text" DEFAULT NULL::"text", "p_company_size" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_use_cases" "text"[] DEFAULT '{}'::"text"[], "p_logo_url" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE organizations
  SET
    name = COALESCE(p_company_name, organizations.name),
    industry = COALESCE(p_industry, organizations.industry),
    company_size = COALESCE(p_company_size, organizations.company_size),
    description = COALESCE(p_description, organizations.description),
    use_cases = COALESCE(p_use_cases, organizations.use_cases),
    logo_url = COALESCE(p_logo_url, organizations.logo_url),
    onboarding_completed_at = COALESCE(organizations.onboarding_completed_at, NOW()),
    updated_at = NOW()
  WHERE id = p_org_id;
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."complete_organization_setup"("p_org_id" "uuid", "p_company_name" "text", "p_industry" "text", "p_company_size" "text", "p_description" "text", "p_use_cases" "text"[], "p_logo_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."extract_email_domain"("email" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  RETURN LOWER(SPLIT_PART(email, '@', 2));
END;
$$;


ALTER FUNCTION "public"."extract_email_domain"("email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_organization"("email" "text", "company_name" "text" DEFAULT NULL::"text", "industry" "text" DEFAULT NULL::"text", "company_size" "text" DEFAULT NULL::"text", "description" "text" DEFAULT NULL::"text", "use_cases" "text"[] DEFAULT '{}'::"text"[]) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  org_domain TEXT;
  org_id UUID;
  org_slug TEXT;
  user_id UUID;
  v_company_name TEXT;
  v_industry TEXT;
  v_company_size TEXT;
  v_description TEXT;
  v_use_cases TEXT[];
BEGIN
  user_id := auth.uid();
  org_domain := extract_email_domain(email);
  
  -- Store parameters in local variables to avoid ambiguity
  v_company_name := company_name;
  v_industry := industry;
  v_company_size := company_size;
  v_description := description;
  v_use_cases := use_cases;
  
  -- Try to find existing organization
  SELECT id INTO org_id FROM organizations WHERE domain = org_domain;
  
  IF org_id IS NULL THEN
    -- Create new organization
    org_slug := LOWER(REGEXP_REPLACE(COALESCE(v_company_name, org_domain), '[^a-z0-9]+', '-', 'g'));
    -- Ensure slug is unique
    WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = org_slug) LOOP
      org_slug := org_slug || '-' || FLOOR(RANDOM() * 1000)::TEXT;
    END LOOP;
    
    INSERT INTO organizations (domain, name, slug, industry, company_size, description, use_cases)
    VALUES (
      org_domain, 
      COALESCE(v_company_name, org_domain), 
      org_slug,
      v_industry,
      v_company_size,
      v_description,
      v_use_cases
    )
    RETURNING id INTO org_id;
    
    -- Update user's organization_id if user is authenticated
    IF user_id IS NOT NULL THEN
      UPDATE user_profiles
      SET organization_id = org_id
      WHERE id = user_id;
    END IF;
  ELSE
    -- Update existing organization with new information if provided
    -- Use table alias to avoid ambiguous column references
    UPDATE organizations AS o
    SET
      name = COALESCE(v_company_name, o.name),
      industry = COALESCE(v_industry, o.industry),
      company_size = COALESCE(v_company_size, o.company_size),
      description = COALESCE(v_description, o.description),
      use_cases = COALESCE(v_use_cases, o.use_cases),
      updated_at = NOW()
    WHERE o.id = org_id;
    
    -- Update user's organization_id if user is authenticated
    IF user_id IS NOT NULL THEN
      UPDATE user_profiles
      SET organization_id = org_id
      WHERE id = user_id;
    END IF;
  END IF;
  
  RETURN org_id;
END;
$$;


ALTER FUNCTION "public"."get_or_create_organization"("email" "text", "company_name" "text", "industry" "text", "company_size" "text", "description" "text", "use_cases" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_organization_member_count"("org_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM user_profiles
    WHERE organization_id = org_id
  );
END;
$$;


ALTER FUNCTION "public"."get_organization_member_count"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_organization_id"("user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT organization_id FROM user_profiles
    WHERE id = user_id
  );
END;
$$;


ALTER FUNCTION "public"."get_user_organization_id"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_domain TEXT;
  org_id UUID;
BEGIN
  user_domain := extract_email_domain(NEW.email);
  
  -- Get or create organization for this domain
  org_id := get_or_create_organization(NEW.email);
  
  -- Create user profile
  INSERT INTO user_profiles (id, email, domain, organization_id, full_name, is_pitchivo_admin, org_role)
  VALUES (
    NEW.id,
    NEW.email,
    user_domain,
    org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_pitchivo_admin')::boolean, false),
    COALESCE(NEW.raw_user_meta_data->>'org_role', 'user')
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_email_domain_blocked"("email" "text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM email_domain_policy
    WHERE domain = extract_email_domain(email)
    AND status = 'blocked'
  );
END;
$$;


ALTER FUNCTION "public"."is_email_domain_blocked"("email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_email_domain_whitelisted"("email" "text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM email_domain_policy
    WHERE domain = extract_email_domain(email)
    AND status = 'whitelisted'
  );
END;
$$;


ALTER FUNCTION "public"."is_email_domain_whitelisted"("email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_pitchivo_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND is_pitchivo_admin = true
  );
END;
$$;


ALTER FUNCTION "public"."is_pitchivo_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_whitelisted"("email" "text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  RETURN is_email_domain_whitelisted(email);
END;
$$;


ALTER FUNCTION "public"."is_user_whitelisted"("email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."make_pitchivo_admin"("p_user_email" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = p_user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', p_user_email;
  END IF;
  
  -- Update user profile to make them admin
  UPDATE user_profiles
  SET is_pitchivo_admin = true
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."make_pitchivo_admin"("p_user_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_invitation_email"("p_waitlist_id" "uuid", "p_invited_by" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  waitlist_email TEXT;
  waitlist_domain TEXT;
  policy_id UUID;
BEGIN
  -- Get email from waitlist
  SELECT email INTO waitlist_email
  FROM waitlist
  WHERE id = p_waitlist_id;
  
  IF waitlist_email IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Extract domain from email
  waitlist_domain := extract_email_domain(waitlist_email);
  
  -- Whitelist domain and update waitlist status
  SELECT whitelist_domain(
    waitlist_domain,
    p_waitlist_id,
    p_invited_by,
    'Invited from waitlist'
  ) INTO policy_id;
  
  -- Update email_sent_at timestamp
  UPDATE waitlist
  SET email_sent_at = NOW()
  WHERE id = p_waitlist_id;
  
  RETURN policy_id;
END;
$$;


ALTER FUNCTION "public"."send_invitation_email"("p_waitlist_id" "uuid", "p_invited_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_organization"("p_org_id" "uuid", "p_name" "text" DEFAULT NULL::"text", "p_industry" "text" DEFAULT NULL::"text", "p_company_size" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_use_cases" "text"[] DEFAULT NULL::"text"[], "p_logo_url" "text" DEFAULT NULL::"text", "p_onboarding_completed_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_primary_color" "text" DEFAULT NULL::"text", "p_secondary_color" "text" DEFAULT NULL::"text", "p_accent_color" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Verify that the user belongs to this organization
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND organization_id = p_org_id
  ) THEN
    RAISE EXCEPTION 'User does not belong to this organization';
  END IF;

  -- Update the organization
  UPDATE organizations
  SET
    name = COALESCE(p_name, organizations.name),
    industry = COALESCE(p_industry, organizations.industry),
    company_size = COALESCE(p_company_size, organizations.company_size),
    description = COALESCE(p_description, organizations.description),
    use_cases = COALESCE(p_use_cases, organizations.use_cases),
    logo_url = COALESCE(p_logo_url, organizations.logo_url),
    onboarding_completed_at = COALESCE(p_onboarding_completed_at, organizations.onboarding_completed_at),
    primary_color = COALESCE(p_primary_color, organizations.primary_color),
    secondary_color = COALESCE(p_secondary_color, organizations.secondary_color),
    accent_color = COALESCE(p_accent_color, organizations.accent_color),
    updated_at = NOW()
  WHERE id = p_org_id;
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."update_user_organization"("p_org_id" "uuid", "p_name" "text", "p_industry" "text", "p_company_size" "text", "p_description" "text", "p_use_cases" "text"[], "p_logo_url" "text", "p_onboarding_completed_at" timestamp with time zone, "p_primary_color" "text", "p_secondary_color" "text", "p_accent_color" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_user_organization"("p_org_id" "uuid", "p_name" "text", "p_industry" "text", "p_company_size" "text", "p_description" "text", "p_use_cases" "text"[], "p_logo_url" "text", "p_onboarding_completed_at" timestamp with time zone, "p_primary_color" "text", "p_secondary_color" "text", "p_accent_color" "text") IS 'Update organization details including color scheme. User must belong to the organization.';



CREATE OR REPLACE FUNCTION "public"."whitelist_domain"("p_domain" "text", "p_waitlist_id" "uuid" DEFAULT NULL::"uuid", "p_invited_by" "uuid" DEFAULT NULL::"uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  policy_id UUID;
BEGIN
  -- Add or update domain policy to whitelisted
  INSERT INTO email_domain_policy (domain, status, reason, invited_by, invited_at)
  VALUES (p_domain, 'whitelisted', p_reason, COALESCE(p_invited_by, auth.uid()), NOW())
  ON CONFLICT (domain) DO UPDATE SET
    status = 'whitelisted',
    reason = COALESCE(EXCLUDED.reason, email_domain_policy.reason),
    invited_by = COALESCE(EXCLUDED.invited_by, email_domain_policy.invited_by),
    invited_at = COALESCE(EXCLUDED.invited_at, email_domain_policy.invited_at),
    updated_at = NOW()
  RETURNING id INTO policy_id;
  
  -- Update waitlist status if waitlist_id provided
  IF p_waitlist_id IS NOT NULL THEN
    UPDATE waitlist
    SET
      status = 'invited',
      invited_at = NOW(),
      invited_by = COALESCE(p_invited_by, auth.uid()),
      invitation_email_sent_at = NOW()
    WHERE id = p_waitlist_id;
  END IF;
  
  RETURN policy_id;
END;
$$;


ALTER FUNCTION "public"."whitelist_domain"("p_domain" "text", "p_waitlist_id" "uuid", "p_invited_by" "uuid", "p_reason" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."email_domain_policy" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "domain" "text" NOT NULL,
    "status" "text" DEFAULT 'blocked'::"text" NOT NULL,
    "reason" "text",
    "invited_by" "uuid",
    "invited_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_public_domain" boolean DEFAULT false NOT NULL,
    CONSTRAINT "email_domain_policy_status_check" CHECK (("status" = ANY (ARRAY['blocked'::"text", 'whitelisted'::"text", 'allowed'::"text"])))
);


ALTER TABLE "public"."email_domain_policy" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "domain" "text" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "logo_url" "text",
    "onboarding_completed_at" timestamp with time zone,
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "industry" "text",
    "company_size" "text",
    "description" "text",
    "use_cases" "text"[] DEFAULT '{}'::"text"[],
    "primary_color" "text" DEFAULT '#10B981'::"text",
    "secondary_color" "text" DEFAULT '#059669'::"text",
    "accent_color" "text" DEFAULT '#F87171'::"text",
    CONSTRAINT "organizations_company_size_check" CHECK (("company_size" = ANY (ARRAY['1-5'::"text", '6-20'::"text", '21-100'::"text", '100+'::"text"])))
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."organizations"."primary_color" IS 'Primary color for the organization (hex format)';



COMMENT ON COLUMN "public"."organizations"."secondary_color" IS 'Secondary color for the organization (hex format)';



COMMENT ON COLUMN "public"."organizations"."accent_color" IS 'Accent color for the organization (hex format)';



CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "is_pitchivo_admin" boolean DEFAULT false NOT NULL,
    "org_role" "text",
    "organization_id" "uuid",
    "domain" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_profiles_org_role_check" CHECK (("org_role" = ANY (ARRAY['marketing'::"text", 'sales'::"text", 'user'::"text"])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waitlist" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "company" "text" NOT NULL,
    "role" "text",
    "note" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "invited_at" timestamp with time zone,
    "invited_by" "uuid",
    "invitation_email_sent_at" timestamp with time zone,
    "email_sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "waitlist_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'invited'::"text"])))
);


ALTER TABLE "public"."waitlist" OWNER TO "postgres";


ALTER TABLE ONLY "public"."email_domain_policy"
    ADD CONSTRAINT "email_domain_policy_domain_key" UNIQUE ("domain");



ALTER TABLE ONLY "public"."email_domain_policy"
    ADD CONSTRAINT "email_domain_policy_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_domain_key" UNIQUE ("domain");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_email_domain_policy_domain" ON "public"."email_domain_policy" USING "btree" ("domain");



CREATE INDEX "idx_email_domain_policy_is_public_domain" ON "public"."email_domain_policy" USING "btree" ("is_public_domain") WHERE ("is_public_domain" = true);



CREATE INDEX "idx_email_domain_policy_status" ON "public"."email_domain_policy" USING "btree" ("status");



CREATE INDEX "idx_organizations_company_size" ON "public"."organizations" USING "btree" ("company_size");



CREATE INDEX "idx_organizations_domain" ON "public"."organizations" USING "btree" ("domain");



CREATE INDEX "idx_organizations_industry" ON "public"."organizations" USING "btree" ("industry");



CREATE INDEX "idx_organizations_slug" ON "public"."organizations" USING "btree" ("slug");



CREATE INDEX "idx_user_profiles_domain" ON "public"."user_profiles" USING "btree" ("domain");



CREATE INDEX "idx_user_profiles_email" ON "public"."user_profiles" USING "btree" ("email");



CREATE INDEX "idx_user_profiles_is_pitchivo_admin" ON "public"."user_profiles" USING "btree" ("is_pitchivo_admin");



CREATE INDEX "idx_user_profiles_org_role" ON "public"."user_profiles" USING "btree" ("org_role");



CREATE INDEX "idx_user_profiles_organization_id" ON "public"."user_profiles" USING "btree" ("organization_id");



CREATE INDEX "idx_waitlist_created_at" ON "public"."waitlist" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_waitlist_email" ON "public"."waitlist" USING "btree" ("email");



CREATE INDEX "idx_waitlist_status" ON "public"."waitlist" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "update_email_domain_policy_updated_at" BEFORE UPDATE ON "public"."email_domain_policy" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_organizations_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_waitlist_updated_at" BEFORE UPDATE ON "public"."waitlist" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."email_domain_policy"
    ADD CONSTRAINT "email_domain_policy_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");



CREATE POLICY "Anyone can join waitlist" ON "public"."waitlist" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can read email domain policies" ON "public"."email_domain_policy" FOR SELECT USING (true);



CREATE POLICY "Organization members can read each other's profiles" ON "public"."user_profiles" FOR SELECT USING ((("organization_id" IS NOT NULL) AND ("organization_id" = "public"."get_user_organization_id"("auth"."uid"()))));



CREATE POLICY "Pitchivo admins can manage email domain policies" ON "public"."email_domain_policy" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_pitchivo_admin" = true)))));



CREATE POLICY "Pitchivo admins can read all organizations" ON "public"."organizations" FOR SELECT USING ("public"."is_pitchivo_admin"());



CREATE POLICY "Pitchivo admins can read all user profiles" ON "public"."user_profiles" FOR SELECT USING ("public"."is_pitchivo_admin"());



CREATE POLICY "Pitchivo admins can read all waitlist entries" ON "public"."waitlist" FOR SELECT USING ("public"."is_pitchivo_admin"());



CREATE POLICY "Pitchivo admins can update organizations" ON "public"."organizations" FOR UPDATE USING ("public"."is_pitchivo_admin"());



CREATE POLICY "Pitchivo admins can update user profiles" ON "public"."user_profiles" FOR UPDATE USING ("public"."is_pitchivo_admin"());



CREATE POLICY "Pitchivo admins can update waitlist entries" ON "public"."waitlist" FOR UPDATE USING ("public"."is_pitchivo_admin"());



CREATE POLICY "Service role can manage all profiles" ON "public"."user_profiles" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage email domain policies" ON "public"."email_domain_policy" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage organizations" ON "public"."organizations" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can read all waitlist entries" ON "public"."waitlist" FOR SELECT USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can update waitlist" ON "public"."waitlist" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Users can read own organization" ON "public"."organizations" FOR SELECT USING (("id" = "public"."get_user_organization_id"("auth"."uid"())));



CREATE POLICY "Users can read own profile" ON "public"."user_profiles" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can read own waitlist entry" ON "public"."waitlist" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND ("email" IN ( SELECT "user_profiles"."email"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"())))));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



ALTER TABLE "public"."email_domain_policy" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waitlist" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."can_user_login"("email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."can_user_login"("email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_user_login"("email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_organization_onboarding"("p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_organization_onboarding"("p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_organization_onboarding"("p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_organization_setup"("p_org_id" "uuid", "p_company_name" "text", "p_industry" "text", "p_company_size" "text", "p_description" "text", "p_use_cases" "text"[], "p_logo_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_organization_setup"("p_org_id" "uuid", "p_company_name" "text", "p_industry" "text", "p_company_size" "text", "p_description" "text", "p_use_cases" "text"[], "p_logo_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_organization_setup"("p_org_id" "uuid", "p_company_name" "text", "p_industry" "text", "p_company_size" "text", "p_description" "text", "p_use_cases" "text"[], "p_logo_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."extract_email_domain"("email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."extract_email_domain"("email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."extract_email_domain"("email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_organization"("email" "text", "company_name" "text", "industry" "text", "company_size" "text", "description" "text", "use_cases" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_organization"("email" "text", "company_name" "text", "industry" "text", "company_size" "text", "description" "text", "use_cases" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_organization"("email" "text", "company_name" "text", "industry" "text", "company_size" "text", "description" "text", "use_cases" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_organization_member_count"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_organization_member_count"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_member_count"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_organization_id"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_organization_id"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_organization_id"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_email_domain_blocked"("email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_email_domain_blocked"("email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_email_domain_blocked"("email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_email_domain_whitelisted"("email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_email_domain_whitelisted"("email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_email_domain_whitelisted"("email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_pitchivo_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_pitchivo_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_pitchivo_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_whitelisted"("email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_whitelisted"("email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_whitelisted"("email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."make_pitchivo_admin"("p_user_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."make_pitchivo_admin"("p_user_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."make_pitchivo_admin"("p_user_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."send_invitation_email"("p_waitlist_id" "uuid", "p_invited_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."send_invitation_email"("p_waitlist_id" "uuid", "p_invited_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_invitation_email"("p_waitlist_id" "uuid", "p_invited_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_organization"("p_org_id" "uuid", "p_name" "text", "p_industry" "text", "p_company_size" "text", "p_description" "text", "p_use_cases" "text"[], "p_logo_url" "text", "p_onboarding_completed_at" timestamp with time zone, "p_primary_color" "text", "p_secondary_color" "text", "p_accent_color" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_organization"("p_org_id" "uuid", "p_name" "text", "p_industry" "text", "p_company_size" "text", "p_description" "text", "p_use_cases" "text"[], "p_logo_url" "text", "p_onboarding_completed_at" timestamp with time zone, "p_primary_color" "text", "p_secondary_color" "text", "p_accent_color" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_organization"("p_org_id" "uuid", "p_name" "text", "p_industry" "text", "p_company_size" "text", "p_description" "text", "p_use_cases" "text"[], "p_logo_url" "text", "p_onboarding_completed_at" timestamp with time zone, "p_primary_color" "text", "p_secondary_color" "text", "p_accent_color" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."whitelist_domain"("p_domain" "text", "p_waitlist_id" "uuid", "p_invited_by" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."whitelist_domain"("p_domain" "text", "p_waitlist_id" "uuid", "p_invited_by" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."whitelist_domain"("p_domain" "text", "p_waitlist_id" "uuid", "p_invited_by" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON TABLE "public"."email_domain_policy" TO "anon";
GRANT ALL ON TABLE "public"."email_domain_policy" TO "authenticated";
GRANT ALL ON TABLE "public"."email_domain_policy" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist" TO "anon";
GRANT ALL ON TABLE "public"."waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";








```

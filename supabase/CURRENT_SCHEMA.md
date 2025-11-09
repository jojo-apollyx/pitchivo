# Current Database Tables

> **Auto-generated:** 2025-11-09T09:28:50.812Z
> **Note:** This is a simplified version. See DATABASE_SCHEMA.md for the complete schema.

## Table: `email_domain_policy`

```sql
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
```

## Table: `organizations`

```sql
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
```

## Table: `user_profiles`

```sql
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
```

## Table: `waitlist`

```sql
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
```


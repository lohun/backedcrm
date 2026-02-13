-- 1. Organizations (The Schools)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name TEXT UNIQUE NOT NULL, -- e.g., "Prempeh College"
    subscription_tier TEXT DEFAULT 'starter', -- 'starter', 'pro', 'enterprise'
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Admins (Linked to School & Role)
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    admin_role TEXT DEFAULT 'staff', -- 'super_admin', 'editor', 'view_only'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Alumni List (Scoped by Organization)
CREATE TABLE alumni_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone_momo TEXT,
    year_group INT,
    house_hall TEXT,
    meta_id TEXT, -- For WhatsApp/IG linking
    engagement_score INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure an email is unique ONLY within one school
    UNIQUE (org_id, email) 
);

-- 4. Platforms & Configs (One per school)
CREATE TABLE platforms_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    platform_name TEXT NOT NULL, -- 'BREVO', 'WHATSAPP_META'
    api_key_encrypted TEXT,
    webhook_secret TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 5. Projects & Funding
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount_ghc DECIMAL(12, 2),
    current_raised_ghc DECIMAL(12, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'active' -- 'active', 'completed', 'paused'
);


-- 6. Create Posts (Multi-platform content)
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_id UUID REFERENCES platforms_list(id),
    admin_id UUID REFERENCES admins(id),
    project_id UUID REFERENCES projects(id), -- Optional: tie post to a funding goal
    content_body TEXT NOT NULL,
    media_url TEXT,
    post_status TEXT DEFAULT 'draft', -- 'scheduled', 'sent', 'failed'
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ
);

-- 7. Create Interactions (Logs for WhatsApp/DMs)
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumni_id UUID REFERENCES alumni_list(id),
    platform_type TEXT, -- 'whatsapp', 'email', 'messenger'
    direction TEXT, -- 'inbound' or 'outbound'
    message_preview TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);


-- 8. Donations (Tracking the Money)
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    alumni_id UUID REFERENCES alumni_list(id) ON DELETE SET NULL, -- SET NULL if they want to be anonymous
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    amount_ghc DECIMAL(12, 2) NOT NULL,
    payment_method TEXT DEFAULT 'momo', -- 'momo', 'bank_transfer', 'card', 'cash'
    transaction_reference TEXT UNIQUE, -- The ID from MTN/Vodafone/Stripe
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    is_anonymous BOOLEAN DEFAULT FALSE,
    donor_note TEXT, -- e.g., "In memory of Mr. Mensah"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Automation: Update Project Total automatically
-- This function updates the 'current_raised_ghc' in the projects table whenever a donation is 'completed'
CREATE OR REPLACE FUNCTION update_project_total()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'completed') THEN
        UPDATE projects
        SET current_raised_ghc = current_raised_ghc + NEW.amount_ghc
        WHERE id = NEW.project_id;
        
        -- Also boost the Alumnus engagement score
        UPDATE alumni_list
        SET engagement_score = engagement_score + 50
        WHERE id = NEW.alumni_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

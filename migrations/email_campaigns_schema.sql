-- Email Campaigns Extension Schema

-- 1. Email Campaigns Table (extends posts table for email-specific features)
CREATE TABLE email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    subject_line TEXT NOT NULL,
    preview_text TEXT,
    featured_image_url TEXT,
    cta_button_text TEXT DEFAULT 'Learn More',
    cta_button_link TEXT,
    campaign_goal TEXT, -- e.g., "Increase Alumni Donations", "Event Registration"
    ai_suggestions JSONB, -- Store AI-generated suggestions
    brevo_campaign_id INTEGER, -- Store Brevo's campaign ID
    brevo_list_id INTEGER, -- Store Brevo's recipient list ID
    status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'failed'
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Campaign Recipients Table (track which alumni received which campaign)
CREATE TABLE campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
    alumni_id UUID REFERENCES alumni_list(id) ON DELETE CASCADE,
    email_address TEXT NOT NULL,
    send_status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed'
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    bounce_reason TEXT,
    UNIQUE (campaign_id, alumni_id)
);

-- 3. Campaign Analytics Table (aggregate metrics for performance tracking)
CREATE TABLE campaign_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_opens INTEGER DEFAULT 0,
    unique_opens INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    unique_clicks INTEGER DEFAULT 0,
    total_bounces INTEGER DEFAULT 0,
    hard_bounces INTEGER DEFAULT 0,
    soft_bounces INTEGER DEFAULT 0,
    total_unsubscribes INTEGER DEFAULT 0,
    estimated_read_time INTEGER, -- in seconds, from Brevo
    conversion_rate DECIMAL(5, 2), -- percentage
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (campaign_id)
);

-- 4. Social Media Summaries Table (store AI-generated social content)
CREATE TABLE social_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'facebook', 'whatsapp', 'instagram', 'twitter', 'linkedin'
    content TEXT NOT NULL,
    hashtags TEXT, -- comma-separated hashtags
    media_suggestion TEXT, -- suggested media type or URL
    character_count INTEGER,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    is_used BOOLEAN DEFAULT FALSE
);

-- 5. Email Templates Table (reusable templates for future campaigns)
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    template_name TEXT NOT NULL,
    template_description TEXT,
    html_template TEXT NOT NULL,
    subject_template TEXT,
    preview_text_template TEXT,
    cta_button_text TEXT DEFAULT 'Learn More',
    template_category TEXT DEFAULT 'general', -- 'fundraising', 'event', 'newsletter', 'announcement'
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_email_campaigns_org_id ON email_campaigns(org_id);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_alumni_id ON campaign_recipients(alumni_id);
CREATE INDEX idx_campaign_recipients_send_status ON campaign_recipients(send_status);
CREATE INDEX idx_campaign_analytics_campaign_id ON campaign_analytics(campaign_id);
CREATE INDEX idx_social_summaries_campaign_id ON social_summaries(campaign_id);
CREATE INDEX idx_email_templates_org_id ON email_templates(org_id);

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update campaign analytics
CREATE OR REPLACE FUNCTION update_campaign_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update campaign analytics based on recipient status changes
    INSERT INTO campaign_analytics (campaign_id, total_sent, total_delivered, total_opens, unique_opens, total_clicks, unique_clicks, total_bounces, hard_bounces, soft_bounces, total_unsubscribes, last_updated)
    VALUES (
        NEW.campaign_id,
        (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND send_status IN ('sent', 'delivered', 'opened', 'clicked')),
        (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND send_status IN ('delivered', 'opened', 'clicked')),
        (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND send_status IN ('opened', 'clicked')),
        (SELECT COUNT(DISTINCT alumni_id) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND send_status IN ('opened', 'clicked')),
        (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND send_status = 'clicked'),
        (SELECT COUNT(DISTINCT alumni_id) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND send_status = 'clicked'),
        (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND send_status = 'bounced'),
        (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND send_status = 'bounced' AND bounce_reason LIKE '%permanent%'),
        (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND send_status = 'bounced' AND bounce_reason NOT LIKE '%permanent%'),
        (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND send_status = 'unsubscribed'),
        NOW()
    )
    ON CONFLICT (campaign_id) DO UPDATE SET
        total_sent = EXCLUDED.total_sent,
        total_delivered = EXCLUDED.total_delivered,
        total_opens = EXCLUDED.total_opens,
        unique_opens = EXCLUDED.unique_opens,
        total_clicks = EXCLUDED.total_clicks,
        unique_clicks = EXCLUDED.unique_clicks,
        total_bounces = EXCLUDED.total_bounces,
        hard_bounces = EXCLUDED.hard_bounces,
        soft_bounces = EXCLUDED.soft_bounces,
        total_unsubscribes = EXCLUDED.total_unsubscribes,
        last_updated = EXCLUDED.last_updated;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campaign_analytics AFTER INSERT OR UPDATE ON campaign_recipients
    FOR EACH ROW EXECUTE FUNCTION update_campaign_analytics();

-- Function to increment template usage count
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE email_templates 
    SET usage_count = usage_count + 1 
    WHERE id = NEW.template_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
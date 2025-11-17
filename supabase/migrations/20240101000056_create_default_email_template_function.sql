-- ============================================================================
-- DEFAULT EMAIL TEMPLATE FUNCTION
-- ============================================================================
-- Function to create a default "reach out" email template for a campaign
-- This template will be automatically created when a campaign is created

CREATE OR REPLACE FUNCTION create_default_email_template(p_campaign_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_template_id UUID;
  v_product_name TEXT;
  v_org_name TEXT;
  v_template_subject TEXT;
  v_template_content TEXT;
BEGIN
  -- Get product and organization names
  SELECT 
    p.product_name,
    o.name
  INTO 
    v_product_name,
    v_org_name
  FROM campaigns c
  JOIN products p ON p.product_id = c.product_id
  JOIN organizations o ON o.id = c.org_id
  WHERE c.campaign_id = p_campaign_id;

  -- Use fallback values if not found
  v_product_name := COALESCE(v_product_name, 'our product');
  v_org_name := COALESCE(v_org_name, 'Our Company');

  -- Create default template content
  v_template_subject := 'Introducing {{product_name}} - Premium Solution for Your Business';
  v_template_content := 'Hi {{buyer_name}},

I hope this message finds you well. I''m reaching out from {{organization_name}} to introduce {{product_name}}.

We''ve noticed your company''s commitment to quality, and we believe our solution could be a great fit for your needs. Our product offers:

• Premium quality and reliability
• Competitive pricing and flexible terms
• Dedicated support and partnership

I''d love to share more details with you. You can view our complete product information here:
{{product_link}}

Would you be interested in learning more or discussing how we can support your business?

Best regards,
{{organization_name}} Team

P.S. Feel free to submit an RFQ directly through our product page if you''d like to move forward.';

  -- Insert the default template
  INSERT INTO email_templates (
    campaign_id,
    template_name,
    subject,
    content,
    is_default
  ) VALUES (
    p_campaign_id,
    'Default Reach Out',
    v_template_subject,
    v_template_content,
    true
  )
  RETURNING template_id INTO v_template_id;

  RETURN v_template_id;
END;
$$;

-- Create trigger to automatically create default template when campaign is created
CREATE OR REPLACE FUNCTION trigger_create_default_email_template()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create template if campaign is being created (not updated)
  IF TG_OP = 'INSERT' THEN
    PERFORM create_default_email_template(NEW.campaign_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS create_default_email_template_trigger ON campaigns;

-- Create trigger
CREATE TRIGGER create_default_email_template_trigger
  AFTER INSERT ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_default_email_template();

-- Add comment
COMMENT ON FUNCTION create_default_email_template IS 'Creates a default "reach out" email template for a campaign. This function is automatically called when a campaign is created.';


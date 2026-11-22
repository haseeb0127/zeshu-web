-- Admin-only operational follow-up for manual district transport enquiries.
-- Existing move_quote_enquiries table remains RLS-protected and not publicly readable.
ALTER TABLE public.move_quote_enquiries
  ADD COLUMN IF NOT EXISTS admin_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_customer_contact_at timestamptz;
COMMENT ON COLUMN public.move_quote_enquiries.admin_notes IS
  'Private operational notes; accessible only through the verified Zeshu admin API. Do not store document numbers, OTPs, payment credentials or bank data here.';
COMMENT ON COLUMN public.move_quote_enquiries.last_customer_contact_at IS
  'Last manually recorded customer contact attempt; does not imply a quote, provider confirmation or paid booking.';

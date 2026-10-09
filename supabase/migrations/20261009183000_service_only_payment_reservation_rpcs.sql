-- SECURITY: Checkout reservations may only be bound/created/read by the trusted backend.
-- The API calls all three through a service-role client; browser calls are forbidden.
REVOKE ALL ON FUNCTION public.bind_reservation_razorpay_order(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bind_reservation_razorpay_order(uuid,uuid,text) TO service_role;
REVOKE ALL ON FUNCTION public.get_resumable_inventory_reservation(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_resumable_inventory_reservation(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.create_inventory_reservation(uuid,jsonb,text,boolean,boolean,numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_inventory_reservation(uuid,jsonb,text,boolean,boolean,numeric) TO service_role;

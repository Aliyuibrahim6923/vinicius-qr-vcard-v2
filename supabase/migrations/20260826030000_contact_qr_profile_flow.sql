-- Contact QR scans must open the hosted profile. The visitor explicitly taps
-- Save contact on that profile to download/import the vCard.
update public.qr_codes
set destination_type = 'employee_profile'
where destination_type = 'employee_vcard';

alter table public.qr_codes
  drop constraint if exists qr_codes_destination_type_check;

alter table public.qr_codes
  add constraint qr_codes_destination_type_check
  check (destination_type in ('employee_profile', 'external'));

alter table public.qr_codes
  drop constraint if exists qr_destination_shape;

alter table public.qr_codes
  add constraint qr_destination_shape check (
    (destination_type = 'employee_profile' and employee_id is not null and destination_url is null)
    or (destination_type = 'external' and employee_id is null and destination_url is not null)
  );

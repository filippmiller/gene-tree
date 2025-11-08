-- 008_deceased_and_dob.sql
-- Add deceased status, date of birth, and verification fields to pending_relatives

alter table public.pending_relatives
add column if not exists date_of_birth date,
add column if not exists is_deceased boolean not null default false,
add column if not exists verification_status text not null default 'pending';

-- Add index for querying unverified deceased relatives
create index if not exists idx_pending_relatives_deceased 
on public.pending_relatives(is_deceased, verification_status) 
where is_deceased = true;

-- Comment on columns
comment on column public.pending_relatives.date_of_birth is 'Date of birth of the relative (optional, can be confirmed later)';
comment on column public.pending_relatives.is_deceased is 'Whether this person has passed away';
comment on column public.pending_relatives.verification_status is 'Verification status: pending, verified, or unverified';

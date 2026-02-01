-- Migration 007: Audit Logs System
-- Tracks all user actions for debugging and analytics

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who performed the action
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  
  -- What action was performed
  action TEXT NOT NULL, -- e.g., 'create_relative', 'delete_relative', 'update_profile'
  entity_type TEXT, -- e.g., 'pending_relatives', 'relationships', 'user_profiles'
  entity_id UUID, -- ID of the affected record
  
  -- Request details
  method TEXT, -- GET, POST, PUT, DELETE
  path TEXT, -- API endpoint path
  
  -- Request/Response data
  request_body JSONB, -- Full request payload
  response_status INT, -- HTTP status code
  response_body JSONB, -- Response data
  
  -- Error tracking
  error_message TEXT,
  error_stack TEXT,
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- RLS Policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own logs
CREATE POLICY "Users can view own logs"
  ON public.audit_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Service role can insert logs (for API logging)
CREATE POLICY "Service role can insert logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE public.audit_logs IS 'Audit trail of all user actions for debugging and analytics';
COMMENT ON COLUMN public.audit_logs.action IS 'Type of action performed (create_relative, delete_relationship, etc.)';
COMMENT ON COLUMN public.audit_logs.request_body IS 'Full request payload as JSON for debugging';

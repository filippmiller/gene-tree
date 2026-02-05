-- ============================================================================
-- Migration: Time Capsule "After Passing" Delivery Trigger
-- ============================================================================
-- When a profile is marked as deceased (death_date set from NULL to a value),
-- automatically deliver all pending time capsules with delivery_trigger='after_passing'

-- 1) Function to deliver time capsules after passing
-- ============================================================================
CREATE OR REPLACE FUNCTION deliver_time_capsules_after_passing()
RETURNS TRIGGER AS $$
DECLARE
  delivered_count INTEGER;
BEGIN
  -- Only trigger when death_date changes from NULL to a value
  IF OLD.death_date IS NULL AND NEW.death_date IS NOT NULL THEN
    -- Deliver all pending capsules with after_passing trigger
    UPDATE public.time_capsules
    SET
      delivery_status = 'delivered',
      delivered_at = NOW(),
      updated_at = NOW()
    WHERE
      created_by = NEW.id
      AND delivery_trigger = 'after_passing'
      AND delivery_status = 'scheduled';

    GET DIAGNOSTICS delivered_count = ROW_COUNT;

    -- Log the delivery for audit purposes
    IF delivered_count > 0 THEN
      RAISE NOTICE 'Delivered % time capsules for deceased user %', delivered_count, NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2) Trigger on user_profiles for death_date changes
-- ============================================================================
DROP TRIGGER IF EXISTS time_capsules_after_passing_trigger ON public.user_profiles;

CREATE TRIGGER time_capsules_after_passing_trigger
  AFTER UPDATE OF death_date ON public.user_profiles
  FOR EACH ROW
  WHEN (OLD.death_date IS DISTINCT FROM NEW.death_date)
  EXECUTE FUNCTION deliver_time_capsules_after_passing();

-- 3) Index for efficient after_passing queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_time_capsules_after_passing
  ON public.time_capsules(created_by)
  WHERE delivery_trigger = 'after_passing' AND delivery_status = 'scheduled';

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION deliver_time_capsules_after_passing() IS
  'Automatically delivers pending time capsules when creator is marked as deceased';

COMMENT ON TRIGGER time_capsules_after_passing_trigger ON public.user_profiles IS
  'Fires when death_date is set, triggering delivery of after_passing time capsules';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

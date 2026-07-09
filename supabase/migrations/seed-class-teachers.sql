-- Assign the first 6 teachers as class teachers
-- Run this in your Supabase SQL editor after verifying the teachers exist
-- Update the class names to match your school's actual classes

DO $$
DECLARE
  teacher_rec RECORD;
  class_names TEXT[] := ARRAY['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];
  class_arms TEXT[] := ARRAY['A', 'B', 'C', 'A', 'B', 'C'];
  i INT := 1;
  class_id UUID;
BEGIN
  FOR teacher_rec IN
    SELECT id, full_name FROM staff
    WHERE role = 'teacher' AND is_active = true
    ORDER BY created_at ASC
    LIMIT 6
  LOOP
    -- Check if teacher is already assigned to any class
    IF NOT EXISTS (SELECT 1 FROM classes WHERE class_teacher_id = teacher_rec.id) THEN
      -- Try to find an existing class without a teacher
      SELECT id INTO class_id FROM classes
      WHERE class_teacher_id IS NULL
      LIMIT 1;

      -- If no unassigned class exists, create one (customize names as needed)
      IF class_id IS NULL THEN
        INSERT INTO classes (name, arm, class_teacher_id)
        VALUES (class_names[i], class_arms[i], teacher_rec.id)
        RETURNING id INTO class_id;
      ELSE
        UPDATE classes SET class_teacher_id = teacher_rec.id
        WHERE id = class_id;
      END IF;

      RAISE NOTICE 'Assigned % as class teacher for class %', teacher_rec.full_name, class_names[i];
    ELSE
      RAISE NOTICE '% is already a class teacher', teacher_rec.full_name;
    END IF;

    i := i + 1;
  END LOOP;
END $$;

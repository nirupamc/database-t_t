-- Add full-text search support for applications
-- This migration adds a tsvector column to the Application table for efficient PostgreSQL FTS

-- Create tsvector column for applications
ALTER TABLE "Application" ADD COLUMN "searchVector" tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX "idx_application_search" ON "Application" USING GIN("searchVector");

-- Create function to update search vector on application or related data changes
CREATE OR REPLACE FUNCTION update_application_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW."searchVector" := setweight(to_tsvector('english', coalesce(NEW."jobTitle", '')), 'A') ||
                        setweight(to_tsvector('english', coalesce(NEW."company", '')), 'A') ||
                        setweight(to_tsvector('english', array_to_string(coalesce(NEW."techTags", ARRAY[]::text[]), ' ')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector on Application insert/update
CREATE TRIGGER trg_update_application_search BEFORE INSERT OR UPDATE ON "Application"
  FOR EACH ROW EXECUTE FUNCTION update_application_search_vector();

-- Backfill search vectors for existing applications
UPDATE "Application"
SET "searchVector" = setweight(to_tsvector('english', coalesce("jobTitle", '')), 'A') ||
                      setweight(to_tsvector('english', coalesce("company", '')), 'A') ||
                      setweight(to_tsvector('english', array_to_string(coalesce("techTags", ARRAY[]::text[]), ' ')), 'B');

-- Additive migration: no existing data is modified or removed.

-- Delivery-flow stages are stored as profile highlights.
ALTER TYPE "HighlightKind" ADD VALUE 'DELIVERY_STAGE';

-- Projects become case studies with an explicit kind.
CREATE TYPE "ProjectKind" AS ENUM ('PROFESSIONAL', 'PERSONAL', 'ACADEMIC', 'DEMO');

ALTER TABLE "projects"
  ADD COLUMN "kind" "ProjectKind" NOT NULL DEFAULT 'PERSONAL',
  ADD COLUMN "context" VARCHAR(1500),
  ADD COLUMN "architecture" VARCHAR(1500),
  ADD COLUMN "challenges" VARCHAR(1500),
  ADD COLUMN "outcome" VARCHAR(1500);

CREATE INDEX "projects_kind_idx" ON "projects"("kind");

-- Complementary hero line.
ALTER TABLE "profile" ADD COLUMN "tagline" VARCHAR(300);

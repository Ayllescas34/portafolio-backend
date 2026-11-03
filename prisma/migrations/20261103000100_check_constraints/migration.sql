-- Business rules enforced by PostgreSQL itself (Prisma's schema language cannot
-- express CHECK constraints). The API validates the same rules first and
-- returns friendly messages; these constraints are the last line of defense.

-- Singletons
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_singleton_chk" CHECK ("id" = 1);
ALTER TABLE "profile" ADD CONSTRAINT "profile_singleton_chk" CHECK ("id" = 1);

-- Admin users: emails are stored normalized
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_email_lower_chk" CHECK ("email" = lower("email"));
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_token_version_chk" CHECK ("token_version" >= 0);

-- Date coherence
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_current_end_chk"
  CHECK (("is_current" AND "end_date" IS NULL) OR (NOT "is_current" AND "end_date" IS NOT NULL));
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_dates_chk"
  CHECK ("end_date" IS NULL OR "end_date" >= "start_date");
ALTER TABLE "education" ADD CONSTRAINT "education_dates_chk"
  CHECK ("start_date" IS NULL OR "end_date" IS NULL OR "end_date" >= "start_date");
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_dates_chk"
  CHECK ("issue_date" IS NULL OR "expiration_date" IS NULL OR "expiration_date" >= "issue_date");
ALTER TABLE "projects" ADD CONSTRAINT "projects_dates_chk"
  CHECK ("start_date" IS NULL OR "end_date" IS NULL OR "end_date" >= "start_date");

-- Slugs: lowercase words separated by single hyphens
ALTER TABLE "skill_categories" ADD CONSTRAINT "skill_categories_slug_chk" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "skills" ADD CONSTRAINT "skills_slug_chk" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "technologies" ADD CONSTRAINT "technologies_slug_chk" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "projects" ADD CONSTRAINT "projects_slug_chk" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Skills: qualitative levels only, confirmed years within a sane range
ALTER TABLE "skills" ADD CONSTRAINT "skills_years_chk"
  CHECK ("years_of_experience" IS NULL OR "years_of_experience" BETWEEN 0 AND 60);
ALTER TABLE "skills" ADD CONSTRAINT "skills_proficiency_no_percent_chk"
  CHECK ("proficiency_label" IS NULL OR position('%' in "proficiency_label") = 0);

-- External links must be http(s) (blocks javascript:, data:, etc.)
ALTER TABLE "social_links" ADD CONSTRAINT "social_links_url_chk" CHECK ("url" ~* '^https?://');
ALTER TABLE "projects" ADD CONSTRAINT "projects_repository_url_chk" CHECK ("repository_url" IS NULL OR "repository_url" ~* '^https?://');
ALTER TABLE "projects" ADD CONSTRAINT "projects_live_url_chk" CHECK ("live_url" IS NULL OR "live_url" ~* '^https?://');
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_credential_url_chk"
  CHECK ("credential_url" IS NULL OR "credential_url" ~* '^https?://');

-- Ordering values are never negative
ALTER TABLE "profile_highlights" ADD CONSTRAINT "profile_highlights_order_chk" CHECK ("display_order" >= 0);
ALTER TABLE "social_links" ADD CONSTRAINT "social_links_order_chk" CHECK ("display_order" >= 0);
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_order_chk" CHECK ("display_order" >= 0);
ALTER TABLE "experience_items" ADD CONSTRAINT "experience_items_order_chk" CHECK ("display_order" >= 0);
ALTER TABLE "education" ADD CONSTRAINT "education_order_chk" CHECK ("display_order" >= 0);
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_order_chk" CHECK ("display_order" >= 0);
ALTER TABLE "skill_categories" ADD CONSTRAINT "skill_categories_order_chk" CHECK ("display_order" >= 0);
ALTER TABLE "skills" ADD CONSTRAINT "skills_order_chk" CHECK ("display_order" >= 0);
ALTER TABLE "projects" ADD CONSTRAINT "projects_order_chk" CHECK ("display_order" >= 0);
ALTER TABLE "project_images" ADD CONSTRAINT "project_images_order_chk" CHECK ("display_order" >= 0);
ALTER TABLE "project_responsibilities" ADD CONSTRAINT "project_responsibilities_order_chk" CHECK ("display_order" >= 0);

-- Contact messages cannot be blank
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_not_blank_chk"
  CHECK (length(btrim("name")) > 0 AND length(btrim("subject")) > 0 AND length(btrim("message")) > 0);

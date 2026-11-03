-- Local PostgreSQL bootstrap for the portfolio project.
-- Run through setup-local-db.ps1, which provides the role name, database names
-- and the password via environment variables (never on the command line).
\set ON_ERROR_STOP on
\getenv app_user PORTFOLIO_APP_USER
\getenv app_password PORTFOLIO_APP_PASSWORD
\getenv dev_db PORTFOLIO_DEV_DB
\getenv test_db PORTFOLIO_TEST_DB

SELECT format('CREATE ROLE %I LOGIN', :'app_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_user') \gexec

-- CREATEDB is required by `prisma migrate dev` (shadow database). No superuser.
SELECT format('ALTER ROLE %I WITH LOGIN CREATEDB NOSUPERUSER NOCREATEROLE PASSWORD %L', :'app_user', :'app_password') \gexec

SELECT format('CREATE DATABASE %I OWNER %I ENCODING ''UTF8''', :'dev_db', :'app_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'dev_db') \gexec

SELECT format('CREATE DATABASE %I OWNER %I ENCODING ''UTF8''', :'test_db', :'app_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'test_db') \gexec

\echo 'Rol y bases de datos listos.'

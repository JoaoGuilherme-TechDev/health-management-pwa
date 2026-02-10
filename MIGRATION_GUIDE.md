
# Database Migration Guide

This project uses a series of SQL scripts to manage the database schema. The scripts are designed to be run in order.

## Prerequisites

1.  **PostgreSQL 14+** (Supabase uses Postgres 15).
2.  Extensions: `uuid-ossp`, `pgcrypto`, `pg_cron` (optional, for reminders).

## Migration Order

The scripts in the `scripts/` directory must be executed in the following order to reproduce the database state:

1.  **Dependencies**: `000_setup_dependencies.sql` (Only for non-Supabase environments)
2.  **Schema Base**: `001_create_schema.sql`
3.  **Initial Data**: `002_create_admin_user.sql`, `003_create_recipes_supplements.sql`
4.  **Fixes & Extensions**:
    -   `004` to `014` (RLS fixes and admin setup)
    -   `015_add_patient_specific_content.sql` (Diet/Supplements)
    -   `016_add_file_support_and_notifications.sql` (Triggers)
    -   `017` to `020` (RLS adjustments)
    -   `021_fix_notification_types.sql` (Notification types)
    -   `022_add_push_subscriptions_table.sql` (Push support)
    -   `023` to `037` (Cleanup and refinements)
5.  **Logic Core**:
    -   `038_fix_reminders_logic.sql` (Cron logic)
    -   `040_schedule_medication_reminders.sql`
    -   `041_fix_reminder_timezone.sql` (Timezone fixes)
    -   `043_fix_diet_evolution_notifications.sql`
    -   `045_create_notification_settings_full.sql` (Settings table)
    -   `046_fix_profiles_on_conflict.sql` (Profile constraints)
    -   `047_ensure_push_config.sql` (Push config check)
6.  **Final Touches**: `099_fix_signup_trigger.sql`

## Automated Deployment

A PowerShell script is provided to automate this process on Windows.

1.  Open PowerShell.
2.  Navigate to the `scripts` directory.
3.  Run:
    ```powershell
    .\deploy_db.ps1
    ```

## Standard Postgres Migration (Decoupled from Supabase)

If you are migrating to a standard Postgres database (e.g., RDS, Neon, Railway) and removing Supabase backend services, follow these additional steps:

### 1. Install Dependencies
You need to install the PostgreSQL driver and password hashing library:
```bash
npm install pg bcryptjs
npm install -D @types/pg @types/bcryptjs
```

### 2. Run Additional Migration Scripts
After running the standard scripts (1-6 above), run these new scripts to replace Supabase-specific features:

-   `050_setup_standard_file_storage.sql`: Replaces Supabase Storage with a `files` table.
-   `051_setup_push_queue.sql`: Replaces `pg_net` webhooks with a `push_queue` table.
-   `052_update_auth_schema.sql`: Adds password support to `auth.users`.

### 3. Update Application Code
You need to replace the Supabase Client with the standard Postgres adapter.

-   **Database Connection**: Use `lib/db.ts` (created) instead of `createClient`.
-   **Authentication**: Use `lib/auth-local.ts` (created) to handle `signUp` and `signIn`.
-   **File Storage**: Update your file upload logic to insert into the `files` table and save files to disk/S3.
-   **Push Notifications**: Run a worker process to poll the `push_queue` table:
    ```sql
    SELECT * FROM push_queue WHERE status = 'pending' FOR UPDATE SKIP LOCKED;
    -- Send push...
    -- Update status to 'sent'
    ```

### 4. Note on Realtime
Supabase Realtime (WebSockets) is not available in standard Postgres. You should remove `028_enable_realtime_all_tables.sql` from your deployment pipeline or ignore errors related to `supabase_realtime`. The application should be updated to use Polling (e.g., SWR/React Query) instead of `supabase.channel()`.

## Webhooks (Push Notifications)

Push notifications rely on a **Database Webhook** to call your Next.js API (`/api/webhooks/trigger-push`) when a row is inserted into `public.notifications`.

-   **Supabase**: Configure this in the Dashboard under **Database > Webhooks**.
-   **Vanilla Postgres**: You need to implement a listener (e.g., using `NOTIFY`/`LISTEN`) or use an extension like `pg_net` to make HTTP calls from the database (see `047_ensure_push_config.sql`).

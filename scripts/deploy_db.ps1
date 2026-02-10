
# Database Deployment Script
# Usage: ./deploy_db.ps1
# Needs 'psql' installed and in PATH, or configure connection string below.

$ErrorActionPreference = "Stop"

# Default configuration
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "health_pwa"
$DB_USER = "postgres"
$DB_PASS = "lk284102rea" # Default local password, change if needed

# Construct connection string
$PG_CONNECTION_STRING = "postgresql://$($DB_USER):$($DB_PASS)@$($DB_HOST):$($DB_PORT)/$($DB_NAME)"

# Allow override from environment variable
if ($env:DATABASE_URL) {
    $PG_CONNECTION_STRING = $env:DATABASE_URL
    Write-Host "Using DATABASE_URL from environment." -ForegroundColor Yellow
}

Write-Host "Target Database: $DB_NAME" -ForegroundColor Cyan
Write-Host "Starting Database Deployment..." -ForegroundColor Green

# List of scripts in order
$scripts = @(
    "000_setup_dependencies.sql",
    "001_create_schema.sql",
    "002_create_admin_user.sql",
    "003_create_recipes_supplements.sql",
    "004_create_initial_admin.sql",
    "005_setup_admin_and_encryption.sql",
    "006_fix_rls_policies.sql",
    "007_disable_rls_recursion.sql",
    "008_fix_rls_final.sql",
    "009_fix_rls_final.sql",
    "010_fix_rls_infinite_recursion.sql",
    "011_add_brazilian_fields_and_evolution.sql",
    "011_fix_admin_update_permissions.sql",
    "012_remove_encryption_triggers.sql",
    "013_fix_admin_insert_permissions.sql",
    "014_fix_admin_rls_no_recursion.sql",
    "015_add_patient_specific_content.sql",
    "016_add_file_support_and_notifications.sql",
    "017_fix_notifications_rls.sql",
    "018_add_doctor_crm_system.sql",
    # "019_create_storage_buckets.sql", # SUPABASE STORAGE ONLY
    "020_fix_health_metrics_rls.sql",
    "021_fix_notification_types.sql",
    "022_add_push_subscriptions_table.sql",
    "023_remove_health_metrics_table.sql",
    "024_cleanup_inactive_records.sql",
    "025_add_delete_patient_cascade_function.sql",
    "026_add_medication_schedules.sql",
    "027_make_frequency_nullable.sql",
    # "028_enable_realtime_all_tables.sql", # SUPABASE REALTIME ONLY
    "035_schedule_appointment_reminders.sql",
    "036_enhance_medication_reminders.sql",
    "037_add_related_id_to_notifications.sql",
    "038_fix_reminders_logic.sql",
    "040_schedule_medication_reminders.sql",
    "041_fix_reminder_timezone.sql",
    "043_fix_diet_evolution_notifications.sql",
    "044_fix_prescriptions_and_encoding.sql",
    "045_create_notification_settings_full.sql",
    "046_fix_profiles_on_conflict.sql",
    # "047_ensure_push_config.sql", # SUPABASE PG_NET ONLY
    "050_setup_standard_file_storage.sql",
    "051_setup_push_queue.sql",
    "052_update_auth_schema.sql",
    "099_fix_signup_trigger.sql"
)

# Function to execute SQL file
function Run-SqlFile {
    param (
        [string]$filePath
    )
    
    $fullPath = Join-Path $PSScriptRoot $filePath
    
    if (-not (Test-Path $fullPath)) {
        Write-Warning "Script $filePath not found at $fullPath, skipping..."
        return
    }

    Write-Host "Executing $filePath..." -ForegroundColor Cyan
    try {
        # Check if psql is available
        if (Get-Command "psql" -ErrorAction SilentlyContinue) {
             # Use cmd /c to handle potential path issues or shell execution differences
             cmd /c "psql `"$PG_CONNECTION_STRING`" -f `"$fullPath`""
             if ($LASTEXITCODE -ne 0) {
                Write-Warning "Script $filePath finished with exit code $LASTEXITCODE"
             }
        } else {
             Write-Error "psql command not found. Please install PostgreSQL client tools."
             exit 1
        }
    } catch {
        Write-Error "Failed to execute $filePath. Error: $_"
    }
}

foreach ($script in $scripts) {
    Run-SqlFile -filePath $script
}

Write-Host "Deployment Complete!" -ForegroundColor Green

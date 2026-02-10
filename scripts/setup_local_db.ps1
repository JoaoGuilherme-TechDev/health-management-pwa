
# Local Database Setup Script
# Usage: ./setup_local_db.ps1

$ErrorActionPreference = "Stop"

$DB_NAME = "health_pwa"
$DB_USER = "postgres"
$DB_PASS = "lk284102rea" # Recovered from environment

# Set PGPASSWORD to avoid prompts
$env:PGPASSWORD = $DB_PASS
$env:DATABASE_URL = "postgresql://$($DB_USER):$($DB_PASS)@localhost:5432/$($DB_NAME)"

Write-Host "Setting up local PostgreSQL database..." -ForegroundColor Cyan

# 1. Check for PostgreSQL tools
if (-not (Get-Command "psql" -ErrorAction SilentlyContinue)) {
    # Try to find it in common locations
    $possiblePaths = @(
        "C:\Program Files\PostgreSQL\18\bin",
        "C:\Program Files\PostgreSQL\17\bin",
        "C:\Program Files\PostgreSQL\16\bin",
        "C:\Program Files\PostgreSQL\15\bin"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path "$path\psql.exe") {
            Write-Host "Found PostgreSQL at $path. Adding to PATH for this session." -ForegroundColor Yellow
            $env:Path = "$path;" + $env:Path
            break
        }
    }
}

if (-not (Get-Command "psql" -ErrorAction SilentlyContinue)) {
    Write-Error "PostgreSQL tools (psql) not found. Please install PostgreSQL from https://www.postgresql.org/download/"
    exit 1
}

# 2. Create Database
Write-Host "Creating database '$DB_NAME'..." -ForegroundColor Yellow
try {
    # Check if DB exists
    $exists = cmd /c "psql postgresql://$($DB_USER):$($DB_PASS)@localhost:5432/postgres -tAc `"SELECT 1 FROM pg_database WHERE datname='$DB_NAME'`""
    
    if ($exists -eq "1") {
        Write-Host "Database '$DB_NAME' already exists." -ForegroundColor Green
    } else {
        # Create DB using psql
        Write-Host "Creating database '$DB_NAME'..." -ForegroundColor Yellow
        cmd /c "psql postgresql://$($DB_USER):$($DB_PASS)@localhost:5432/postgres -c `"CREATE DATABASE $DB_NAME;`""
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Database '$DB_NAME' created successfully." -ForegroundColor Green
        } else {
            Write-Warning "Could not create database. Check if user has permissions or if it already exists."
        }
    }
} catch {
    Write-Warning "Error checking/creating database: $_"
    Write-Warning "Ensure PostgreSQL is running and accepting connections on localhost:5432."
}

# 3. Run Deployment Script
$deployScript = Join-Path $PSScriptRoot "deploy_db.ps1"
if (Test-Path $deployScript) {
    Write-Host "Running schema deployment..." -ForegroundColor Cyan
    & $deployScript
} else {
    Write-Error "deploy_db.ps1 not found!"
    exit 1
}

Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "Ensure your .env.local file has: DATABASE_URL=`"postgresql://$($DB_USER):$($DB_PASS)@localhost:5432/$($DB_NAME)`"" -ForegroundColor Yellow

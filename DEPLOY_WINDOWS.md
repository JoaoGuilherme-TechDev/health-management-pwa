# Deployment Guide for Windows Server (VM)

This guide provides step-by-step instructions to deploy the Health Management PWA on a Windows Server Virtual Machine.

## 1. Prerequisites

Before starting, ensure your Windows Server has the following installed:

### Software Requirements
1.  **Node.js (LTS Version)**
    *   Download and install from [nodejs.org](https://nodejs.org/).
    *   Verify by running `node -v` and `npm -v` in PowerShell.
2.  **Git for Windows**
    *   Download and install from [git-scm.com](https://git-scm.com/).
3.  **PostgreSQL** (If hosting database locally)
    *   Download and install from [postgresql.org](https://www.postgresql.org/download/windows/).
    *   During installation, remember the password you set for the `postgres` user.
    *   Ensure Command Line Tools (psql) are installed and added to PATH.
4.  **IIS (Internet Information Services)**
    *   Open **Server Manager** > **Add Roles and Features**.
    *   Select **Web Server (IIS)**.
    *   Ensure **CGI** (under Application Development) is selected (optional but good for some extensions).
5.  **IIS Modules** (Required for Reverse Proxy)
    *   **URL Rewrite Module**: [Download Link](https://www.iis.net/downloads/microsoft/url-rewrite)
    *   **Application Request Routing (ARR)**: [Download Link](https://www.iis.net/downloads/microsoft/application-request-routing)
    *   *Note: After installing ARR, open IIS Manager, click on the server node, open "Application Request Routing Cache", click "Server Proxy Settings" on the right, and check "Enable proxy".*

## 2. Project Setup

### Clone the Repository
Open PowerShell as Administrator and navigate to your desired web root (e.g., `C:\inetpub\wwwroot` or `C:\Apps`).

```powershell
cd C:\inetpub\wwwroot
git clone <your-repository-url> health-pwa
cd health-pwa
```

### Install Dependencies
```powershell
npm install
```

## 3. Environment Configuration

Create a `.env` file in the project root (`C:\inetpub\wwwroot\health-pwa\.env`).
Copy the contents from `.env.local` or use the template below:

```ini
# Database Connection
# Format: postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
DATABASE_URL="postgresql://postgres:YourSecurePassword@localhost:5432/health_pwa"

# Authentication Secret (Generate a strong random string)
JWT_SECRET_KEY="your-production-secret-key-change-this"

# Push Notifications (VAPID Keys)
# You can generate these by running: node scripts/generate-vapid-keys.js
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-key"
VAPID_PRIVATE_KEY="your-private-key"

# Node Environment
NODE_ENV="production"
```

## 4. Database Setup

You need to deploy the database schema. The project includes a PowerShell script for this.

1.  Ensure your PostgreSQL service is running.
2.  Create the database (if it doesn't exist):
    ```powershell
    createdb -U postgres health_pwa
    ```
3.  Run the deployment script:
    ```powershell
    ./scripts/deploy_db.ps1
    ```
    *   *Note: Ensure `DATABASE_URL` in your `.env` file is correct before running this.*

## 5. Build the Application

Build the Next.js application for production.

```powershell
npm run build
```

## 6. Process Management (PM2)

We will use PM2 to keep the application running in the background.

1.  **Install PM2 globally:**
    ```powershell
    npm install -g pm2
    ```
2.  **Start the application:**
    ```powershell
    pm2 start npm --name "health-pwa" -- start
    ```
3.  **Save the process list:**
    ```powershell
    pm2 save
    ```
4.  **(Optional) Setup PM2 to start on boot:**
    *   For Windows, you can use `pm2-installer` or a scheduled task. A simple way is to use a library like `pm2-windows-service` or `pm2-windows-startup`.
    *   `npm install -g pm2-windows-startup`
    *   `pm2-startup install`

## 7. IIS Reverse Proxy Configuration

Now we configure IIS to forward requests to your Node.js app (running on port 3000 by default).

1.  **Open IIS Manager**.
2.  **Add Website**:
    *   Right-click **Sites** > **Add Website**.
    *   **Site name**: `HealthPWA`.
    *   **Physical path**: `C:\inetpub\wwwroot\health-pwa`.
    *   **Binding**: HTTP, Port 80 (or your specific port), Host name: `yourdomain.com` (or leave blank for IP access).
3.  **Configure URL Rewrite**:
    *   Click on your new site (`HealthPWA`).
    *   Double-click **URL Rewrite**.
    *   Click **Add Rule(s)...** > **Reverse Proxy**.
    *   **Inbound Rules**: Enter `localhost:3000` (where your Next.js app is running).
    *   Check **Enable SSL Offloading**.
    *   Click **OK**.
4.  **Edit web.config (Optional but Recommended)**:
    *   Verify a `web.config` was created in your project root. It should look like this:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="ReverseProxyInboundRule1" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:3000/{R:1}" />
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
</configuration>
```

## 8. SSL Configuration (HTTPS)

Secure your domain with a free SSL certificate using **Win-ACME** (Let's Encrypt for Windows).

1.  Download **Win-ACME** from [win-acme.com](https://www.win-acme.com/).
2.  Extract and run `wacs.exe` as Administrator.
3.  Select **N** (Create new certificate).
4.  Select **1** (Single binding of an IIS site).
5.  Select your site (`HealthPWA`).
6.  Follow the prompts. It will automatically configure HTTPS bindings in IIS and set up auto-renewal.

## 9. Troubleshooting

*   **App not accessible?**
    *   Check if PM2 is running: `pm2 list`
    *   Check firewall settings: Ensure port 80/443 is open in Windows Firewall and your Cloud Provider (AWS/Azure/GCP) security groups.
*   **Database errors?**
    *   Check `DATABASE_URL` in `.env`.
    *   Ensure PostgreSQL service is running.
*   **Permissions?**
    *   Ensure `IIS AppPool\HealthPWA` has read access to the project folder.

## 10. Updating the App

To deploy a new version:
1.  Pull changes: `git pull`
2.  Install deps: `npm install`
3.  Rebuild: `npm run build`
4.  Restart PM2: `pm2 restart health-pwa`

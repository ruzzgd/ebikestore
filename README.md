# Fidelo E-Bike Store

Fidelo E-Bike Store is a centralized inventory management and customer application system for a multi-location e-bike business. It covers the product catalog, location-based inventory, stock movements, inter-branch transfers, customer applications, notifications, reports, image uploads, and authentication auditing.

> **Local demo credentials:** The credentials below are development defaults. Change them before using this system on a shared network or with real data. Never commit the generated `.env` file.

## Local URLs and Credentials

### Fidelo application

- **Application:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **API health check:** [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

| Role | Email | Password | Assigned location |
| --- | --- | --- | --- |
| Administrator | `admin@gmail.com` | `admin1234` | All locations |
| Branch staff | `branchstaff@gmail.com` | `branchstaff1234` | Bulan Branch |
| Warehouse staff | `warehousestaff@gmail.com` | `warehousestaff1234` | Naga Warehouse |
| Customer | `customer1@gmail.com` | `customer1234` | None |
| Customer | `customer2@gmail.com` | `customer1234` | None |

These accounts are active, email-verified, and created automatically by the backend startup process. The seed scripts are idempotent, so existing records are not duplicated.

### MinIO dashboard

- **Console:** [http://localhost:9001](http://localhost:9001)
- **S3 API:** [http://localhost:9000](http://localhost:9000)
- **Username:** `ebikestore`
- **Password:** `ebikestore1234`
- **Application bucket:** `ebikestore-products`

These values apply after copying the provided `.env.example` file as described below.

To inspect uploaded product and profile images:

1. Open [http://localhost:9001](http://localhost:9001).
2. Sign in with the MinIO credentials above.
3. Open **Object Browser** and select the `ebikestore-products` bucket.

### MySQL database

| Setting | Value |
| --- | --- |
| Host from your computer | `localhost` |
| Host inside Docker Compose | `mysql` |
| Port | `3306` |
| Database | `ebikestore_db` |
| Username | `ebikestore_user` |
| Password | `ebikestore1234` |
| Root password | `ebikestore1234` |

### phpMyAdmin

- **Dashboard:** [http://localhost:8080](http://localhost:8080)
- **Server:** `mysql` (selected automatically)
- **Username:** `ebikestore_user`
- **Password:** `ebikestore1234`

To access the database in a browser:

1. Start the stack with `docker compose up -d --build`.
2. Open [http://localhost:8080](http://localhost:8080).
3. Enter `ebikestore_user` as the username and `ebikestore1234` as the password.
4. Select the `ebikestore_db` database from the left sidebar.

These credentials come from `.env.example`. If you change `MYSQL_USER` or `MYSQL_PASSWORD` in your local `.env`, use those updated values to sign in. The phpMyAdmin host port can be changed with `PHPMYADMIN_PORT`.

Connect through the MySQL container without installing a database client on the host:

```bash
docker compose exec mysql mysql -u ebikestore_user -p ebikestore_db
```

Enter `ebikestore1234` when prompted. Useful commands include:

```sql
SHOW TABLES;
SELECT id, name, email, role, is_active FROM users;
SELECT id, sku, name, unit_price, is_active FROM products;
EXIT;
```

## Docker Setup

This is the supported setup path. Run PowerShell commands in Windows and all `bash` commands in the Ubuntu/WSL terminal. You do not need to install Node.js, npm, MySQL, or MinIO on Windows or WSL; Docker supplies them.

### 1. Install Docker CLI and Docker Compose

This setup uses Docker Engine and the Docker Compose CLI plugin. Docker Desktop is not required.

#### Windows 10 or Windows 11

The project uses Linux containers, so Windows runs Docker Engine through WSL 2. This does not replace Windows or create a dual-boot system. Ubuntu runs as a terminal application, while Fidelo remains accessible from the normal Windows browser.

##### A. Install WSL 2 once

Open **PowerShell as Administrator** and run:

```powershell
wsl --install -d Ubuntu
wsl --update
```

If installation remains at `0.0%`, retry with:

```powershell
wsl --install --web-download -d Ubuntu
```

Restart Windows when requested.

After restarting, open PowerShell and confirm Ubuntu uses WSL 2:

```powershell
wsl --list --verbose
```

The `VERSION` column for Ubuntu must show `2`. If it shows `1`, run:

```powershell
wsl --set-version Ubuntu 2
```

##### B. Open the Ubuntu terminal

Open **Ubuntu** from the Windows Start menu, or run:

```powershell
wsl -d Ubuntu
```

On first launch, Ubuntu asks for a Linux username and password. These are separate from the Fidelo application accounts. Run the remaining Linux, Git, and Docker commands inside this Ubuntu terminal.

Microsoft provides additional details in its [official WSL installation guide](https://learn.microsoft.com/windows/wsl/install).

#### Ubuntu or Ubuntu on WSL 2

Install Docker Engine, the Docker CLI, Buildx, and the Compose plugin from Docker's official repository:

```bash
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

These commands follow Docker's [official Ubuntu installation guide](https://docs.docker.com/engine/install/ubuntu/).

Start Docker and configure it to start automatically:

```bash
sudo systemctl enable --now docker
```

If WSL reports that it was not started with `systemd`, enable it inside Ubuntu:

```bash
sudo sh -c 'printf "[boot]\nsystemd=true\n" > /etc/wsl.conf'
```

Then run `wsl --shutdown` in PowerShell, reopen Ubuntu, and repeat `sudo systemctl enable --now docker`.

Verify the installation:

```bash
docker --version
docker compose version
docker info
```

If `docker info` reports a socket permission error, add your Linux user to Docker's group:

```bash
sudo usermod -aG docker "$USER"
```

Close the Ubuntu window, run `wsl --shutdown` in PowerShell, reopen Ubuntu, and verify `docker info` again. Until then, Docker commands require `sudo`.

### 2. Clone and enter the project

On Windows, run these commands inside the Ubuntu terminal. Keeping the repository in the WSL home directory generally provides better Docker performance and more predictable Linux permissions:

```bash
mkdir -p ~/projects
cd ~/projects
git clone <repository-url>
cd ebikestore
```

Use the repository's HTTPS URL for `<repository-url>` unless GitHub SSH keys are already configured. Git is required; install it with `sudo apt-get install git` if `git --version` fails.

To open the WSL copy in Windows File Explorer, enter the following path and replace `<username>` with your Ubuntu username:

```text
\\wsl$\Ubuntu\home\<username>\projects\ebikestore
```

If the project is already downloaded, enter its directory before continuing. The correct repository root contains `docker-compose.yml`, `ebikestorebackend`, and `ebikestorefrontend`.

### 3. Create the environment file

From the repository root:

```bash
cp .env.example .env
```

The template contains development defaults that match the credentials documented above. Review and replace its passwords and secrets for any shared or public environment.

Do not change `MYSQL_HOST` or `MINIO_ENDPOINT`: Docker service names are required for container-to-container communication. If you change a host port such as `FRONTEND_PORT`, also update `CORS_ORIGIN`; if you change `BACKEND_PORT`, update `VITE_API_BASE_URL` and rebuild the frontend.

Real email delivery requires a valid `RESEND_API_KEY` and approved sender address. When no usable key is configured, local verification and password-reset codes are printed in the backend logs instead.

### 4. Build and start Fidelo

Before starting, make sure the default host ports are available: `3000`, `5000`, `3306`, `8080`, `9000`, and `9001`. If another program already uses one, stop that program or change the corresponding port variable in `.env`. Do not change service hostnames. These URLs assume you keep the default ports.

Use the project-standard orchestration command:

```bash
docker compose up -d --build
```

The first build may take several minutes. Docker starts the React frontend, Express backend, MySQL, phpMyAdmin, and MinIO. The backend applies ordered database migrations and runs the development seed scripts before starting the API.

Check that all containers are running:

```bash
docker compose ps
```

On the first startup, wait until the backend finishes migrations and seeds. Confirm the API is ready from Ubuntu:

```bash
curl --fail http://localhost:5000/api/v1/health
```

A successful response has HTTP status `200` and reports `"status":"ok"`. If it is not ready yet, inspect the logs:

Follow backend migration, seed, and startup logs when troubleshooting:

```bash
docker compose logs -f backend
```

Press `Ctrl+C` to stop following logs; the containers continue running in the background.

If the build or startup fails, do not repeatedly delete volumes. First run:

```bash
docker compose ps -a
docker compose logs --tail=200 backend mysql minio
```

Common causes are a stopped Docker daemon, an occupied host port, an edited `.env` value that no longer matches another setting, or insufficient disk space (`docker system df`).

### 5. Open and test the system

1. Open [http://localhost:3000](http://localhost:3000).
2. Sign in with an account listed at the top of this README.
3. Use [MinIO](http://localhost:9001) to inspect uploaded images.
4. Use [phpMyAdmin](http://localhost:8080) or the MySQL container command above to inspect application records.

Role-specific areas include:

- **Administrator:** master data, users, inventory, transfers, applications, reports, and audit logs.
- **Branch staff:** assigned-branch inventory, customer applications, transfers, notifications, and reports.
- **Warehouse staff:** assigned-warehouse inventory, movements, transfers, notifications, and reports.
- **Customer:** public catalog, product applications, application tracking, notifications, and profile.

### 6. Start Fidelo again later on Windows

The installation steps are only required once. Start Windows normally, open Ubuntu, and run:

```bash
cd ~/projects/ebikestore
sudo systemctl start docker
docker compose up -d
```

If Docker is already running, the `systemctl` command simply succeeds. After pulling source changes or editing a Vite build variable, use `docker compose up -d --build` instead.

Then open [http://localhost:3000](http://localhost:3000) in the normal Windows browser.

## Common Docker Commands

```bash
# Show container status
docker compose ps

# Follow all service logs
docker compose logs -f

# Restart the application
docker compose restart

# Rebuild after source or dependency changes
docker compose up -d --build

# Stop and remove containers while preserving stored data
docker compose down
```

To reset all local application data, stop the stack and remove its named volumes:

```bash
docker compose down --volumes
```

> This reset permanently removes the local MySQL database and MinIO objects. Seed records are recreated at the next startup, but user-created data cannot be recovered.

Run the idempotent seed scripts manually when needed:

```bash
docker compose exec backend npm run seed:test-users
docker compose exec backend npm run seed:test-products
```

## Automated Checks

Run the backend tests:

```bash
docker compose exec backend npm test
```

Rebuild the complete stack and confirm the frontend production output exists:

```bash
docker compose up -d --build
docker compose exec frontend sh -c "cd /app && test -f dist/index.html"
```

## Architecture

- **Frontend:** React 18, Vite, React Router, reusable API services, and Vanilla CSS
- **Backend:** Node.js 20, Express, JWT cookie authentication, and modular Route → Controller → Service → Repository features
- **Database:** MySQL 8 through `mysql2/promise` parameterized queries
- **Database administration:** phpMyAdmin
- **Object storage:** MinIO
- **Email:** Resend with a development log fallback
- **Local orchestration:** Docker Compose

```text
ebikestore/
├── ebikestorebackend/   # Express API, migrations, tests, and seed scripts
├── ebikestorefrontend/  # React and Vite web application
├── docs/                # System documentation PDF and diagrams
├── docker-compose.yml   # Local service definitions
└── .env.example         # Development environment template
```

## Core Capabilities

- Location-specific inventory with thresholds and low-stock notifications
- Append-only stock movement history with before and after quantities
- Inter-branch transfer approval, dispatch, and receipt workflows
- Public product catalog and customer product applications
- Role- and location-scoped dashboards, notifications, and reports
- Product and profile image storage through MinIO
- User administration, email verification, password reset, and authentication audit logs
- CSV export for operational reports

## Documentation

- [System documentation overview](./docs/README.md)
- [System documentation PDF](./docs/system_documentation.pdf)
- [System architecture diagram](./docs/diagrams/fidelo-architecture.png)
- [Entity relationship diagram](./docs/diagrams/fidelo-erd.png)
- [Role capabilities diagram](./docs/diagrams/fidelo-use-case.png)
- [Transfer sequence diagram](./docs/diagrams/fidelo-sequence.png)
- [Transfer activity diagram](./docs/diagrams/fidelo-activity.png)

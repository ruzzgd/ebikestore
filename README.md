# Fidelo E-Bike Store

Fidelo E-Bike Store is a centralized inventory management and customer application system for a multi-location e-bike business. It covers the product catalog, location-based inventory, stock movements, inter-branch transfers, customer applications, notifications, reports, image uploads, and authentication auditing.

> **Staging/demo credentials:** The documented credentials are intentionally shared by the local and staging configurations. Do not reuse them for a production deployment. Never commit the generated `.env` file; the Kubernetes Secret is protected with git-crypt.

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

Verify the installation:

```bash
docker --version
docker compose version
docker info
```

If `docker info` reports a permission error, run Docker commands with `sudo` or complete Docker's [Linux post-installation steps](https://docs.docker.com/engine/install/linux-postinstall/).

### 2. Clone and enter the project

On Windows, run these commands inside the Ubuntu terminal. Keeping the repository in the WSL home directory generally provides better Docker performance and more predictable Linux permissions:

```bash
mkdir -p ~/projects
cd ~/projects
git clone <repository-url>
cd ebikestore
```

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

Real email delivery requires a valid `RESEND_API_KEY` and approved sender address. When no usable key is configured, local verification and password-reset codes are printed in the backend logs instead.

### 4. Build and start Fidelo

Use the project-standard orchestration command:

```bash
docker compose up -d --build
```

The first build may take several minutes. Docker starts the React frontend, Express backend, MySQL, phpMyAdmin, and MinIO. The backend applies ordered database migrations and runs the development seed scripts before starting the API.

Check that all containers are running:

```bash
docker compose ps
```

Follow backend migration, seed, and startup logs when troubleshooting:

```bash
docker compose logs -f backend
```

Press `Ctrl+C` to stop following logs; the containers continue running in the background.

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
docker compose up -d
```

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

## Kubernetes Staging Deployment

The `k8s/ebikestore` directory contains the k3s staging resources for the React frontend, Express backend, MySQL 8, and MinIO. phpMyAdmin is intentionally available only in Docker Compose and is not deployed to Kubernetes.

Staging endpoints:

- **Application:** `https://ebikestore.ruzzgd.dev`
- **Backend API:** `https://api-ebikestore.ruzzgd.dev/api/v1`
- **MinIO API/CDN:** `https://cdn-ebikestore.ruzzgd.dev`

The staging database uses `ebikestore_db`, `ebikestore_user`, and `ebikestore1234`. The initial administrator is `admin@gmail.com` with password `admin1234`. These are staging/demo credentials and must not be reused in production.

The Kubernetes Secret manifest is encrypted in Git using the rule in `.gitattributes`. After cloning the repository on a trusted machine, unlock it with the repository key:

```bash
git-crypt unlock /secure/path/ebikestore-git-crypt-key
```

GitHub Actions expects the same binary key encoded as Base64 in a repository secret named `GIT_CRYPT_KEY`. A push to `main` builds the frontend and backend images in GHCR, then the self-hosted runner applies the manifests to the `ebikestore` namespace.

Required cluster components and configuration:

- A self-hosted GitHub Actions runner with `kubectl` and `git-crypt`
- An nginx ingress controller
- cert-manager with the `letsencrypt-prod` ClusterIssuer
- DNS records for all three staging hostnames pointing to the ingress address

Inspect the deployment with:

```bash
kubectl get pods,svc,ingress,pvc -n ebikestore
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
- **Staging orchestration:** Kubernetes/k3s with GitHub Actions

```text
ebikestore/
├── ebikestorebackend/   # Express API, migrations, tests, and seed scripts
├── ebikestorefrontend/  # React and Vite web application
├── k8s/ebikestore/      # Kubernetes staging manifests
├── .github/workflows/   # GHCR build and k3s deployment automation
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

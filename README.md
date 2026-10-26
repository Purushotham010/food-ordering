# Project 64: MERN Online Food Ordering Platform

**Assignment Part:** Part 4 - MERN Stack (Q61-75)  
**Tools:** Docker, Docker Compose, Docker Host (AWS EC2)  
**Database:** MongoDB 7.0  

---

## 1. Scenario & Objectives
> **Scenario:** A food ordering MERN app must run on Ubuntu. Your task: Write the Compose file and list which ports are public and which are private.

This project delivers a production-ready MERN stack food ordering system with automated seeding, live order status lifecycle management, and a hardened Docker networking model.

---

## 2. Port Architecture: Public vs. Private Ports

Here is the exact analysis answering the scenario requirement (*"list which ports are public and which are private"*):

| Container Service | Container Internal Port | Host / Public Port | Port Classification | Security & Architectural Role |
| :--- | :--- | :--- | :--- | :--- |
| **`frontend` (React + Nginx)** | `80` | **`80:80` (HTTP)** | **PUBLIC** | **The ONLY public port.** Serves compiled React assets and reverse-proxies `/api/*` traffic to the Node.js backend. |
| **`backend` (Express / Node.js)** | `5000` | *None (Not published)* | **PRIVATE** | Internal communication only. Exposed inside `food-net` to the Nginx reverse proxy. Shielded from direct internet access. |
| **`mongo` (MongoDB 7.0)** | `27017` | *None (Not published)* | **PRIVATE** | Database storage strictly internal to `food-net`. Backend accesses it via `mongodb://mongo:27017/food_delivery_db`. No public internet exposure. |

### Architectural Security Analysis:
1. **Zero Database Exposure:** MongoDB running on `27017` has no published host port. Automated bots scanning EC2 IPs cannot probe or access the database.
2. **Reverse Proxy Layer:** Port `80` handles all inbound user HTTP traffic. Browsers load React at `/` and invoke `/api/menu` or `/api/orders` without needing CORS workarounds or direct access to port `5000`.

---

## 3. Architecture Diagram

```
[ Web Browser / Customer ]
           │
           │ (HTTP Traffic on Public Port 80)
           ▼
┌──────────────────────────────────────────────────────────────┐
│ AWS EC2 Ubuntu Server / Docker Host                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ frontend Container (Nginx :80) [PUBLIC PORT 80]       │  │
│  │  - Serves React SPA (Catalog, Cart, Order Tracker)    │  │
│  │  - Reverse proxies /api/ -> backend:5000              │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
│              Internal Docker Network: food-net               │
│                           │                                  │
│            ┌──────────────┴──────────────┐                   │
│            ▼                             ▼                   │
│  ┌────────────────────┐        ┌───────────────────────┐    │
│  │ backend Container  │        │ mongo Container       │    │
│  │ (Node.js :5000)    │◄──────►│ (MongoDB 7 :27017)    │    │
│  │ [PRIVATE PORT]     │ Mongoose│ [PRIVATE PORT]       │    │
│  └────────────────────┘        └───────────┬───────────┘    │
│                                            │                 │
│                                 ┌──────────▼───────────┐    │
│                                 │ Named Volume:        │    │
│                                 │ mongo_data           │    │
│                                 └──────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. How to Run Locally

### Step 1: Start the Entire Stack
From the `project_64_food` folder:
```bash
# If running standalone on port 80:
docker compose up --build -d

# Or if Project 3 is already running on port 80, run on port 8080:
FRONTEND_PORT=8080 docker compose up --build -d
```

### Step 2: Verify Running Containers
```bash
docker compose ps
```
You will see:
- `food_frontend` listening on `0.0.0.0:80->80/tcp` (or `8080->80/tcp`)
- `food_backend` on internal port `5000/tcp`
- `food_mongo` on internal port `27017/tcp`

### Step 3: Open in Browser
```
http://localhost/   (or http://localhost:8080/)
```

### Step 4: Verify via CLI
```bash
# Test backend health via Nginx proxy
curl -i http://localhost/api/health

# Fetch restaurant menu from MongoDB
curl -i http://localhost/api/menu

# Fetch port architecture info
curl -i http://localhost/api/architecture
```

---

## 5. Deployment on AWS EC2 (Ubuntu)

### Step 1: Launch EC2 Instance
1. In AWS Console > **EC2** > **Launch an Instance**.
2. **Name:** `Food-Ordering-MERN-Server`
3. **AMI:** Ubuntu 24.04 LTS (HVM)
4. **Instance Type:** `t2.micro` or `t3.small`
5. **Security Group Inbound Rules:**
   - **Port 22 (SSH):** Source `My IP`
   - **Port 80 (HTTP):** Source `0.0.0.0/0` (Anywhere)
   - *Ports 5000 and 27017 must remain strictly closed!*

### Step 2: Connect to EC2
```bash
ssh -i /path/to/your-key.pem ubuntu@<YOUR-EC2-PUBLIC-IP>
```

### Step 3: Install Docker on Ubuntu
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu
newgrp docker
```

### Step 4: Run the Application
```bash
git clone <YOUR_GIT_REPO_URL>
cd docker_assignment/project_64_food
docker compose up --build -d
```

### Step 5: Test in Browser
Navigate to:
```
http://<YOUR-EC2-PUBLIC-IP>/
```
You will see the live CraveCloud food ordering app with interactive ordering and MongoDB order persistence!

# InternOps — Complete Beginner's Setup & Contribution Guide

Repository: https://github.com/rajat-wyrm/InternOps

This guide assumes you have **never used Git, GitHub, or Node.js before**. Follow it top to bottom in order. Every step is explained — nothing is assumed.

---

## Table of Contents

1. [What You're Working With](#1-what-youre-working-with)
2. [Installing Node.js](#2-installing-nodejs)
3. [Installing Git](#3-installing-git)
4. [Creating a GitHub Account](#4-creating-a-github-account)
5. [Setting Up Git on Your Computer](#5-setting-up-git-on-your-computer)
6. [Connecting Git to GitHub (Authentication)](#6-connecting-git-to-github-authentication)
7. [Downloading (Cloning) the InternOps Project](#7-downloading-cloning-the-internops-project)
8. [Understanding the Project Structure](#8-understanding-the-project-structure)
9. [Installing Project Dependencies](#9-installing-project-dependencies)
10. [Setting Up Environment Variables](#10-setting-up-environment-variables)
11. [Setting Up the Database](#11-setting-up-the-database)
12. [Running the Project](#12-running-the-project)
13. [Git Basics — Branches, Commits, Pushing](#13-git-basics--branches-commits-pushing)
14. [How to Find or Create a Task](#14-how-to-find-or-create-a-task)
15. [How to Do a Pull Request (PR)](#15-how-to-do-a-pull-request-pr)
16. [Everyday Git Cheat Sheet](#16-everyday-git-cheat-sheet)
17. [Common Problems & Fixes](#17-common-problems--fixes)

---

## 1. What You're Working With

Before touching anything, know these words:

| Term | Meaning |
|---|---|
| **Git** | A tool installed on your computer that tracks changes to code over time. |
| **GitHub** | A website that stores Git projects online so teams can share and collaborate. |
| **Repository (repo)** | A project's folder, tracked by Git. InternOps is a repo. |
| **Clone** | Downloading a copy of a repo from GitHub onto your computer. |
| **Node.js** | A program that lets JavaScript run outside a browser — needed to run this project's backend and frontend. |
| **npm** | Comes bundled with Node.js. It downloads and manages the code "packages" (libraries) a project needs. |
| **Branch** | A separate, isolated line of work in Git so you don't mess up the main code while making changes. |
| **Commit** | A saved snapshot of your changes, with a message describing what you did. |
| **Push** | Uploading your commits from your computer to GitHub. |
| **Pull Request (PR)** | A formal request asking the team to review and merge your branch into the main project. |
| **Issue** | A tracked task, bug, or feature request on GitHub. This is usually where "tasks" live. |

InternOps itself is a workforce-management platform with:
- **Backend**: Node.js + Fastify + PostgreSQL
- **Frontend**: React + Vite + TailwindCSS

You don't need to understand all of that yet — just know there are two folders, `backend` and `frontend`, and each is set up separately.

---

## 2. Installing Node.js

The project needs **Node.js version 18 or higher**.

### Windows / macOS
1. Go to https://nodejs.org
2. Download the **LTS** version (the big green button — LTS means "Long Term Support," it's the stable one).
3. Run the installer and click Next through all the default options.
4. Restart your computer (recommended, not always required).

### Verify it worked
Open a terminal:
- **Windows**: search "PowerShell" in the Start menu and open it.
- **macOS**: open "Terminal" from Spotlight (Cmd+Space, type Terminal).

Type:
```powershell
node -v
npm -v
```
You should see version numbers like `v20.11.0` and `10.2.4`. If you see "command not found," restart your terminal, and if that fails, restart your computer.

---

## 3. Installing Git

### Windows
1. Go to https://git-scm.com/download/win
2. Download starts automatically. Run the installer.
3. Click Next on every screen using the **default options** (the defaults are fine for beginners — don't overthink the settings).
4. Finish the install.

### macOS
Open Terminal and type:
```bash
git --version
```
If Git isn't installed, macOS will prompt you to install "Command Line Developer Tools" — click Install.

### Verify it worked
In your terminal (PowerShell on Windows, Terminal on macOS):
```powershell
git --version
```
You should see something like `git version 2.44.0`.

---

## 4. Creating a GitHub Account

1. Go to https://github.com/signup
2. Enter your email, create a password, and pick a username (this username will be publicly visible — pick something professional, e.g. your real name or a variant of it).
3. Verify your email via the link GitHub sends you.
4. Once logged in, ask your team lead / project maintainer to **add you as a collaborator** on `rajat-wyrm/InternOps` (unless you're already added), or confirm whether the team uses a **fork-based workflow** (explained in Section 15).

---

## 5. Setting Up Git on Your Computer

Git needs to know who you are before you can commit any code. This is a **one-time setup**.

Open your terminal and run these two commands, replacing the name/email with your own (use the **same email as your GitHub account**):

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

Verify it saved correctly:
```powershell
git config --global --list
```
You should see `user.name` and `user.email` listed.

---

## 6. Connecting Git to GitHub (Authentication)

When you try to push code, GitHub needs to verify it's really you. The easiest method for beginners is **HTTPS with a Personal Access Token (PAT)**.

### Step 1 — Create a Personal Access Token
1. Log in to GitHub → click your profile picture (top right) → **Settings**.
2. Scroll down the left sidebar → **Developer settings**.
3. Click **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**.
4. Give it a name like `internops-laptop`.
5. Set an expiration (90 days is a safe beginner default).
6. Under "Select scopes," check **repo** (this gives it permission to read/write your repos).
7. Click **Generate token**.
8. **Copy the token immediately** — GitHub only shows it once. Paste it somewhere safe (like a password manager or a private note) — you'll use it as your "password" when Git asks.

### Step 2 — Use it
The first time you `git push` or `git pull` from a private/authenticated action, a window (or terminal prompt) will ask for your GitHub username and password:
- **Username**: your GitHub username
- **Password**: paste the **token**, not your actual GitHub password

Git/your OS will usually remember it after the first time (via "credential manager").

> **Alternative (more advanced): SSH keys.** If your team prefers SSH, ask your mentor — it avoids re-entering tokens but requires a few extra setup steps (`ssh-keygen`, adding the public key to GitHub under Settings → SSH and GPG keys). Stick with HTTPS + token for now if you're new.

---

## 7. Downloading (Cloning) the InternOps Project

1. Open your terminal.
2. Navigate to the folder where you want the project to live, e.g.:
```powershell
cd Documents
mkdir Projects
cd Projects
```
3. Clone the repository:
```powershell
git clone https://github.com/rajat-wyrm/InternOps.git
```
4. Move into the project folder:
```powershell
cd InternOps
```

You now have a full local copy of the project.

---

## 8. Understanding the Project Structure

```
InternOps/
├── .github/workflows/     # CI/CD automation (GitHub Actions)
├── backend/                # Node.js + Fastify + PostgreSQL API
├── frontend/                # React + Vite + TailwindCSS UI
├── Dockerfile
├── docker-compose.yml
├── project-structure.txt   # Detailed folder breakdown
├── start-production.ps1
├── stop-production.ps1
└── README.md
```

As a beginner, you'll spend most of your time inside either `backend/` or `frontend/`, depending on what you're assigned.

---

## 9. Installing Project Dependencies

Every Node.js project has a `package.json` file listing the libraries it needs. `npm install` reads that file and downloads everything.

From the project root:
```powershell
cd backend
npm install
```
```powershell
cd ../frontend
npm install
```

This creates a `node_modules` folder in each — that's normal, it's just the downloaded libraries (never edit files inside it, and never commit it — it's already excluded via `.gitignore`).

---

## 10. Setting Up Environment Variables

The backend needs secret configuration (database URL, JWT secret, etc.) that should **never** be committed to Git. This lives in a `.env` file.

1. Inside `backend/`, look for a file called `.env.example`.
2. Copy it to a new file named `.env`:
```powershell
cd backend
copy .env.example .env      # Windows PowerShell
# or on macOS/Linux:
cp .env.example .env
```
3. Open `.env` in any code editor (VS Code recommended) and fill in real values. At minimum you'll need:

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Your PostgreSQL connection string |
| `JWT_SECRET` | Any long random string (used to sign login tokens) |
| `PORT` | Leave as `5000` unless told otherwise |
| `NODE_ENV` | `development` while you're working locally |

Ask your mentor/team lead for shared values (like a dev database URL) if you don't have your own PostgreSQL set up yet.

---

## 11. Setting Up the Database

You'll need PostgreSQL installed and running (locally, or a hosted dev database your team gives you access to — e.g., Neon).

Once `DATABASE_URL` in `.env` is correct, from `backend/`:

```powershell
npm run migrate
```
This creates all the necessary tables.

```powershell
npm run seed
```
This creates a default admin account: `admin@internops.com` / `Admin@123` (for local testing only).

---

## 12. Running the Project

### Start the backend
```powershell
cd backend
npm run dev
```
This starts the API server (auto-restarts when you save a file). Visit `http://localhost:5000/docs` to see the Swagger API documentation.

### Start the frontend (in a **separate** terminal window)
```powershell
cd frontend
npm run dev
```
This gives you a local URL (usually `http://localhost:5173`) to view the app in your browser.

> Keep both terminals open while working — closing them stops the servers.

---

## 13. Git Basics — Branches, Commits, Pushing

**Golden rule: never write new code directly on `master`.** Always create a new branch first.

### Step-by-step for every task:

**1. Make sure your local `master` is up to date:**
```powershell
git checkout master
git pull origin master
```

**2. Create a new branch for your task:**
```powershell
git checkout -b feature/short-task-description
```
Naming convention examples: `feature/notice-board-ui`, `fix/csrf-bug`, `chore/update-readme`.

**3. Make your code changes** in your editor as normal.

**4. Check what changed:**
```powershell
git status
```

**5. Stage your changes** (tell Git which files to include in the next commit):
```powershell
git add .
```
(`.` means "all changed files" — or name a specific file instead, e.g. `git add backend/routes/tasks.js`.)

**6. Commit with a clear message:**
```powershell
git commit -m "Fix: correct CSRF token validation on task creation"
```

**7. Push your branch to GitHub:**
```powershell
git push origin feature/short-task-description
```
The first time you push a new branch, Git may show you the exact command to run — just copy-paste it if it differs slightly.

---

## 14. How to Find or Create a Task

InternOps tracks work using **GitHub Issues**.

### To find a task:
1. Go to https://github.com/rajat-wyrm/InternOps/issues
2. Browse open issues. Look for labels like `good first issue`, `bug`, or `enhancement` if available.
3. Comment on the issue saying you'd like to work on it (avoids two people doing the same task).
4. Ask your team lead if issues are assigned differently (e.g., via a task board/Notice Board feature in the app itself, or Slack/Discord).

### To create a task:
1. Go to the **Issues** tab → click **New issue**.
2. Give it a clear title, e.g. "Bug: Notification count not updating after mark-as-read."
3. In the description, explain:
   - What's wrong / what's needed
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
4. Add labels if you have permission, and assign yourself if you're doing the work.
5. Click **Submit new issue**.

---

## 15. How to Do a Pull Request (PR)

A Pull Request is how you propose merging your branch's changes into `master` so the team can review before it goes live.

### If you're a direct collaborator (have push access):

1. Push your branch (see Section 13, step 7).
2. Go to https://github.com/rajat-wyrm/InternOps
3. GitHub usually shows a yellow banner: **"Compare & pull request"** for your recently pushed branch — click it.
   - If not, go to the **Pull requests** tab → **New pull request** → choose your branch as "compare" and `master` as "base."
4. Fill in:
   - **Title**: short summary, e.g. "Fix CSRF validation bug in task creation"
   - **Description**: what you changed, why, and how to test it. Reference the issue if there is one, e.g. `Closes #42`.
5. Click **Create pull request**.
6. Wait for a reviewer (usually the maintainer/team lead) to review. They may:
   - Approve and merge it
   - Request changes — go back to your branch, make edits, `git add`, `git commit`, `git push` again (it auto-updates the same PR)
7. Once merged, delete your branch (GitHub shows a "Delete branch" button after merge) and start fresh from `master` for your next task.

### If you don't have push access (fork-based workflow):

1. Click **Fork** (top-right of the repo page) to create your own copy under your GitHub account.
2. Clone **your fork** instead of the original:
```powershell
git clone https://github.com/YOUR-USERNAME/InternOps.git
```
3. Do all your branch/commit work as in Section 13, but push to **your fork**:
```powershell
git push origin feature/short-task-description
```
4. Go to your fork on GitHub → **Contribute** → **Open pull request**. This creates a PR from your fork's branch into the original repo's `master`.

> Note: as of this writing, the InternOps README states external contributions aren't accepted — so this workflow applies to internal team members with fork/PR access rather than the general public. Confirm the exact process with your team lead.

---

## 16. Everyday Git Cheat Sheet

| What you want to do | Command |
|---|---|
| See current status | `git status` |
| Switch to master branch | `git checkout master` |
| Get latest code from GitHub | `git pull origin master` |
| Create + switch to new branch | `git checkout -b branch-name` |
| Switch to an existing branch | `git checkout branch-name` |
| Stage all changes | `git add .` |
| Commit staged changes | `git commit -m "message"` |
| Push branch to GitHub | `git push origin branch-name` |
| See commit history | `git log --oneline` |
| See which branch you're on | `git branch` |
| Discard uncommitted changes in a file | `git checkout -- filename` |
| Undo last commit (keep changes) | `git reset --soft HEAD~1` |

---

## 17. Common Problems & Fixes

| Problem | Fix |
|---|---|
| `git: command not found` | Restart your terminal/computer after installing Git. |
| `npm: command not found` | Node.js isn't installed correctly — reinstall from nodejs.org. |
| Push asks for password repeatedly | Use your Personal Access Token (Section 6), not your actual GitHub password. |
| `Permission denied (publickey)` | You're trying to use SSH without a configured key — switch to the HTTPS clone URL instead. |
| Merge conflicts when pulling | Open the conflicted file(s), look for `<<<<<<<`, `=======`, `>>>>>>>` markers, manually decide what to keep, delete the markers, then `git add .` and `git commit`. |
| Backend won't start — `Plugin must be a function` | Ensure `app.register()` calls receive a function, not an object (per InternOps README troubleshooting). |
| Migrations fail with BOM error | Regenerate the SQL file without a byte-order-mark; the migration runner strips BOM automatically but source files should be BOM-free. |
| `DATABASE_URL` errors / timeouts | Double-check the connection string in `.env`; if using Neon, ensure `uselibpqcompat=true` is included. |

---

**You're ready.** Clone it, branch off, build something small first (like fixing a typo or a minor bug) to get comfortable with the full loop — branch → commit → push → PR — before taking on bigger tasks.

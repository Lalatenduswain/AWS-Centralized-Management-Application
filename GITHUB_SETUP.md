# GitHub Private Repository Setup

## Option 1: Create via GitHub Website (Easiest)

### Step 1: Create Repository on GitHub
1. Go to https://github.com/new
2. Fill in the form:
   - **Repository name**: `aws-centralized-management` (or your preferred name)
   - **Description**: "AWS Centralized Management Application - Multi-platform app for managing AWS resources"
   - **Visibility**: ✅ **Private** (check this!)
   - **Initialize**: ❌ Leave all checkboxes UNCHECKED (we already have code)
3. Click "Create repository"

### Step 2: Push Your Code
GitHub will show you commands. Use these (replace `YOUR_USERNAME`):

```bash
# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/aws-centralized-management.git

# Push your code
git branch -M main
git push -u origin main
```

**Done!** Your code is now in a private GitHub repo.

---

## Option 2: Create via GitHub CLI (Advanced)

### Step 1: Install GitHub CLI
```bash
# macOS
brew install gh

# Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Windows
winget install --id GitHub.cli
```

### Step 2: Authenticate
```bash
gh auth login
```
Follow the prompts to authenticate with GitHub.

### Step 3: Create & Push
```bash
# Create private repo and push
gh repo create aws-centralized-management --private --source=. --remote=origin --push

# Or if you want to specify description
gh repo create aws-centralized-management \
  --private \
  --description "AWS Centralized Management Application - Multi-platform app for managing AWS resources" \
  --source=. \
  --remote=origin \
  --push
```

**Done!** Repository created and code pushed in one command.

---

## Option 3: Manual Script (If you prefer)

I can create a script that guides you through the process:

```bash
./scripts/setup-github-repo.sh
```

This will:
1. Check if you're authenticated with GitHub
2. Ask for repository name
3. Create the private repo
4. Push your code
5. Open the repo in your browser

---

## Post-Setup: Add Secrets

Once your repo is created, add these secrets for CI/CD:

### Step 1: Go to Settings
```
https://github.com/YOUR_USERNAME/aws-centralized-management/settings/secrets/actions
```

### Step 2: Add Secrets
Click "New repository secret" and add:

```
DATABASE_URL          = Your PostgreSQL connection string
ENCRYPTION_KEY        = Your 32-character encryption key
JWT_SECRET           = Your JWT secret
SMTP_HOST            = Your email SMTP host
SMTP_USER            = Your email username
SMTP_PASS            = Your email password
```

---

## .gitignore Check

Make sure these are in `.gitignore` (already done):
```
.env
.env.local
.env.production
node_modules/
dist/
build/
```

---

## Verify Your Push

After pushing, check:
```bash
git remote -v
git log --oneline
```

You should see:
```
origin  https://github.com/YOUR_USERNAME/aws-centralized-management.git (fetch)
origin  https://github.com/YOUR_USERNAME/aws-centralized-management.git (push)
```

---

## Inviting Collaborators (Optional)

### If you want to add team members:
1. Go to: `https://github.com/YOUR_USERNAME/aws-centralized-management/settings/access`
2. Click "Add people"
3. Enter their GitHub username or email
4. Select role:
   - **Admin** - Full access
   - **Write** - Can push code
   - **Read** - View only

---

## Branch Protection (Recommended for Production)

### Protect your main branch:
1. Go to: `https://github.com/YOUR_USERNAME/aws-centralized-management/settings/branches`
2. Click "Add rule"
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass
   - ✅ Include administrators
5. Save changes

This prevents direct pushes to main - all changes must go through pull requests.

---

## Quick Reference Commands

```bash
# Check current remote
git remote -v

# Add remote (if not added)
git remote add origin https://github.com/YOUR_USERNAME/repo-name.git

# Push to GitHub
git push -u origin main

# Pull latest changes
git pull origin main

# Create new branch
git checkout -b feature/billing-system

# Push new branch
git push -u origin feature/billing-system

# View commits
git log --oneline --graph

# Check status
git status
```

---

## Troubleshooting

### "Repository not found"
- Make sure you're using the correct username
- Check if you have access to the repository
- Try HTTPS instead of SSH (or vice versa)

### Authentication Failed
```bash
# Use GitHub CLI
gh auth login

# Or set up SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"
# Add to GitHub: https://github.com/settings/keys
```

### Large File Warning
If you get warnings about large files:
```bash
# Check large files
find . -type f -size +50M

# Remove from history if needed
git filter-branch --tree-filter 'rm -f path/to/large/file' HEAD
```

### Already Exists Error
If repo already exists:
```bash
# Use a different name
gh repo create aws-mgmt-app --private --source=. --push

# Or delete the existing repo first (careful!)
gh repo delete YOUR_USERNAME/aws-centralized-management
```

---

## Next Steps After Push

1. ✅ Add repository description and topics
2. ✅ Create README badges (build status, license)
3. ✅ Set up GitHub Actions for CI/CD
4. ✅ Enable Dependabot for security updates
5. ✅ Add repository topics: `aws`, `management`, `react`, `node`, `typescript`

---

**Ready to push?** Choose one of the options above and let me know if you need help! 🚀

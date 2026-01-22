#!/bin/bash

# GitHub Repository Setup Script
# Creates a private repository and pushes your code

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  GitHub Private Repository Setup${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not a git repository${NC}"
    echo "   Run 'git init' first"
    exit 1
fi

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) is not installed${NC}"
    echo ""
    echo "Please install it:"
    echo "  macOS:   brew install gh"
    echo "  Linux:   See https://cli.github.com/manual/installation"
    echo "  Windows: winget install --id GitHub.cli"
    echo ""
    echo "Or use Option 1 from GITHUB_SETUP.md (create via website)"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated with GitHub${NC}"
    echo ""
    echo "Let's authenticate now..."
    gh auth login
    echo ""
fi

# Get repository name
echo -e "${BLUE}Step 1: Repository Name${NC}"
echo "Default: aws-centralized-management"
read -p "Enter repository name (or press Enter for default): " REPO_NAME
REPO_NAME=${REPO_NAME:-aws-centralized-management}

echo ""

# Get description
echo -e "${BLUE}Step 2: Repository Description${NC}"
DEFAULT_DESC="AWS Centralized Management Application - Multi-platform app for managing AWS resources"
echo "Default: $DEFAULT_DESC"
read -p "Enter description (or press Enter for default): " REPO_DESC
REPO_DESC=${REPO_DESC:-$DEFAULT_DESC}

echo ""

# Confirm
echo -e "${BLUE}Step 3: Confirm Details${NC}"
echo "Repository Name: $REPO_NAME"
echo "Description:     $REPO_DESC"
echo "Visibility:      Private"
echo ""
read -p "Create repository? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}Creating private repository...${NC}"

# Create repository
if gh repo create "$REPO_NAME" \
    --private \
    --description "$REPO_DESC" \
    --source=. \
    --remote=origin \
    --push; then

    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}✓ Repository created successfully!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""

    # Get the repo URL
    REPO_URL=$(gh repo view --json url -q .url)

    echo "Repository URL: $REPO_URL"
    echo ""
    echo "What's next:"
    echo "  1. ✓ Code pushed to GitHub"
    echo "  2. Add secrets for deployment (see GITHUB_SETUP.md)"
    echo "  3. Set up branch protection rules"
    echo "  4. Invite collaborators (if needed)"
    echo ""

    # Ask if they want to open in browser
    read -p "Open repository in browser? (y/n): " OPEN_BROWSER
    if [ "$OPEN_BROWSER" = "y" ] || [ "$OPEN_BROWSER" = "Y" ]; then
        gh repo view --web
    fi

else
    echo ""
    echo -e "${RED}❌ Failed to create repository${NC}"
    echo ""
    echo "Possible reasons:"
    echo "  - Repository name already exists"
    echo "  - Network connection issue"
    echo "  - GitHub authentication expired"
    echo ""
    echo "Try:"
    echo "  1. Choose a different repository name"
    echo "  2. Run: gh auth refresh"
    echo "  3. Use Option 1 from GITHUB_SETUP.md (create via website)"
    exit 1
fi

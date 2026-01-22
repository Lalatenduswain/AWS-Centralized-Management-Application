# Contributing Guide

Thank you for considering contributing to the AWS Centralized Management Application!

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How Can I Contribute?](#how-can-i-contribute)
3. [Development Setup](#development-setup)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Bug Reports](#bug-reports)
8. [Feature Requests](#feature-requests)

---

## Code of Conduct

This project follows a standard Code of Conduct. By participating, you are expected to uphold this code.

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members

---

## How Can I Contribute?

### Reporting Bugs

Before submitting a bug report:
1. Check existing [GitHub Issues](https://github.com/Lalatenduswain/AWS-Centralized-Management-Application/issues)
2. Try the latest version
3. Read the [Troubleshooting Guide](TROUBLESHOOTING.md)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Include:
- Clear title and description
- Use case and rationale
- Examples of how it would work
- Mockups or diagrams (if applicable)

### Code Contributions

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

---

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Git

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/AWS-Centralized-Management-Application.git
cd AWS-Centralized-Management-Application

# Add upstream remote
git remote add upstream https://github.com/Lalatenduswain/AWS-Centralized-Management-Application.git

# Install dependencies
cd backend && npm install
cd ../web && npm install

# Set up database
createdb aws_central_mgmt
psql -d aws_central_mgmt -f backend/schema.sql

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# Run backend
cd backend && npm run dev

# Run frontend (new terminal)
cd web && npm start
```

---

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow existing code style
- Use meaningful variable names
- Add JSDoc comments for functions
- Keep functions small and focused

### File Structure

```typescript
/**
 * File description
 *
 * Brief explanation of what this file does.
 */

import statements...

// Interfaces/Types

// Functions

export default...
```

### Naming Conventions

- **Files**: `kebab-case.ts`
- **Components**: `PascalCase.tsx`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase`

### Code Example

```typescript
/**
 * Calculate user's current spending
 *
 * @param userId - User ID to calculate for
 * @param period - Billing period (YYYY-MM)
 * @returns Current spending amount
 */
export const calculateCurrentSpending = async (
  userId: number,
  period: string
): Promise<number> => {
  try {
    const result = await query(
      `SELECT SUM(cost) as total
       FROM billing_records
       WHERE user_id = $1 AND billing_period = $2`,
      [userId, period]
    );

    return parseFloat(result.rows[0]?.total || '0');
  } catch (error) {
    console.error('Error calculating spending:', error);
    throw error;
  }
};
```

---

## Commit Guidelines

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(billing): add monthly cost forecast endpoint

Implemented linear extrapolation algorithm for predicting
next month's costs based on current spending trends.

Closes #123
```

```
fix(auth): resolve JWT expiration handling

Fixed issue where expired tokens weren't being caught properly,
causing 500 errors instead of 401 responses.
```

### Co-Authoring

When pair programming or receiving help:

```
feat(export): add PDF invoice generation

Co-authored-by: Name <email@example.com>
```

---

## Pull Request Process

### Before Submitting

1. ✅ Code compiles without errors
2. ✅ All tests pass (when tests exist)
3. ✅ Code follows style guidelines
4. ✅ Documentation updated
5. ✅ Commit messages are clear
6. ✅ Branch is up-to-date with main

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Code compiles
- [ ] Self-review completed
- [ ] Comments added where needed
- [ ] Documentation updated
- [ ] No new warnings

## Screenshots (if applicable)
Add screenshots here
```

### Review Process

1. Submit PR with clear description
2. Wait for automated checks (when available)
3. Address reviewer feedback
4. Make requested changes
5. Request re-review
6. Merge when approved

---

## Bug Reports

### Good Bug Report

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g., Ubuntu 20.04]
 - Node version: [e.g., 18.12.0]
 - Browser: [e.g., Chrome 108]

**Additional context**
Any other relevant information.
```

---

## Feature Requests

### Good Feature Request

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Mockups, diagrams, or examples.
```

---

## Development Tips

### Running Tests (Future)

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd web && npm test

# E2E tests
npm run test:e2e
```

### Debugging

```bash
# Backend debugging
cd backend
npm run dev -- --inspect

# Then attach Chrome DevTools to Node process
```

### Database Migrations

```bash
# Create new migration
cd backend/migrations
touch 004_your_migration_name.sql

# Apply migration
psql -d aws_central_mgmt -f 004_your_migration_name.sql
```

---

## Questions?

- Open a [Discussion](https://github.com/Lalatenduswain/AWS-Centralized-Management-Application/discussions)
- Join our community (link TBD)
- Email: (contact email)

---

**Thank you for contributing! 🎉**

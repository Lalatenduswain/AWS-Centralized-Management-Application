# Testing Guide

Testing strategies and guidelines for the AWS Centralized Management Application.

**Note**: Automated testing is not yet implemented. This guide provides the framework for future test implementation.

---

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Manual Testing](#manual-testing)
6. [Performance Testing](#performance-testing)
7. [Security Testing](#security-testing)

---

## Testing Strategy

### Test Pyramid

```
        /\
       /  \     E2E Tests (10%)
      /----\    
     /      \   Integration Tests (30%)
    /--------\
   /          \ Unit Tests (60%)
  /____________\
```

### Coverage Goals

- **Unit Tests**: 80% code coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows

---

## Unit Testing

### Backend Unit Tests

#### Framework: Jest

```bash
# Install dependencies
npm install --save-dev jest @types/jest ts-jest

# Configure Jest
npx ts-jest config:init
```

#### Example Test

```typescript
// backend/src/services/__tests__/encryption.service.test.ts

import { encryptCredential, decryptCredential } from '../encryption.service';

describe('Encryption Service', () => {
  const testKey = 'a'.repeat(32); // 32 characters

  test('should encrypt and decrypt successfully', () => {
    const original = 'test-secret-key';
    
    const { encrypted, iv } = encryptCredential(original, testKey);
    const decrypted = decryptCredential(encrypted, iv, testKey);
    
    expect(decrypted).toBe(original);
  });

  test('should produce different outputs for same input', () => {
    const original = 'test-secret';
    
    const result1 = encryptCredential(original, testKey);
    const result2 = encryptCredential(original, testKey);
    
    expect(result1.encrypted).not.toBe(result2.encrypted);
    expect(result1.iv).not.toBe(result2.iv);
  });
});
```

#### Run Tests

```bash
cd backend
npm test

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Frontend Unit Tests

#### Framework: React Testing Library + Jest

```bash
# Install dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

#### Example Test

```typescript
// web/src/components/__tests__/Dashboard.test.tsx

import { render, screen } from '@testing-library/react';
import Dashboard from '../Dashboard';

describe('Dashboard Component', () => {
  test('renders dashboard title', () => {
    render(<Dashboard />);
    const title = screen.getByText(/Billing Dashboard/i);
    expect(title).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    render(<Dashboard />);
    const loading = screen.getByText(/Loading/i);
    expect(loading).toBeInTheDocument();
  });
});
```

---

## Integration Testing

### API Integration Tests

#### Framework: Supertest

```bash
# Install dependencies
npm install --save-dev supertest @types/supertest
```

#### Example Test

```typescript
// backend/src/routes/__tests__/auth.routes.test.ts

import request from 'supertest';
import app from '../../server';

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    test('should register new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePassword123!'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });

    test('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });

    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });
  });
});
```

---

## End-to-End Testing

### Framework: Playwright or Cypress

```bash
# Install Playwright
npm install --save-dev @playwright/test

# Initialize
npx playwright install
```

### Example E2E Test

```typescript
// e2e/billing-flow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Billing Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3001/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display billing dashboard', async ({ page }) => {
    await page.goto('http://localhost:3001/billing');
    
    // Check title
    await expect(page.locator('h1')).toContainText('Billing Dashboard');
    
    // Check summary cards
    await expect(page.locator('.summary-cards')).toBeVisible();
    
    // Check charts
    await expect(page.locator('.chart-card')).toHaveCount(2);
  });

  test('should export CSV', async ({ page }) => {
    await page.goto('http://localhost:3001/billing');
    
    // Click export button
    await page.click('button:has-text("Export")');
    
    // Wait for menu
    await expect(page.locator('.export-menu')).toBeVisible();
    
    // Click CSV export
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Billing Records")');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should display comprehensive forecast', async ({ page }) => {
    await page.goto('http://localhost:3001/billing');
    
    // Click forecast button
    await page.click('button:has-text("Detailed Forecast")');
    
    // Wait for forecast section
    await expect(page.locator('.forecast-section')).toBeVisible();
    
    // Check all forecast methods displayed
    await expect(page.locator('.forecast-method-card')).toHaveCount(4);
  });
});
```

---

## Manual Testing

### Test Checklist

#### Authentication
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] JWT token works for protected routes
- [ ] Token expiration handled correctly

#### Client Management
- [ ] Create new client
- [ ] List all clients
- [ ] Update client details
- [ ] Delete client
- [ ] Verify credentials encrypted in database

#### Billing Dashboard
- [ ] Dashboard loads with data
- [ ] Charts render correctly
- [ ] Period selector works
- [ ] Refresh button updates data
- [ ] Budget status displays correctly
- [ ] Responsive design on mobile

#### Exports
- [ ] Export billing records CSV
- [ ] Export cost breakdown CSV
- [ ] Export monthly invoice PDF
- [ ] Files download correctly
- [ ] File names are descriptive

#### Forecasting
- [ ] Comprehensive forecast loads
- [ ] All 4 methods displayed
- [ ] Consensus calculated correctly
- [ ] Charts render properly
- [ ] Confidence badges show correct colors

#### Budget Alerts
- [ ] Threshold alert email sent
- [ ] Over budget alert email sent
- [ ] Email formatting correct
- [ ] Alert history saved
- [ ] Duplicate prevention works

---

## Performance Testing

### Load Testing with Apache Bench

```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:3000/health

# Test authenticated endpoint
ab -n 100 -c 5 -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/billing/user/1/summary
```

### Load Testing with Artillery

```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"

scenarios:
  - name: "API Health Check"
    flow:
      - get:
          url: "/health"
```

```bash
# Run test
artillery run artillery-config.yml
```

### Performance Metrics

Target performance:
- **Response Time**: < 200ms (p95)
- **Throughput**: 100+ requests/second
- **Error Rate**: < 1%
- **Uptime**: 99.9%

---

## Security Testing

### Dependency Scanning

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Manual review
npm audit --json
```

### OWASP ZAP

```bash
# Download OWASP ZAP
# Run automated scan
# Review findings
```

### Manual Security Tests

- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF token validation
- [ ] Authentication bypass attempts
- [ ] Credential exposure in logs
- [ ] HTTPS enforcement
- [ ] Security headers present

---

## Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd backend
        npm install
    
    - name: Run tests
      run: |
        cd backend
        npm test
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./backend/coverage/lcov.info
```

---

## Test Data Management

### Seed Data

```typescript
// backend/src/seeds/test-data.ts

export const seedTestData = async () => {
  // Create test user
  await createUser({
    email: 'test@example.com',
    password: 'Test123!'
  });

  // Create test client
  await createClient({
    client_name: 'Test AWS',
    access_key_id: 'TEST_KEY',
    secret_access_key: 'TEST_SECRET'
  });

  // Create test budget
  await createBudget({
    user_id: 1,
    monthly_limit: 1000.00
  });
};
```

### Cleanup

```typescript
// Cleanup after tests
afterEach(async () => {
  await cleanupTestData();
});
```

---

## Best Practices

1. **Write Tests First** (TDD)
2. **Keep Tests Independent**
3. **Use Descriptive Names**
4. **Test Edge Cases**
5. **Mock External Services**
6. **Clean Up After Tests**
7. **Run Tests in CI/CD**
8. **Monitor Test Performance**

---

## Future Testing Additions

- [ ] Visual regression testing
- [ ] Accessibility testing
- [ ] API contract testing
- [ ] Chaos engineering
- [ ] Synthetic monitoring

---

**For issues, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)**

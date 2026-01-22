# API Reference

Complete API documentation for the AWS Centralized Management Application.

**Base URL**: `http://localhost:3000/api` (development)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Clients](#clients)
3. [AWS Resources](#aws-resources)
4. [Billing](#billing)
5. [Budgets](#budgets)
6. [Resource Assignments](#resource-assignments)
7. [Budget Alerts](#budget-alerts)
8. [Exports & Reports](#exports--reports)
9. [Cost Forecasting](#cost-forecasting)
10. [Activity Logs](#activity-logs)
11. [Error Responses](#error-responses)

---

## Authentication

### Register User

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### Login

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**Authentication Header** (for protected routes):
```
Authorization: Bearer <token>
```

---

## Clients

All client endpoints require authentication.

### List Clients

**Endpoint**: `GET /api/clients`

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "client_name": "Production AWS Account",
      "aws_account_id": "123456789012",
      "region": "us-east-1",
      "notes": "Main production account",
      "created_at": "2026-01-20T10:00:00.000Z"
    }
  ]
}
```

### Create Client

**Endpoint**: `POST /api/clients`

**Request Body**:
```json
{
  "client_name": "Production AWS",
  "access_key_id": "AKIAIOSFODNN7EXAMPLE",
  "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "region": "us-east-1",
  "aws_account_id": "123456789012",
  "notes": "Main account"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Client created successfully",
  "data": {
    "id": 1,
    "client_name": "Production AWS",
    "region": "us-east-1"
  }
}
```

### Get Client

**Endpoint**: `GET /api/clients/:id`

### Update Client

**Endpoint**: `PUT /api/clients/:id`

### Delete Client

**Endpoint**: `DELETE /api/clients/:id`

---

## Billing

### Get User Cost Summary

**Endpoint**: `GET /api/billing/user/:userId/summary`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "billing_period": "2026-01",
    "total_cost": 1234.56,
    "currency": "USD"
  }
}
```

### Get Cost Breakdown

**Endpoint**: `GET /api/billing/user/:userId/breakdown`

**Query Parameters**:
- `period` (optional): Billing period (YYYY-MM)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "period": "2026-01",
    "breakdown": [
      {
        "service_name": "EC2",
        "total_cost": 456.78,
        "resource_count": 12
      },
      {
        "service_name": "S3",
        "total_cost": 123.45,
        "resource_count": 5
      }
    ]
  }
}
```

### Get Daily Cost Trend

**Endpoint**: `GET /api/billing/user/:userId/trend`

**Query Parameters**:
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "trend": [
      {
        "billing_date": "2026-01-01",
        "total_cost": 45.67
      },
      {
        "billing_date": "2026-01-02",
        "total_cost": 48.90
      }
    ]
  }
}
```

### Get Top Cost Drivers

**Endpoint**: `GET /api/billing/user/:userId/top-drivers`

**Query Parameters**:
- `period` (optional): Billing period (YYYY-MM)
- `limit` (optional, default: 10): Number of results

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "top_drivers": [
      {
        "resource_id": "i-0123456789abcdef0",
        "resource_type": "instance",
        "service_name": "EC2",
        "total_cost": 234.56
      }
    ]
  }
}
```

---

## Budgets

### Create Budget

**Endpoint**: `POST /api/budgets`

**Request Body**:
```json
{
  "user_id": 1,
  "monthly_limit": 1000.00,
  "currency": "USD",
  "alert_threshold": 0.80,
  "alerts_enabled": true,
  "start_date": "2026-01-01"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Budget created successfully",
  "data": {
    "id": 1,
    "monthly_limit": 1000.00,
    "alert_threshold": 0.80
  }
}
```

### Get Budget Status

**Endpoint**: `GET /api/budgets/user/:userId/status`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "status": {
      "budget": {
        "id": 1,
        "monthly_limit": 1000.00,
        "alert_threshold": 0.80,
        "currency": "USD"
      },
      "currentSpending": 456.78,
      "remainingBudget": 543.22,
      "percentageUsed": 45.68,
      "isOverBudget": false,
      "daysLeftInMonth": 15
    }
  }
}
```

---

## Exports & Reports

All export endpoints return file downloads (blob).

### Export Billing Records (CSV)

**Endpoint**: `GET /api/exports/billing-records/csv`

**Query Parameters**:
- `userId` (required): User ID
- `startDate` (optional): Start date
- `endDate` (optional): End date

**Response**: CSV file download

### Export Cost Breakdown (CSV)

**Endpoint**: `GET /api/exports/cost-breakdown/csv`

**Query Parameters**:
- `userId` (required): User ID
- `period` (optional): Billing period (YYYY-MM)

### Export Monthly Invoice (PDF)

**Endpoint**: `GET /api/exports/monthly-invoice/pdf`

**Query Parameters**:
- `userId` (required): User ID
- `period` (optional): Billing period (YYYY-MM)

**Response**: PDF file download

---

## Cost Forecasting

### Get Comprehensive Forecast

**Endpoint**: `GET /api/exports/forecast/comprehensive`

**Query Parameters**:
- `userId` (required): User ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "forecasts": [
      {
        "method": "linear_extrapolation",
        "forecast_period": "2026-02",
        "forecasted_cost": 1234.56,
        "confidence": "high",
        "trend": "increasing",
        "daily_average": 39.82,
        "data_points": 31
      },
      {
        "method": "moving_average_7day",
        "forecast_period": "2026-02",
        "forecasted_cost": 1245.67,
        "confidence": "high",
        "trend": "stable",
        "daily_average": 40.18,
        "data_points": 31
      }
    ],
    "recommended": {
      "method": "exponential_smoothing",
      "forecasted_cost": 1250.00,
      "confidence": "high"
    },
    "consensus": 1243.41
  }
}
```

### Get Forecast by Method

**Endpoint**: `GET /api/exports/forecast/:method`

**Parameters**:
- `method`: `linear` | `moving-average` | `exponential` | `historical`

**Query Parameters**:
- `userId` (required): User ID

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error: email is required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details (development only)"
}
```

---

## Rate Limiting

Currently no rate limiting. Will be added in future versions.

---

## Pagination

Endpoints returning lists support pagination:

**Query Parameters**:
- `limit` (default: 50): Number of results
- `offset` (default: 0): Starting position

---

## Best Practices

1. **Always use HTTPS in production**
2. **Store JWT securely** (httpOnly cookies or secure storage)
3. **Refresh tokens before expiration**
4. **Handle errors gracefully**
5. **Validate inputs on client-side** before API calls

---

For more details, see the [source code](https://github.com/Lalatenduswain/AWS-Centralized-Management-Application).

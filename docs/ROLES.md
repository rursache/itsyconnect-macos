# App Store Connect API - Roles & Permissions Reference

## Overview

App Store Connect API keys inherit permissions from the role assigned during key creation. Each API key is scoped to one role. The API key role determines which ASC API endpoints the key can access.

There are two types of API keys:
- **Team Keys** - apply across all apps in the account, assigned a role by Admin/Account Holder
- **Individual Keys** - tied to a specific user's role and permissions, one per user

## Roles

### Account Holder
- Automatically assigned to the person who enrolled in the Apple Developer Program
- Only one person can hold this role
- Full access to everything
- Only role that can: sign legal agreements, renew membership, create Developer ID certificates, request API access

### Admin
- Broad access similar to Account Holder
- Can manage users and roles
- Can access all app metadata, analytics, sales, financial reports
- Cannot manage contracts, tax, and banking information

### App Manager
- Can manage app metadata, pricing, availability
- Can submit apps for review
- Can manage TestFlight beta testing
- Can access app analytics
- Can respond to user reviews
- Cannot manage users or view financial reports

### Developer
- Limited access
- Can view app information
- Can access app analytics
- Can manage TestFlight beta testing
- Cannot edit app metadata
- Cannot respond to reviews
- Cannot access financial reports

### Finance
- Can view sales and financial reports
- Can manage contracts, tax, and banking details
- Cannot manage apps, users, or respond to reviews

### Marketing
- Can edit app descriptions, screenshots, and preview videos
- Can manage promotional campaigns
- Can access app analytics
- Cannot access sales reports or TestFlight

### Customer Support
- Can access app information
- Can respond to user reviews on the App Store
- Cannot edit app metadata
- Cannot access analytics
- Cannot manage TestFlight

### Sales
- Can view and download sales and financial reports
- Cannot manage app metadata
- Cannot access TestFlight
- Cannot respond to reviews

## Permissions Matrix

| Capability | Account Holder | Admin | App Manager | Developer | Finance | Marketing | Customer Support | Sales |
|---|---|---|---|---|---|---|---|---|
| Manage users & roles | YES | YES | NO | NO | NO | NO | NO | NO |
| Add new app | YES | YES | YES | NO | NO | NO | NO | NO |
| Edit app metadata (description, what's new, keywords) | YES | YES | YES | NO | NO | YES | NO | NO |
| Upload screenshots & previews | YES | YES | YES | NO | NO | YES | NO | NO |
| Submit app for review | YES | YES | YES | NO | NO | NO | NO | NO |
| Manage TestFlight (builds, testers, groups) | YES | YES | YES | YES | NO | NO | NO | NO |
| Respond to user reviews | YES | YES | YES | NO | NO | NO | YES | NO |
| View app analytics | YES | YES | YES | YES | NO | YES | NO | NO |
| View sales & trends | YES | YES | NO | NO | YES | NO | NO | YES |
| View financial reports & payments | YES | YES | NO | NO | YES | NO | NO | YES |
| Manage app pricing | YES | YES | YES | NO | NO | NO | NO | NO |
| Manage in-app purchases | YES | YES | YES | NO | NO | NO | NO | NO |
| Manage subscriptions | YES | YES | YES | NO | NO | NO | NO | NO |
| Certificates & provisioning profiles | YES | YES | Optional | Optional | NO | NO | NO | NO |
| Manage agreements | YES | NO | NO | NO | NO | NO | NO | NO |
| Manage banking info | YES | NO | NO | NO | YES | NO | NO | NO |
| Manage tax info | YES | NO | NO | NO | YES | NO | NO | NO |
| Create API keys | YES | YES | NO | NO | NO | NO | NO | NO |
| Generate individual API key | YES | YES | YES | YES | YES | YES | YES | YES |
| Manage Game Center | YES | YES | YES | NO | NO | NO | NO | NO |
| Manage App Clips | YES | YES | YES | NO | NO | NO | NO | NO |
| Manage in-app events | YES | YES | YES | NO | NO | YES | NO | NO |
| View app information (read-only) | YES | YES | YES | YES | YES | YES | YES | YES |
| Manage custom product pages | YES | YES | YES | NO | NO | YES | NO | NO |
| Manage phased releases | YES | YES | YES | NO | NO | NO | NO | NO |
| View builds and metadata | YES | YES | YES | YES | NO | NO | NO | NO |

## App Access Restrictions

- Admin and Finance roles always see all apps, cannot be restricted
- App Manager, Developer, Marketing, Customer Support, and Sales roles can be restricted to specific apps
- Users with access to Reports or Certificates, Identifiers & Profiles can also view all app information

## API Key Notes

- API keys are created in App Store Connect under Users and Access > Integrations
- Team keys apply across all apps - app access cannot be limited per key
- Individual keys inherit the user's role and app access restrictions
- Keys use ES256 algorithm to sign JWT tokens for authentication
- JWTs have a maximum duration of 20 minutes
- API rate limit is approximately 50 requests per minute with burst capacity
- Keys cannot be edited after creation - must revoke and create new
- Keys can only be downloaded once after creation

## ASC API Endpoint Categories

The API key role determines access to these endpoint groups:

- **Apps & Metadata** - requires Admin, App Manager, or Marketing role
- **Builds** - requires Admin, App Manager, or Developer role
- **TestFlight** - requires Admin, App Manager, or Developer role
- **App Review Submissions** - requires Admin or App Manager role
- **Customer Reviews** - requires Admin, App Manager, or Customer Support role
- **Sales & Financial Reports** - requires Admin, Finance, or Sales role
- **Analytics & Reports** - requires Admin, App Manager, Developer, or Marketing role
- **Users & Roles** - requires Admin role
- **Provisioning (Certificates, IDs, Profiles)** - requires Admin role (or optional access for App Manager/Developer)
- **In-App Purchases & Subscriptions** - requires Admin or App Manager role
- **Game Center** - requires Admin or App Manager role
- **Pricing & Availability** - requires Admin or App Manager role


# 09. Find Security Gaps

## Objective

Audit Thikana as an attacker would, while keeping the academic scope.

## Priority Areas

### Authentication

Check:

- Password hashing
- Login validation
- Email verification
- Session handling
- Logout
- Authentication expiration
- CSRF/Sanctum behavior

### Authorization

Test:

- Tenant accessing another tenant's data
- Landlord editing another landlord's property
- Landlord accessing another landlord's messages
- Tenant accessing admin endpoints
- Non-admin changing verification
- User manipulating another user's visit request
- User reading another user's notifications

### IDOR

For every resource ID, attempt access using another authenticated account.

### Injection

Check:

- SQL injection
- XSS
- Command injection
- Path traversal
- Unsafe HTML rendering

### File Uploads

Check:

- MIME validation
- Extension validation
- Size limits
- Number-of-image limit
- Malicious filenames
- Storage isolation
- Unauthorized deletion

### Secrets

Search:

- Source files
- Configuration
- Git history
- Logs
- Build output

for:

- API keys
- passwords
- database credentials
- tokens
- SMTP credentials

### Rate Limiting

Review expensive endpoints:

- Login
- Registration
- Password reset
- Contact requests
- Messaging
- Reports
- Property creation
- Image uploads

### Error Handling

Ensure production responses do not expose:

- SQL queries
- Stack traces
- File paths
- Secrets
- Internal implementation details

### Dependencies

Run the repository-supported dependency audit and review findings.

## Findings

Every finding must include:

- Severity
- File
- Line
- Description
- Exploit scenario
- Fix
- Verification
- Residual risk

Critical issues should be fixed before ordinary cleanup.

## Academic Security Boundary

Do not introduce unnecessary enterprise security infrastructure. Implement practical web security appropriate for the stated academic application.

## Source Basis
This document is project-specific and follows the approved Thikana proposal and the 15-prompt methodology in Vibe Coding Preparation.pdf. Where the proposal does not define an implementation detail, this document preserves the approved academic-scope decision rather than inventing production requirements.

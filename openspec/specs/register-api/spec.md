# register-api Specification

## Purpose
TBD - created by archiving change add-register-api. Update Purpose after archive.
## Requirements
### Requirement: Register endpoint contract
The system MUST provide `POST /api/auth/register` and return a consistent JSON contract `{ success, message, data }` on success.

#### Scenario: Register succeeds with valid payload
- **WHEN** client sends `{ "username": "alice", "password": "123456" }` to `POST /api/auth/register`
- **THEN** server returns HTTP 201 with `success=true` and user profile fields (`id`, `username`, `loginCount`, `failedCount`, `lastLoginAt`)

### Requirement: Username uniqueness validation
The system MUST reject duplicate usernames and return a clear conflict error.

#### Scenario: Duplicate username is rejected
- **WHEN** client submits a username that already exists
- **THEN** server returns HTTP 409 with `success=false` and message indicating username already exists

### Requirement: Input validation for register
The system MUST validate required fields and format before writing to database.

#### Scenario: Missing username
- **WHEN** client submits empty or missing `username`
- **THEN** server returns HTTP 400 with validation error message

#### Scenario: Missing password
- **WHEN** client submits empty or missing `password`
- **THEN** server returns HTTP 400 with validation error message

### Requirement: Layered responsibility remains clear
The system MUST keep route/controller/service/repository responsibilities separated for register flow.

#### Scenario: Register request path traceability
- **WHEN** a register request is processed
- **THEN** it follows `routes/auth.js -> authController.register -> authService.register -> userRepository` without bypassing layers

### Requirement: Register operation auditability
The system MUST record register result in audit storage to support troubleshooting.

#### Scenario: Audit record on register success
- **WHEN** registration succeeds
- **THEN** an audit record is written with status `SUCCESS` and username snapshot

#### Scenario: Audit record on register failure caused by business rule
- **WHEN** registration fails due to duplicate username
- **THEN** server preserves structured error response and keeps behavior traceable for operations


# Vinicius Group Managed QR Platform — PRD update

**Status:** Draft 1.1  
**Last updated:** 26 August 2026  
**Supersedes:** QR-specific wording in Draft 1.0

## Product model

The product is a managed QR platform. Employee vCards and profiles are supported destination types rather than a requirement for creating a QR code.

```text
Printed QR → Permanent QR URL → Assigned destination
                                  ├─ Employee vCard/profile
                                  ├─ Website
                                  ├─ Document
                                  └─ Other approved URL
```

The printed QR contains only the permanent managed URL. An administrator can change the assigned destination later without altering or reprinting the QR code.

## Managed QR requirements

| ID | Priority | Requirement |
|---|---|---|
| QR-01 | P0 | Admin can create a standalone QR code without creating an employee. |
| QR-02 | P0 | Every QR code has a unique, permanent redirect URL. |
| QR-03 | P0 | Admin can assign a QR code to an employee profile or vCard. |
| QR-04 | P0 | Admin can assign a QR code to another approved destination URL. |
| QR-05 | P0 | Admin can change the destination without changing or reprinting the QR code. |
| QR-06 | P0 | Admin can enable or disable a QR code independently of an employee. |
| QR-07 | P1 | Admin can name, search, categorize, and preview QR codes. |
| QR-08 | P1 | External destinations are validated to prevent unsafe redirects. |

## Replacement for CARD-03

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| CARD-03 | P0 | An administrator can create a standalone QR code and optionally assign it to an employee's public profile. The QR code must resolve through a permanent managed URL whose destination can be changed without altering the printed code. | A downloaded QR encodes `/q/{code}` rather than its assigned destination. Editing its destination leaves both `{code}` and the rendered QR payload unchanged. |

## Data-model amendment

A managed QR record contains:

- System fields: immutable unique code, ID, active status, creation time, and update time.
- Administration fields: name and optional category.
- Destination: destination type and either an employee reference or an approved HTTPS URL.

Employee and QR active states are independent. A disabled QR returns `404`. A QR assigned to an unavailable employee also fails without exposing employee data. QR deletion is excluded so issued URLs cannot be reassigned accidentally.

## Security amendment

- External redirects accept HTTPS only.
- URLs containing credentials, local hostnames, loopback addresses, link-local addresses, and common private IPv4 ranges are rejected.
- Production operators can set `QR_ALLOWED_HOSTS` to restrict external destinations to approved domains and their subdomains.
- Permanent QR codes cannot be modified at the database layer.

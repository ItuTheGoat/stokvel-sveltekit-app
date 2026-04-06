# Firestore Schema Requirements and Specification

This document defines the canonical Firestore and Firebase Storage data model for Luma's stokvel domain. It is a requirements-level spec for implementation, security rules, indexes, and client query behavior.

## 1. Core Entity Relationship

Luma uses a **flat collection strategy**. Instead of nesting members inside societies, it uses a `memberships` bridge collection.

This model is optimized for fast mobile dashboard reads (for example, "My Societies") while preserving clear tenant boundaries.

### High-Level Data Model

- **Users**: Global profile records.
- **Societies**: Tenant entity containing group metadata and rules.
- **Memberships**: Bridge records linking users to societies and defining role.
- **Contributions**: Payment ledger and proof-of-payment (POP) workflow records.

## 2. Collection Specifications

### `/users` (Collection)

- **Doc ID**: `{uid}` (from Firebase Auth)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `displayName` | string | yes | User's full name. |
| `phoneNumber` | string | yes | Verified South African mobile number. |
| `photoURL` | string | no | Profile picture URL. |
| `createdAt` | timestamp | yes | Account creation date. |

### `/societies` (Collection)

- **Doc ID**: auto-generated

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | string | yes | Name of the stokvel. |
| `inviteCode` | string | yes | Unique 8-char alphanumeric code (example: `LUMA-X8Y`). |
| `creatorId` | string | yes | UID of the user who created the society. |
| `totalPot` | number | yes | Aggregated sum of approved contributions. |
| `rules` | map | yes | Contribution settings and membership constraints. |

`rules` map contract:

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `amount` | number | yes | Expected contribution amount per interval. |
| `interval` | `'weekly' \| 'monthly' \| 'quarterly'` | yes | Contribution cadence. |
| `maxMembers` | number | yes | Maximum allowed member count. |
| `startDate` | timestamp | yes | Society start date. |

### `/memberships` (Collection)

- **Doc ID**: `{societyId}_{userId}` (compound ID; prevents duplicates)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `societyId` | string | yes | Reference to target society. |
| `userId` | string | yes | Reference to member user. |
| `role` | `'admin' \| 'member'` | yes | Role in the society. |
| `displayName` | string | yes | Denormalized name for fast member list rendering. |
| `joinedAt` | timestamp | yes | Date member joined the society. |

### `/contributions` (Collection)

- **Doc ID**: auto-generated

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `societyId` | string | yes | Target society ID. |
| `userId` | string | yes | Uploader UID. |
| `userName` | string | yes | Denormalized uploader name for admin queue. |
| `amount` | number | yes | Declared amount in the POP submission. |
| `popUrl` | string | yes | Firebase Storage URL to POP image/PDF. |
| `status` | `'pending' \| 'approved' \| 'rejected'` | yes | Contribution approval lifecycle state. |
| `submittedAt` | timestamp | yes | POP upload submission time. |

## 3. Storage Schema (Firebase Storage)

Proof of Payment files are sensitive and must be grouped by society for cleanup and access control boundaries.

- **Path pattern**: `societies/{societyId}/pops/{userId}_{timestamp}.jpg`
- **Required metadata**: include `contributionId` for reverse lookup to Firestore.

## 4. Key Access Patterns (MVP Queries)

### Dashboard view ("My Societies")

```ts
query(memberships, where('userId', '==', uid));
```

Returns all society memberships for the signed-in user in a single query.

### Admin approval queue

```ts
query(
  contributions,
  where('societyId', '==', sid),
  where('status', '==', 'pending')
);
```

Returns pending POP submissions for a society's admins.

### Join via invite code

```ts
query(societies, where('inviteCode', '==', inputCode));
```

Resolves the target society when a member enters an invite code.

## 5. Security Logic (Summary)

- **Creation**: Any authenticated user can create a society.
- **Joining**: A user may create their own membership only with a valid invite code.
- **Admin rights**: Society writes and contribution-status updates are restricted to users with membership role `admin` in that society.
- **Privacy**: Members can only read contributions where `contribution.societyId` belongs to one of their memberships.

## 6. Consistency and Governance Requirements

To keep behavior stable across app, rules, and infrastructure:

- If this schema changes, update this document in the same change set.
- Keep Firestore security rules aligned with the role and tenant constraints in this spec (`firestore.rules`).
- Keep required query performance aligned with index definitions (`firestore.indexes.json`).
- Keep POP path and metadata constraints aligned with Storage rules (`storage.rules`).

## 7. Non-Goals and Migration Note

This document is a schema target and governance contract. It does not, by itself, migrate existing collections or alter runtime behavior.

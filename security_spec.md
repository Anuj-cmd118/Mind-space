# Security Specification - Mindspace

## 1. Data Invariants
- Each user can only read and write their own data.
- MindItems must be associated with the user who created them.
- Timestamps must be numbers (JS milliseconds) or server timestamps (preferred, but currently UI uses numbers).
- DigitalImports must record valid sources.

## 2. The Dirty Dozen Payloads

### Payload 1: Unauthorized Read
Attempt to read `/users/victim_uid/mindItems/some_item` as `attacker_uid`.
**Action:** `GET`
**Expectation:** `PERMISSION_DENIED`

### Payload 2: Unauthorized Write (Spoofing Owner)
Attempt to create a MindItem in `/users/victim_uid/mindItems/` as `attacker_uid`.
**Action:** `CREATE`
**Expectation:** `PERMISSION_DENIED`

### Payload 3: Invalid Type (MindItem)
Attempt to create a MindItem with `type: 'malicious_type'`.
**Action:** `CREATE`
**Expectation:** `PERMISSION_DENIED`

### Payload 4: Invalid Impact (MindItem)
Attempt to create a MindItem with `impact: 'ultra_high'`.
**Action:** `CREATE`
**Expectation:** `PERMISSION_DENIED`

### Payload 5: Resource Poisoning (Tags)
Attempt to create a MindItem with 1,000 tags.
**Action:** `CREATE`
**Expectation:** `PERMISSION_DENIED`

### Payload 6: Field Injection
Attempt to add a field `isAdmin: true` to `/users/{userId}`.
**Action:** `UPDATE`
**Expectation:** `PERMISSION_DENIED`

### Payload 7: Timestamp Spoofing
Attempt to set `importedAt` to a future date string instead of a number.
**Action:** `CREATE`
**Expectation:** `PERMISSION_DENIED`

### Payload 8: Profile Tampering
Attempt to change `uid` field in user profile after creation.
**Action:** `UPDATE`
**Expectation:** `PERMISSION_DENIED`

### Payload 9: Blanket Query
Attempt to query all `mindItems` across all users.
**Action:** `LIST`
**Expectation:** `PERMISSION_DENIED`

### Payload 10: State Shortcut (DigitalImport)
Attempt to transition status from `processing` to `ready` with an invalid `dataCount` (string instead of number).
**Action:** `UPDATE`
**Expectation:** `PERMISSION_DENIED`

### Payload 11: Immense String Poisoning
Attempt to set `text` of a MindItem to a 10MB string.
**Action:** `CREATE`
**Expectation:** `PERMISSION_DENIED`

### Payload 12: Orphaned Data
Attempt to create a MindItem without a valid parent user document existing (if exists check is enabled).
**Action:** `CREATE`
**Expectation:** `PERMISSION_DENIED`

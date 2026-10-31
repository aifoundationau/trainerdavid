# Data Contracts & System Integrity Specification: Trainer David

## 1. Scope & Purpose
This document establishes the single source of truth and immutable data contract for **Trainer David** (Online Personal Training, Nutrition, Physiotherapy, Sports Coaching, Video Monetization, and Multi-Platform Social Publishing). It governs all data ingestion channels, storage boundaries, and payload contracts across UI forms, REST endpoints, Firestore collections, and AI agent interfaces.

*Regulatory Framework*: Compliant with the **Australian Privacy Principles (Privacy Act 1988 Cth)**, Sensitive Health Data standards, Stripe PCI DSS v4.0 tokenization, and strict typed API data contracts (`additionalProperties: false`).

---

## 2. Regulatory & Privacy Governance Framework
- **Australian Privacy Principles (Privacy Act 1988 Cth)**:
  - **APP 1**: Open and transparent management of personal information.
  - **APP 3**: Collection of solicited personal information strictly necessary for fitness programming.
  - **APP 6**: Use and disclosure restricted exclusively to coaching operations and user-authorized interactions.
  - **APP 11**: Rigorous security, TLS 1.3 in-transit, and AES-256 rest encryption.
- **Sensitive Health Data (Privacy Act s 6(1) & APP 6)**: Musculoskeletal injury histories, rehabilitation notes, and physical limitations are classified as **Sensitive/Health Data** requiring explicit user opt-in and restricted access.
- **Financial Processing**: Card payments are processed via Stripe-hosted 256-bit encrypted Checkout. Zero raw PAN or CVV touches internal application servers.

---

## 3. Universal Token Economy & Pricing Contracts (`tokens`)
*Governed by Universal Token Architecture across AI Foundation applications (`pt`, `aifoundation`).*

### 3.1 Token Pricing Baseline & SuperAdmin Authority
* **Storage Path**: Firestore `system_settings/aifoundation_service_prices` and local cached fallback `data/service-prices.json`.
* **Default Baseline**: USD $1.00 per token. SuperAdmin can update the baseline price to any valid positive integer/float with 2 decimal places.
* **Country-Specific Overrides (Geolocated)**:
  - SuperAdmin configures country allocations: `USD $1 = N Tokens` (e.g. Cambodia: 1 USD = 10 Tokens; Thailand: 1 USD = 5 Tokens).
  - Schema (`countryRates` map):
    ```json
    {
      "type": "object",
      "patternProperties": {
        "^[A-Z]{2}$": {
          "type": "object",
          "properties": {
            "country": { "type": "string" },
            "code": { "type": "string", "pattern": "^[A-Z]{2}$" },
            "tokensPerUsd": { "type": "integer", "minimum": 1, "maximum": 1000 }
          },
          "required": ["country", "code", "tokensPerUsd"],
          "additionalProperties": false
        }
      }
    }
    ```
* **Australia & New Zealand Conversion**:
  - Automatically converts USD to AUD for visitors geolocated in Australia (`AU`) and New Zealand (`NZ`) via live exchange rates.
* **System Toggles (`toggles`)**:
  - `isTokenSystemEnabled` (boolean): When `false` (OFF), no tokens are deducted anywhere across the platform and all creator contract/contact details (email, phone, contract terms) are visible openly to everyone.
  - `isAudEnabled` (boolean): Shown strictly to visitors located in Australia and New Zealand.
  - `isUsdEnabled` (boolean): Shown to all other countries outside Australia and New Zealand.
  - Currencies are independently toggleable.

### 3.2 Universal Balance & Double-Entry Ledger (`token_ledger`)
* **Balance Storage**: Stored strictly at `users/{uid}.token_balance` as a non-negative integer (`Math.round`, zero decimals).
* **Ledger Entries**: Committed atomically in root collection `token_ledger/{entryId}`:
  - Purchases: `purchase_{sessionId}`
  - Spends: `spend_pt_{reference}`
  - Administrative Grants: `grant_{requestId}`
  - Messaging Fees: `msg_fee_{messageId}`
* **Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "uid": { "type": "string" },
      "amount": { "type": "integer" },
      "balanceAfter": { "type": "integer", "minimum": 0 },
      "type": { "type": "string", "enum": ["purchase", "spend", "grant", "message_fee", "creator_credit"] },
      "app": { "type": "string" },
      "reference": { "type": "string" },
      "description": { "type": "string" },
      "timestamp": { "type": "string", "format": "date-time" }
    },
    "required": ["uid", "amount", "balanceAfter", "type", "timestamp"],
    "additionalProperties": false
  }
  ```

---

## 4. Video Workout Publishing & Lifetime Access (`pt_videos`)

### 4.1 Video Document Schema (`pt_videos/{videoId}`)
* **YouTube Strictness**: Only YouTube URLs are authorized for workout tutorial publishing (`youtu.be`, `youtube.com/watch`, `shorts/`). Unlisted YouTube visibility is strictly recommended.
* **Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "id": { "type": "string" },
      "youtubeId": { "type": "string", "pattern": "^[a-zA-Z0-9_-]{11}$" },
      "title": { "type": "string", "minLength": 3, "maxLength": 200 },
      "description": { "type": "string", "maxLength": 2000 },
      "category": { "type": "string" },
      "muscleGroup": { "type": "string" },
      "equipment": { "type": "string" },
      "difficulty": { "type": "string", "enum": ["Beginner Friendly", "Intermediate", "Advanced Masterclass"] },
      "tokenCost": { "type": "integer", "minimum": 0, "maximum": 100 },
      "messageTokenCost": { "type": "integer", "minimum": 0, "maximum": 100 },
      "isFree": { "type": "boolean" },
      "creatorUid": { "type": "string" },
      "author": { "type": "string" },
      "thumbnailUrl": { "type": "string", "format": "uri" },
      "createdAt": { "type": "string", "format": "date-time" }
    },
    "required": ["id", "youtubeId", "title", "tokenCost", "creatorUid", "createdAt"],
    "additionalProperties": false
  }
  ```

### 4.2 Lifetime Watch Invariant & Free View Rule
* If `tokenCost === 0` or `isTokenSystemEnabled === false`: Video is tagged as `Free to Watch` and streams immediately without token deduction (`accessType: 'free_view'`).
* If `tokenCost > 0`: Permanent watch for life access (`accessType: 'lifetime'`). Purchase records are stored in `video_unlocks` and appended to `users/{uid}.unlocked_videos`.

---

## 5. Multi-Platform Social Media Publishing (`social_posts`)

### 5.1 Social Post Document Schema (`social_posts/{postId}`)
* **Supported Platforms**: Instagram, Facebook, TikTok, YouTube Shorts, X / Twitter, Threads, LinkedIn, Custom Web Link.
* **Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "id": { "type": "string" },
      "platform": { "type": "string", "enum": ["instagram", "facebook", "tiktok", "youtube_shorts", "twitter", "threads", "linkedin", "custom"] },
      "postUrl": { "type": "string", "format": "uri" },
      "title": { "type": "string", "minLength": 3, "maxLength": 200 },
      "caption": { "type": "string", "maxLength": 3000 },
      "category": { "type": "string" },
      "tokenCost": { "type": "integer", "minimum": 0, "maximum": 100 },
      "messageTokenCost": { "type": "integer", "minimum": 0, "maximum": 100 },
      "isFree": { "type": "boolean" },
      "creatorUid": { "type": "string" },
      "author": { "type": "string" },
      "thumbnailUrl": { "type": "string" },
      "createdAt": { "type": "string", "format": "date-time" }
    },
    "required": ["id", "platform", "postUrl", "title", "tokenCost", "creatorUid", "createdAt"],
    "additionalProperties": false
  }
  ```

### 5.2 Social Unlock & Confirm Delete Rule
* If `tokenCost === 0` or `isTokenSystemEnabled === false`: Immediate free view (`accessType: 'free_view'`).
* If `tokenCost > 0`: Deducts exact integer tokens from buyer and credits creator under 50/50 revenue split model.
* **Confirm Delete Invariant**: Deleting a published post or video requires a two-step confirm delete action, authorized exclusively for the item creator or SuperAdmin.

---

## 6. Direct Messaging Economy & Creator Rates (`direct_messages`)

### 6.1 Precedence for Message Token Fee
1. **SuperAdmin Exemption**: SuperAdmin always spends **0 tokens** to message any user at any time.
2. **Item-Level Fee**: `video.messageTokenCost` or `post.messageTokenCost` (if initiated from a specific item).
3. **Creator Profile Fee**: `users/{uid}.messageTokenCost` (configured by creator in Admin Hub).
4. **Platform Default**: 1 token.
5. If resolved fee is `0` or token system is OFF: Message is delivered with `cost: 0` without debiting sender.

### 6.2 Message Document Schema (`direct_messages/{messageId}`)
```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "threadId": { "type": "string" },
    "senderUid": { "type": "string" },
    "recipientUid": { "type": "string" },
    "senderName": { "type": "string" },
    "senderEmail": { "type": "string" },
    "recipientName": { "type": "string" },
    "message": { "type": "string", "minLength": 1, "maxLength": 2000 },
    "tokenCost": { "type": "integer", "minimum": 0 },
    "sourceItem": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "type": { "type": "string", "enum": ["video", "social"] },
        "title": { "type": "string" }
      },
      "additionalProperties": false
    },
    "createdAt": { "type": "string", "format": "date-time" }
  },
  "required": ["id", "threadId", "senderUid", "recipientUid", "message", "tokenCost", "createdAt"],
  "additionalProperties": false
}
```

---

## 7. Roles, Permissions & SuperAdmin Rubric Matrix (`rbac`)

* **Platform Roles**: `superadmin`, `mainadmin`, `admin`, `trainer`, `doctor`, `accountant`, `supporter`.
* **SuperAdmin Authority**: Only SuperAdmin (`isUserSuperAdmin`) can toggle boolean permission dots in the Roles & Permissions Rubric.
* **MainAdmin Guard**: MainAdmin can manage standard operational roles but cannot assign or modify `superadmin` or `mainadmin` accounts.
* **View As Role Invariant**: SuperAdmin can preview the website from any role perspective (e.g. Supporter, Trainer) without mutating underlying credentials.

---

## 8. Client Intake & Health Consultations (`consultations`)

| Field Name | Type | Channel | Classification | Validation Rules & Invariants | Target Storage |
|---|---|---|---|---|---|
| `fullName` | `string` | UI Form | PII | 2–100 chars, sanitized. | `consultations.fullName` |
| `email` | `string` | UI Form | PII | RFC 5322 regex, lowercase. | `consultations.email` |
| `phone` | `string` | UI Form | PII | E.164 or AU mobile format `^(\+61\|0)[4-5]\d{8}$`. | `consultations.phone` |
| `serviceType` | `enum` | UI Select | Operational | Valid service offering. | `consultations.serviceType` |
| `fitnessGoal` | `enum` | UI Select | Operational | Valid physique or health target. | `consultations.fitnessGoal` |
| `injuryNotes` | `string` | UI Textarea | **Sensitive Health** | Min 0, Max 2,000 chars. AES-256 encrypted at rest. | `consultations.injuryNotes` |

---

## 9. AI Agent RAG Inference Protocol
* **Grounding Authority**: AI tools and chat models ground responses strictly on `videoLibrary` (31+ video tutorials) and verified platform contracts.
* **Token Integer Invariant**: All token operations must use `Math.round` / integers with zero decimals.
* **Medical Disclaimer**: Acute symptoms trigger an immediate red-flag prompt advising professional clinical consultation.

---

## 10. Regional Suburb, Geocoding & GeoTime Widget Contracts (`geo_time_settings`)

### 10.1 Regional Settings Contract
* **Storage Path**: Browser `localStorage` key `trainer_david_geo_time_settings`, broadcasted via `geoTimeSettingsUpdated` CustomEvent.
* **Schema**:
```json
{
  "type": "object",
  "properties": {
    "suburb": { "type": "string", "minLength": 1, "maxLength": 100 },
    "state": { "type": "string", "maxLength": 10 },
    "country": { "type": "string", "pattern": "^[A-Z]{2}$" },
    "lat": { "type": "number", "minimum": -90, "maximum": 90 },
    "lon": { "type": "number", "minimum": -180, "maximum": 180 },
    "dateFormat": { "type": "string", "enum": ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] },
    "timeFormat": { "type": "string", "enum": ["12h", "24h"] },
    "timezone": { "type": "string" },
    "tempUnit": { "type": "string", "enum": ["C", "F"] }
  },
  "required": ["suburb", "lat", "lon", "timezone"],
  "additionalProperties": false
}
```

### 10.2 Suburb Autocomplete & Detection Invariants
1. **Interactive Suburb Pick-up**: Typing into `Closest Suburb & State` automatically queries curated catalog (`POPULAR_SUBURBS`) with instant zero-latency match, with Open-Meteo Geocoding API global fallback.
2. **State & Timezone Auto-population**: Selecting or matching a suburb automatically resolves and binds the correct state (e.g. QLD, NSW, VIC), geographical coordinates (`lat`, `lon`), and daylight-savings-aware timezone (e.g. `Australia/Brisbane` UTC+10 for Robina, `Australia/Sydney` UTC+11 for Summer Hill).
3. **No-Scrollbar Modal Invariant**: The regional configuration modal maintains fluid responsive dimensions without modal scrollbars (`overflow: hidden`).


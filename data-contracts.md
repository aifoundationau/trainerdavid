# Data Contracts & System Integrity Specification: Trainer David

## 1. Scope & Purpose
This document establishes the single source of truth and immutable data contract for **Trainer David** (Online Personal Training, Nutrition, Physiotherapy, and Sports Coaching platform). It governs all data ingestion channels across UI forms, REST endpoints, and AI agent extraction interfaces.

*Note: Stripe payment processing is deferred per project requirements. The application operates in Free Launch Preview mode with FitToken allocation for booking consultations.*

---

## 2. Regulatory & Privacy Governance Framework
- **Australian Privacy Principles (Privacy Act 1988 Cth)**: Strict adherence to APP 1 (open and transparent management of personal information), APP 3 (collection of solicited personal information), APP 6 (use or disclosure of personal information), and APP 11 (security of personal information).
- **Sensitive Health Data (APP 6 & Privacy Act s 6(1))**: Injury histories, rehabilitation notes, and physical limitations are classified as **Sensitive/Health Data** requiring explicit user opt-in and restricted access.
- **Financial Processing**: Card processing is currently omitted. When integrated in a future milestone, tokenized gateways will be audited under PCI DSS v4.0.

---

## 3. Ingestion Interfaces & Schema Matrix

### Entity A: Lead & Consultation Intake (`Booking & Consultation`)
*Triggered via UI Consultation Modal, `POST /api/v1/consultations`, or AI Agent Slot Extraction.*

| Field Name | Type | Channel | Classification | Regulatory Scope | Validation Rules & Invariants | Target Storage & Retention |
|---|---|---|---|---|---|---|
| `full_name` | `string` | UI Form / AI Slot | PII | APP 3, GDPR Art 6 | Length: 2–100 chars; Sanitized: trim, HTML escape, strip control chars. Required. | `consultations.client_name` (VARCHAR 100), 24-month retention |
| `email` | `string` | UI Form / AI Slot | PII | APP 3, GDPR Art 6 | RFC 5322 regex; Normalized: lowercase, trim; Max 255 chars. Required. | `consultations.email` (VARCHAR 255, indexed), 24-month retention |
| `phone` | `string` | UI Form / AI Slot | PII | APP 3 | E.164 international format or AU mobile regex `^(\+61\|0)[4-5]\d{8}$`. Required. | `consultations.phone` (VARCHAR 30), 24-month retention |
| `service_type` | `enum` | UI Select / AI Slot | Internal | Operational | Values: `['1-on-1 Online Personal Training', 'Custom Nutrition & Macro Blueprint', 'Sports Performance Coaching', 'Physiotherapy & Rehab Assessment', 'Video Form Analysis']`. Required. | `consultations.service_type` (VARCHAR 50) |
| `fitness_goal` | `enum` | UI Select / AI Slot | Internal | Operational | Values: `['Muscle Hypertrophy & Strength', 'Fat Loss & Conditioning', 'Injury Rehab & Joint Mobility', 'Sports Speed & Power', 'General Health']`. | `consultations.fitness_goal` (VARCHAR 50) |
| `injury_history` | `string` | UI Textarea / AI Slot | **Sensitive / Health** | **Privacy Act s 6(1)** (Health Information), GDPR Art 9 | Min 0, Max 2,000 chars. Sanitized: HTML stripped. Strict AES-256 encryption at rest. | `consultations.injury_notes` (TEXT, encrypted at rest), delete on client request or 7 yrs clinical guidance |
| `payment_preference` | `enum` | UI Selector | Internal | Operational | Values: `['Tokens', 'Free Intake']`. Default: `'Tokens'`. | `consultations.payment_preference` (VARCHAR 20) |

---

### Entity B: Token Ledger & Wallets (`Token Store`)
*Triggered via Token Store Modal and In-App Redemption.*

| Field Name | Type | Channel | Classification | Validation Rules & Invariants | Target Storage & Retention |
|---|---|---|---|---|---|
| `user_id` | `uuid` | Session / JWT | Internal | UUIDv4 format. Required. | `token_ledger.user_id` (FK to `users.id`) |
| `token_balance` | `integer` | System Engine | Internal | Min: 0 (non-negative invariant), Max: 100,000. Mutated only via atomic DB transaction with row locking. | `user_wallets.balance` (INTEGER NOT NULL DEFAULT 15) |
| `package_id` | `enum` | UI | Internal | Values: `['starter', 'pro', 'elite']`. | `token_orders.package_id` (VARCHAR 30) |
| `access_tier` | `enum` | System | Internal | Value: `'free_launch_pass'`. Grants 100% video preview access. | `users.access_tier` (VARCHAR 30) |

---

### Entity C: Video Workout Catalog (`Workout Catalog`)
*Read-only content ingested via Trainer David Content Management / YouTube metadata sync.*

| Field Name | Type | Channel | Classification | Validation Rules & Invariants | Target Storage |
|---|---|---|---|---|---|
| `id` | `string` | Seed / CMS | Public | YouTube 11-char alphanumeric ID `^[a-zA-Z0-9_-]{11}$`. Unique. | `videos.youtube_id` (VARCHAR 11 UNIQUE) |
| `title` | `string` | Seed / CMS | Public | Length: 5–200 chars. Sanitized. | `videos.title` (VARCHAR 200) |
| `short_description` | `string` | Seed / CMS | Public | Length: 20–500 chars. Concise biomechanical overview. | `videos.short_description` (TEXT) |
| `category` | `enum` | Seed / CMS | Public | `['Chest & Shoulders', 'Back & Posture', 'Arms (Biceps & Triceps)', 'Legs & Lower Body', 'Core & Abs']`. | `videos.category` (VARCHAR 50) |
| `muscle_group` | `string` | Seed / CMS | Public | Primary anatomical targets. Length: 3–150 chars. | `videos.muscle_group` (VARCHAR 150) |
| `equipment` | `string` | Seed / CMS | Public | Gym/home equipment requirements. Length: 2–100 chars. | `videos.equipment` (VARCHAR 100) |
| `difficulty` | `enum` | Seed / CMS | Public | Values: `['Beginner Friendly', 'Intermediate', 'Advanced Masterclass']`. | `videos.difficulty` (VARCHAR 30) |
| `token_cost` | `integer` | Seed / CMS | Internal | Value >= 0. Default: `5` (Bypassed during Free Launch Phase). | `videos.token_cost` (INTEGER DEFAULT 5) |

---

## 4. AI Agent Slot Extraction & Enforcement Protocol
When conversational AI or chat tools interact with clients:
1. **Strict Type Coercion**: Any extraction slot (e.g., telephone number, service requested) that fails validation must trigger a graceful reprompt.
2. **Forbidden Hallucinations**: The AI must not invent services, token costs, or pricing discounts outside of `services.js` and `data-contracts.md`.
3. **Medical Disclaimer Gate**: If a user indicates severe acute injury (e.g. sharp radiating lumbar pain, acute joint dislocation), the agent must immediately output a safety warning urging direct in-person medical evaluation before proceeding with exercise prescriptions.

---

## 5. Storage Encryption & Data Lifecycle Policy
1. **Rest & Transit Encryption**: TLS 1.3 in transit; AES-256 at rest for all databases and backup snapshots.
2. **Right to Erasure (Privacy Act / GDPR)**: Users may request complete erasure of their consultation and health notes at any time. Soft-deleted records are permanently purged after 30 days.

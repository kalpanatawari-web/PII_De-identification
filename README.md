PII De-identification Service
---
A lightweight Node.js and TypeScript REST API built with Express to detect and mask Personally Identifiable Information (PII) and sensitive financial/identifying records in unstructured text.

Features
---
Entity Masking: Automatically replaces sensitive strings with typed tokens like `[EMAIL]`, `[CREDIT_CARD]`, etc.
Deep Validation:
Credit Cards: Validated using the Luhn algorithm (Mod 10) for 13–19 digit lengths.
IPv4 Addresses: Validates octets to ensure numerical values stay strictly between `0` and `255`.
Social Security Numbers (SSN): Filters out invalid area numbers (`000`, `666`, `900–999`) and zeroed group/serial segments.
Safety Limits: Enforces a payload cap of 5,000 characters to prevent ReDoS (Regular Expression Denial of Service).

Supported Entities
---
Entity Type	Token	Detection Pattern / Validation Criteria
Email	`[EMAIL]`	Standard RFC-compliant email formats
Phone Number	`[PHONE]`	US/NANP phone formats (with/without country code & separators)
SSN	`[SSN]`	`AAA-GG-SSSS` format (excludes invalid US SSA prefixes and all-zero groups)
Date of Birth	`[DOB]`	`MM/DD/YYYY` or `MM-DD-YYYY` formats (1900–2099)
Credit Card	`[CREDIT_CARD]`	13–19 digits (with or without spaces/dashes), verified via Luhn check
IP Address	`[IP_ADDRESS]`	Standard IPv4 octet notation (`0.0.0.0` to `255.255.255.255`)

Project Structure
---
```text
├── src/
│   ├── controller/
│   │   └── deidentify.controller.ts
│   ├── router/
│   │   └── deidentify.routes.ts
│   ├── services/
│   │   └── deidentify.service.ts
│   ├── types/
│   │   └── deidentify.types.ts
│   └── server.ts
├── test/
│   ├── controller/
│   │   └── deidentify.controller.test.ts
│   ├── services/
│   │   └── deidentify.service.test.ts
├── package.json
├── tsconfig.json
└── README.md
```
---
Getting Started
Prerequisites
Node.js (v18.x or later)
`npm` or `pnpm` / `yarn`
Installation
Clone repository:
```bash
   git clone <repository-url>
   cd <project-folder>
   ```
Install dependencies:
```bash
   npm install
   ```

Start development server:
```bash
   npm run dev
   And to test
   npm run test
   ```
The service will listen on `http://localhost:3000`.
---
API Documentation
De-identify Text
Scans arbitrary text, validates candidates, and returns sanitized text along with an array of identified entity types.
URL: `/api/v1/deidentify`
Method: `POST`
Headers: `Content-Type: application/json`
Request Body
```json
{
  "text": "Contact John at john.doe@example.com or call 415-555-2671. His server is on 192.168.1.1."
}
```
Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "originalText": "Contact John at john.doe@example.com or call 415-555-2671. His server is on 192.168.1.1.",
    "deidentifiedText": "Contact John at [EMAIL] or call [PHONE]. His server is on [IP_ADDRESS].",
    "detectedEntities": [
      "EMAIL",
      "PHONE",
      "IP_ADDRESS"
    ]
  }
}
```
---
Error Handling
HTTP Code	Scenario	Sample Response
`400 Bad Request`	Missing text, empty string, or invalid type	`{"message": "Text is required and must be a non-empty string"}`
`413 Payload Too Large`	Text exceeds 5,000 characters	`{"success": false, "message": "Payload too large. Maximum supported text length is 5000 characters."}`
`500 Internal Server Error`	Uncaught runtime error	`{"success": false, "message": "Internal server error"}`

Quick cURL Test
---
```bash
curl -X POST http://localhost:3000/api/v1/deidentify \
  -H "Content-Type: application/json" \
  -d '{"text": "My SSN is 123-45-6789 and my email is test@domain.org"}'
```

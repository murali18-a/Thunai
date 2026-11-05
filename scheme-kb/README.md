# Scheme Knowledge Base — Schema Guide

This guide explains how to add or edit a scheme in Thunai's knowledge base.
No coding experience is required — the scheme data is a JSON file that follows
a fixed structure.

## Where is the data?

```
backend/scripts/schemes.json    — main KB file (150 schemes)
backend/scripts/offices.json    — CSC/VAO/Taluk offices (60 offices)
```

## Scheme structure

Every scheme is a JSON object with these fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `scheme_id` | string | ✅ | Unique ID like `tn_widow_pension` or `central_pmjay` |
| `name_ta` | string | ✅ | Scheme name in Tamil |
| `name_en` | string | ✅ | Scheme name in English |
| `level` | string | ✅ | `"state"` or `"central"` |
| `state` | string | ✅ for state | `"TN"` for Tamil Nadu state schemes |
| `category` | string | ✅ | One of: `pension`, `insurance`, `subsidy`, `loan`, `grant`, `education`, `housing`, `maternity`, `employment`, `agriculture`, `fisheries`, `handloom`, `welfare`, `health` |
| `ministry` | string | ✅ | Issuing ministry or department |
| `benefit` | object | ✅ | See below |
| `eligibility_rule` | object | ✅ | JsonLogic rule (see below) |
| `eligibility_plain_ta` | string | ✅ | Tamil text explaining eligibility in simple words |
| `documents_required` | array | ✅ | List of document names in Tamil |
| `where_to_apply` | string | ✅ | Where to submit the application |
| `how_to_apply_steps` | array | ✅ | Step-by-step instructions in Tamil |
| `helpline` | string | ✅ | Phone number for enquiries |
| `source_url` | string | ✅ | Official `.gov.in` or `.nic.in` URL |
| `last_verified_date` | string | ✅ | Date in `YYYY-MM-DD` format |
| `active` | boolean | ✅ | `true` if verified, `false` if uncertain |
| `tags` | array | ❌ | Search keywords |
| `priority_weight` | number | ❌ | Higher = shown first (default: 1) |

## Benefit object

```json
{
  "kind": "monthly",
  "amount": 1000,
  "description_ta": "மாதம் ₹1000 ஓய்வூதியம்"
}
```

`kind` can be: `monthly`, `onetime`, `insurance_cover`, `subsidy`, `loan`, `service`, `education`

## Eligibility rule (JsonLogic)

JsonLogic is a simple way to express "if this AND that" rules. Common patterns:

### Age check
```json
{ ">=": [{ "var": "age" }, 60] }
```

### Gender check
```json
{ "==": [{ "var": "gender" }, "F"] }
```

### Income check
```json
{ "<=": [{ "var": "annual_income" }, 72000] }
```

### Combine with AND
```json
{
  "and": [
    { ">=": [{ "var": "age" }, 60] },
    { "==": [{ "var": "gender" }, "F"] },
    { "<=": [{ "var": "annual_income" }, 72000] }
  ]
}
```

### Social category check
```json
{ "in": [{ "var": "social_category" }, ["SC", "ST"]] }
```

### Available profile fields
| Field | Type | Values |
|---|---|---|
| `age` | number | 0–120 |
| `gender` | string | `"M"`, `"F"`, `"O"` |
| `marital_status` | string | `"married"`, `"unmarried"`, `"widow"`, `"divorced"` |
| `district` | string | Any TN district name |
| `occupation` | string | `"farmer"`, `"labourer"`, `"student"`, `"housewife"`, `"fisher"`, `"weaver"`, `"driver"`, `"self_employed"`, `"unemployed"` |
| `annual_income` | number | In rupees |
| `social_category` | string | `"SC"`, `"ST"`, `"OBC"`, `"MBC"`, `"General"` |
| `is_disabled` | boolean | |
| `is_pregnant` | boolean | |
| `is_bpl` | boolean | Below Poverty Line |
| `land_hectares` | number | Agricultural land |

## Validation

After editing, run the validator:
```bash
cd backend
node scripts/validate-kb.js
```

It will catch: missing fields, duplicate IDs, malformed rules, invalid URLs.

## Adding a new scheme — step by step

1. Open `backend/scripts/schemes.json` in any text editor
2. Copy an existing scheme that's similar to yours
3. Change the `scheme_id` (must be unique)
4. Fill in all required fields
5. Write the eligibility rule using the patterns above
6. Save the file
7. Run `node scripts/validate-kb.js` to check for errors
8. Test with `npm test` to make sure all tests pass

## Tips for Tamil content

- Use simple, everyday Tamil — avoid Sanskrit or formal register
- Write as if explaining to an elderly person in a village
- Keep sentences short
- Use Tamil numerals or Arabic numerals — both work
- For government department names, use the commonly known Tamil name


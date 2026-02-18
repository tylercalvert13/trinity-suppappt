

## CRM Quote Webhook Edge Function

Create a backend function that receives contact data from GoHighLevel, quotes them using the CSG API, and POSTs the results back to a GHL webhook URL.

### How It Works

1. Your CRM sends a POST request with contact data (name, age, plan, zip, etc.)
2. The function authenticates with the CSG API and fetches quotes
3. It calculates savings based on their current premium
4. It POSTs the results (quoted rate, carrier, monthly/annual savings) back to a webhook URL in your CRM

Since tobacco status won't be included, it will default to "no" (non-tobacco rates).

### What You'll Need

- A **GHL webhook URL** where the quoted results should be sent back. You'll be prompted to enter this as a secret.

### Incoming Payload (from your CRM)

```text
{
  "id": "contact_id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-123-4567",
  "age": "65",
  "currentPremium": "250",
  "currentType": "Plan G",
  "zip": "33009",
  "gender": "Male",
  "spouse": "Yes"
}
```

### Data Sent Back to Your CRM

```text
POST to your webhook URL with:
{
  "id": "contact_id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-123-4567",
  "quotedRate": 145.50,
  "quotedCarrier": "Medico",
  "amBestRating": "A-",
  "monthlySavings": 104.50,
  "annualSavings": 1254.00,
  "savingsPercent": 41.8,
  "plan": "Plan G",
  "status": "quoted"   // or "no_savings" if savings < 5%, or "no_quotes" if no quotes found
}
```

If the person can't be quoted or savings are under 5%, it still sends back the contact info with a status explaining why.

### Technical Details

**New file**: `supabase/functions/crm-quote-webhook/index.ts`
- Reuses the same CSG API token caching logic from the existing quote function (singleton pattern with 5-minute refresh buffer)
- Filters to Aflac and Medico carriers only
- Applies household discount logic based on spouse status
- Defaults tobacco to "no"
- Maps plan names (Plan G, Plan N, Plan F, etc.) to API codes

**Config update**: `supabase/config.toml` -- register the new function with `verify_jwt = false`

**New secret**: `GHL_WEBHOOK_URL_CRM_QUOTE` -- the webhook URL in your CRM where results are sent back

### Files Changed

- **New**: `supabase/functions/crm-quote-webhook/index.ts`
- **Edit**: `supabase/config.toml`


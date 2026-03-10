

# Add Joey Jimenez to Agent Round-Robin

## Change in `src/pages/MedicareSupplementAppointment.tsx`

Add a new entry to the `AGENTS` array (line 49, before the closing bracket):

```typescript
{ name: 'Joey Jimenez', firstName: 'Joey', phone: '(908) 829-6944', telLink: 'tel:+19088296944', ghlUserId: '6nCN3NDWyUugUCGz22hD', states: [] },
```

No database changes needed — the `get_next_agent_index` RPC already uses `agent_count` dynamically from `AGENTS.length`, so it will automatically distribute across 7 agents.


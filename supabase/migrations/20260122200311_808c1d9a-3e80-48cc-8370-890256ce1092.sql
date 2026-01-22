-- Delete funnel events for John Graves session
DELETE FROM funnel_events 
WHERE session_id = 'ff067ff2-4f6c-4918-8f0c-3adc9d485aaf';

-- Delete funnel session for John Graves
DELETE FROM funnel_sessions 
WHERE session_id = 'ff067ff2-4f6c-4918-8f0c-3adc9d485aaf';

-- Delete John Graves submission
DELETE FROM submissions 
WHERE id = '9f5ed8e4-3a65-440f-8266-adf931489f8a';

-- Delete orphaned disqualified submission (session already removed)
DELETE FROM submissions 
WHERE id = 'a3b7165a-fef9-4315-bde0-b982d3b85b35';
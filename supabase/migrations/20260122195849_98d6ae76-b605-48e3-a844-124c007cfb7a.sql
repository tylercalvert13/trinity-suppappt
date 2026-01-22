-- Delete funnel events for test sessions
DELETE FROM funnel_events 
WHERE session_id IN (
  '37f69a7d-f528-453e-b215-c71ae64c09c0',
  '3e8d28b7-74ee-4c45-88c0-32437769bf48',
  'f1ed18da-15d7-415d-971a-b51799a6e40b',
  '7d9ab8fa-fef6-4d08-9268-c47267c73d83',
  'fa4ea4ca-5c95-4dce-9c36-eb0b9cc15455',
  '20c18e7c-ee7b-4227-a50b-812e278d306e',
  '65886ccb-34ac-4578-9712-731fdb045282',
  '1c99d751-727c-40ed-abc3-c687e8679e3b',
  'a4301d5b-ca86-4ef2-948b-8945faa213b5',
  '7ea6647c-b7db-4d4a-ab5c-a2fe8e5c441c'
);

-- Delete funnel sessions for test users
DELETE FROM funnel_sessions 
WHERE session_id IN (
  '37f69a7d-f528-453e-b215-c71ae64c09c0',
  '3e8d28b7-74ee-4c45-88c0-32437769bf48',
  'f1ed18da-15d7-415d-971a-b51799a6e40b',
  '7d9ab8fa-fef6-4d08-9268-c47267c73d83',
  'fa4ea4ca-5c95-4dce-9c36-eb0b9cc15455',
  '20c18e7c-ee7b-4227-a50b-812e278d306e',
  '65886ccb-34ac-4578-9712-731fdb045282',
  '1c99d751-727c-40ed-abc3-c687e8679e3b',
  'a4301d5b-ca86-4ef2-948b-8945faa213b5',
  '7ea6647c-b7db-4d4a-ab5c-a2fe8e5c441c'
);

-- Delete submissions for Tyler Calvert and Josh Foret
DELETE FROM submissions 
WHERE (LOWER(first_name) = 'tyler' AND LOWER(last_name) = 'calvert')
   OR (LOWER(first_name) = 'josh' AND LOWER(last_name) = 'foret');
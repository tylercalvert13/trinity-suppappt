// Define internal team members to exclude from analytics
export const INTERNAL_TEAM_MEMBERS = [
  { firstName: 'tyler', lastName: 'calvert' },
  { firstName: 'josh', lastName: 'foret' },
];

// Check if a submission is from an internal team member
export const isInternalTeamMember = (submission: {
  first_name?: string | null;
  last_name?: string | null;
}): boolean => {
  const firstName = submission.first_name?.toLowerCase().trim();
  const lastName = submission.last_name?.toLowerCase().trim();
  
  return INTERNAL_TEAM_MEMBERS.some(
    member => member.firstName === firstName && member.lastName === lastName
  );
};

// Filter submissions to exclude internal team members
export const filterInternalSubmissions = <T extends { first_name?: string | null; last_name?: string | null }>(
  submissions: T[]
): T[] => {
  return submissions.filter(s => !isInternalTeamMember(s));
};

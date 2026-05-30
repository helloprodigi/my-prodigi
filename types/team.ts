export interface CreateTeamInput {
  teamName: string;
  memberCount: number;
  competitionId: string;
  competitionLink: string;
  competitionCategory: string;
  requiredSkills: string[];
}

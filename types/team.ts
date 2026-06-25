export interface CreateTeamInput {
  teamName: string;
  memberCount: number;
  competitionId: string;
  competitionLink: string;
  competitionCategory: string;
  requiredSkills: string[];
}

export type TeamMemberStatus = "WAITING" | "APPROVED";

export interface DashboardTeamMember {
  id: string;
  no: number | null;
  fullName: string;
  skills: string;
  status: TeamMemberStatus;
  whatsappNumber: string;
  cvUrl: string | null;
  userId: string;
  inviteToken?: string | null;
}

export interface DashboardTeamCard {
  id: string;
  teamName: string;
  competitionTitle: string;
  createdDate: string;
  createdAt: string;
  category: string;
  organizer: string;
  memberNames: string[];
  membersData?: { name: string; photoUrl?: string | null }[];
  approvedCount: number;
  memberCount: number;
  isLeader: boolean;
  isMember: boolean;
  isDiscoverable: boolean;
  isComplete: boolean;
  hasJoinRequest?: boolean;
  isInvited?: boolean;
  membershipId?: string;
  inviteToken?: string | null;
}

export interface DashboardTeamDetail {
  isInvited: any;
  inviteToken: any;
  membershipId: any;
  id: string;
  teamNameAfterColon: string;
  competitionTitle: string;
  competitionLink: string;
  leadName: string;
  leaderId: string;
  currentUserId: string;
  maxAdditionalMembersNeeded: number;
  approvedCount: number;
  isLeader: boolean;
  isMember: boolean;
  canJoin: boolean;
  hasJoinRequest: boolean;
  members: DashboardTeamMember[];
}

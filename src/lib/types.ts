export type UserRole = "user" | "team" | "admin";

export interface User {
  id: string;
  role: UserRole;
  mobile: string;
  name: string;
  createdAt: string;
  memberName?: string;
  teamId?: string;
  teamName?: string;
}

export type TeamStatus = "Active" | "Disabled";

export interface RescueTeam {
  id: string;
  name: string;
  mobile: string;
  city: string;
  state: string;
  email: string;
  status: TeamStatus;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  teamName: string;
  memberName: string;
  mobileNumber: string;
  email?: string;
  city: string;
  state: string;
  status: "Active" | "Inactive";
  role: "RESCUE_TEAM";
  createdAt: string;
  updatedAt: string;
}

export type TicketStatus = "Pending" | "Accepted" | "Closed";

export interface Ticket {
  id: string;
  eventId: string; // default "112"
  animalType: string; // Cow, Dog, Monkey, Cat, Bird, Snake, Other
  customAnimalType?: string; // If other selected
  description: string;
  imageUrl: string;
  videoUrl: string;
  latitude: number;
  longitude: number;
  status: TicketStatus;
  assignedRescueTeamId?: string; // Links to RescueTeam.id
  assignedRescueTeamName?: string; // Display cache
  createdBy: string; // User.mobile or User.name
  creatorMobile?: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string; // Time team accepted the ticket
  closedAt?: string; // Time ticket closed
  closureReason?: string; // Treatment Completed, Sent To Gaushala, Referred To Hospital, Animal Recovered, Other
  closureDescription?: string; // Custom description if Other
  closurePhotoUrl?: string; // Required final photo
  pendingRemarks?: string; // Reason if team set status back to pending
}

export interface TicketHistory {
  id: string;
  ticketId: string;
  status: TicketStatus;
  remarks: string;
  updatedBy: string; // Name/Role of updater
  createdAt: string;
}

export interface Donation {
  id: string;
  donorName: string;
  mobile: string;
  amount: number;
  paymentMode: string; // UPI, Card, NetBanking, QR, etc.
  transactionId: string;
  createdAt: string;
  email?: string;
  purpose?: string;
  screenshotUrl?: string;
  status?: string; // 'Pending' | 'Verified'
}

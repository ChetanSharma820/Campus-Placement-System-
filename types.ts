
export enum UserRole {
  STUDENT = 'STUDENT',
  TPO = 'TPO',
  MANAGER = 'MANAGER'
}

export enum ApplicationStatus {
  APPLIED = 'Applied',
  SHORTLISTED = 'Shortlisted',
  INTERVIEW = 'Interview',
  SELECTED = 'Selected',
  REJECTED = 'Rejected'
}

export enum PlacementStatus {
  PLACED = 'Placed',
  UNPLACED = 'Unplaced',
  DEBARRED = 'Debarred'
}

export enum JobStatus {
  HIRING_PROCESS = 'Currently Hiring',
  NOT_COMING = 'Not Coming',
  CANCELLED = 'Drive Cancelled',
  ONGOING = 'Drive Ongoing',
  ON_HOLD = 'Drive On Hold'
}

export type DriveType = 'On Campus' | 'Off Campus' | 'Pool Drive';
export type AnnouncementType = 'job' | 'drive' | 'company' | 'placement' | 'general';

export interface DriveDocument {
  id: string;
  title: string;
  url: string;
  fileName: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  date: string;
  type: AnnouncementType;
  isPinned: boolean;
  isDraft?: boolean;
  author: string;
  metadata?: {
    companyName?: string;
    driveType?: DriveType;
    role?: string;
    eligibility?: string;
    documents?: DriveDocument[];
  };
}

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  portfolio?: string;
  custom?: string;
}

export interface AcademicRecord {
  branch: string;
  currentYear: string;
  academicYear: string; // e.g., 2021-2025
  section: string; // e.g., A, B, C
  cgpa: number;
  semesterWiseCgpa: Record<number, number>;
  tenthPercentage: number;
  twelfthPercentage: number;
  totalBacklogs: number;
  activeBacklogs: number;
}

export interface Project {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  githubUrl: string;
  liveUrl?: string;
  techStack: string[];
  thumbnailUrl?: string;
  startDate: string;
  endDate: string;
}

export interface Certification {
  id: string;
  title: string;
  organization: string;
  issueDate: string;
  credentialId?: string;
  credentialUrl?: string;
  certificatePdfUrl?: string;
  badgeImageUrl?: string;
}

export interface Experience {
  id: string;
  companyName: string;
  role: string;
  employmentType: 'Internship' | 'Full-time' | 'Part-time';
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
  skillsUsed: string[];
}

export interface StudentProfile {
  id: string;
  userId: string;
  bio: string;
  bannerUrl?: string;
  socialLinks: SocialLinks;
  phone: string;
  alternatePhone?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  academic: AcademicRecord;
  skills: string[];
  projects: Project[];
  certifications: Certification[];
  experiences: Experience[];
  resumeUrl?: string;
  gender: string;
  placementStatus: PlacementStatus;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  rollNumber?: string;
  avatar?: string;
  department?: string;
  uin?: string;
  cgpa?: number;
  exp?: number;
  section?: string;
  academicYear?: string;
}

export interface Job {
  id: string;
  companyName: string;
  role: string;
  roles?: string[];
  domain: string;
  package: string;
  location: string;
  deadline: string;
  logo: string;
  description: string;
  fullDescription: string;
  criteria: {
    minCgpa: number;
    backlogs: number;
    allowedBranches: string[];
  };
  isNew?: boolean;
  createdAt?: string;
  documents?: DriveDocument[];
  hrName?: string;
  contact?: string;
  email?: string;
  address?: string;
  status?: JobStatus;
}

export interface Application {
  id: string;
  jobId: string;
  studentId: string;
  companyName: string;
  role: string;
  appliedDate: string;
  status: ApplicationStatus;
  interviewDate?: string;
  hiringReason?: string;
  coverLetter?: string;
  customAnswers?: Record<string, string>;
  studentName?: string;
  studentRollNo?: string;
  studentSection?: string;
  studentYear?: string;
  studentBranch?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  type: 'job' | 'status' | 'announcement';
}

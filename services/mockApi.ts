
import { User, UserRole, Job, Application, ApplicationStatus, Notification } from '../types';
import { MOCK_JOBS } from '../constants';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  login: async (role: UserRole, email: string, rollNumber?: string): Promise<User> => {
    await delay(1200); // Realistic network delay

    // Validation Simulation
    if (role === UserRole.STUDENT) {
      if (!email.endsWith('@gitjaipur.com')) {
        throw new Error('Only @gitjaipur.com emails allowed for students.');
      }
      if (!rollNumber || rollNumber.length < 8) {
        throw new Error('Valid University Roll Number is mandatory.');
      }
    } else {
      if (!email.endsWith('@gmail.com')) {
        throw new Error(`Only @gmail.com emails allowed for ${role} access.`);
      }
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      name: role === UserRole.STUDENT ? 'John Doe' : (role === UserRole.TPO ? 'Prof. Smith' : 'Super Manager'),
      email: email,
      role,
      rollNumber: rollNumber || undefined,
      department: 'Information Technology',
      cgpa: 8.7,
      avatar: `https://ui-avatars.com/api/?name=${role}&background=random`
    };
  },

  getJobs: async (): Promise<Job[]> => {
    await delay(500);
    return MOCK_JOBS;
  },

  getApplications: async (studentId: string): Promise<Application[]> => {
    await delay(500);
    return [
      {
        id: 'app1',
        jobId: '1',
        studentId,
        companyName: 'TechNova Solutions',
        role: 'Software Engineer',
        appliedDate: '2024-05-10',
        status: ApplicationStatus.SHORTLISTED,
        interviewDate: '2024-06-05'
      }
    ];
  },

  getNotifications: async (): Promise<Notification[]> => {
    await delay(300);
    return [
      {
        id: 'n1',
        title: 'New Job Posted',
        message: 'TechNova Solutions just posted a new role for Software Engineer.',
        date: '2 hours ago',
        isRead: false,
        type: 'job'
      },
      {
        id: 'n2',
        title: 'Interview Scheduled',
        message: 'Your interview with CloudScale Inc is scheduled for tomorrow at 10 AM.',
        date: '5 hours ago',
        isRead: true,
        type: 'status'
      }
    ];
  }
};

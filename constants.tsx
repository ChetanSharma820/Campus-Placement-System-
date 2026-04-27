
import React from 'react';
import { Briefcase, Users, CheckCircle, Clock, Bell, Settings, PieChart, FileText, UserCircle, Building2 } from 'lucide-react';
import { UserRole, Job } from './types';

export const SIDEBAR_LINKS = {
  [UserRole.STUDENT]: [
    { label: 'Dashboard', icon: <PieChart size={20} />, path: '/student/dashboard' },
    { label: 'Browse Jobs', icon: <Briefcase size={20} />, path: '/student/jobs' },
    { label: 'My Applications', icon: <FileText size={20} />, path: '/student/applications' },
    { label: 'Profile', icon: <UserCircle size={20} />, path: '/student/profile' },
  ],
  [UserRole.TPO]: [
    { label: 'Dashboard', icon: <PieChart size={20} />, path: '/tpo/dashboard' },
    { label: 'Students', icon: <Users size={20} />, path: '/tpo/students' },
    { label: 'Companies', icon: <Building2 size={20} />, path: '/tpo/companies' },
    { label: 'Placement Drives', icon: <Briefcase size={20} />, path: '/tpo/jobs' },
    { label: 'Announcements', icon: <Bell size={20} />, path: '/tpo/announcements' },
  ],
  [UserRole.MANAGER]: [
    { label: 'Overview', icon: <PieChart size={20} />, path: '/manager/dashboard' },
    { label: 'TPO Admins', icon: <Users size={20} />, path: '/manager/tpos' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/manager/settings' },
  ]
};

// Updated MOCK_JOBS to match the Job interface from types.ts
export const MOCK_JOBS: Job[] = [
  {
    id: '1',
    companyName: 'TechNova Solutions',
    role: 'Software Engineer',
    domain: 'Information Technology',
    package: '12 LPA',
    location: 'Bangalore',
    deadline: '2024-06-15',
    logo: 'https://picsum.photos/seed/tech1/100/100',
    description: 'Looking for full-stack developers proficient in React and Node.js.',
    fullDescription: 'We are expanding our core product team. You will be responsible for building high-scale microservices, optimizing front-end performance, and collaborating with cross-functional teams in an agile environment.',
    criteria: { 
      minCgpa: 7.5, 
      backlogs: 0, 
      allowedBranches: ['Computer Science', 'Information Technology', 'Software Engineering'] 
    }
  },
  {
    id: '2',
    companyName: 'CloudScale Inc',
    role: 'DevOps Engineer',
    domain: 'Cloud Infrastructure',
    package: '15 LPA',
    location: 'Remote',
    deadline: '2024-06-20',
    logo: 'https://picsum.photos/seed/tech2/100/100',
    description: 'Cloud infrastructure and automation specialist needed.',
    fullDescription: 'Join our SRE team to manage infrastructure as code. You will build CI/CD pipelines, monitor multi-cloud environments, and ensure system reliability.',
    criteria: { 
      minCgpa: 8.0, 
      backlogs: 0, 
      allowedBranches: ['Computer Science', 'Electronics'] 
    }
  },
  {
    id: '3',
    companyName: 'DataMind AI',
    role: 'Data Scientist',
    domain: 'Artificial Intelligence',
    package: '18 LPA',
    location: 'Hyderabad',
    deadline: '2024-06-25',
    logo: 'https://picsum.photos/seed/tech3/100/100',
    description: 'Expertise in Python, ML, and Statistics required.',
    fullDescription: 'Build the next generation of predictive models. You will work on massive datasets, design neural networks, and deploy ML models into production environments.',
    criteria: { 
      minCgpa: 8.5, 
      backlogs: 0, 
      allowedBranches: ['Computer Science', 'Data Science', 'Mathematics'] 
    }
  }
];


import { User, UserRole, Job, Application, ApplicationStatus, Notification, StudentProfile, Announcement, JobStatus, PlacementStatus } from '../types';
import { realtime } from './realtime';
import { supabase } from './supabase';

// Helper to map DB user to App User
const mapUser = (sbUser: any, profile: any): User => {
  const rawRole = profile?.role || sbUser.user_metadata?.role || 'student';
  const normalizedRole = rawRole.toUpperCase() as UserRole;

  return {
    id: sbUser.id,
    email: sbUser.email || '',
    name: profile?.name || sbUser.user_metadata?.name || 'User',
    role: normalizedRole,
    avatar: profile?.avatar || sbUser.user_metadata?.avatar || `https://ui-avatars.com/api/?name=${profile?.name || 'User'}&background=random`,
    rollNumber: profile?.roll_number,
    department: profile?.department,
    academicYear: profile?.academic_year,
    section: profile?.section,
  };
};

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user data returned');

      // Fetch user profile from public.users (gracefully handle if missing)
      const { data: userRecord, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        console.warn('public.users lookup failed, falling back to auth metadata:', userError.message);
        // Fall back to auth user metadata
        const meta = data.user.user_metadata || {};
        const rawRole = (meta.role || 'student') as string;
        return {
          id: data.user.id,
          email: data.user.email || '',
          name: meta.name || data.user.email || 'User',
          role: rawRole.toUpperCase() as any,
          rollNumber: meta.roll_number,
          department: meta.department,
          academicYear: meta.academic_year,
          section: meta.section,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(meta.name || 'User')}&background=random`,
        };
      }

      // Fetch specific profile based on role
      let profileData = null;
      if (userRecord.role === 'student') {
        const { data: student } = await supabase.from('student_profiles').select('*').eq('user_id', data.user.id).single();
        profileData = student;
      } else if (userRecord.role === 'tpo') {
        const { data: tpo } = await supabase.from('tpo_profiles').select('*').eq('user_id', data.user.id).single();
        profileData = tpo;
      }

      return mapUser(data.user, { ...userRecord, ...profileData });
    },

    getUser: async (): Promise<User | null> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data: userRecord, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userError || !userRecord) {
        // Fall back to auth metadata
        const meta = session.user.user_metadata || {};
        const rawRole = (meta.role || 'student') as string;
        return {
          id: session.user.id,
          email: session.user.email || '',
          name: meta.name || session.user.email || 'User',
          role: rawRole.toUpperCase() as any,
          rollNumber: meta.roll_number,
          department: meta.department,
          academicYear: meta.academic_year,
          section: meta.section,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(meta.name || 'User')}&background=random`,
        };
      }

      let profileData = null;
      if (userRecord.role === 'student') {
        const { data: student } = await supabase.from('student_profiles').select('*').eq('user_id', session.user.id).single();
        profileData = student;
      } else if (userRecord.role === 'tpo') {
        const { data: tpo } = await supabase.from('tpo_profiles').select('*').eq('user_id', session.user.id).single();
        profileData = tpo;
      }

      return mapUser(session.user, { ...userRecord, ...profileData });
    },

    signOut: async () => {
      await supabase.auth.signOut();
    },

    changePassword: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Update password_changed flag if it exists in profile
        const { error: profileError } = await supabase.from('student_profiles').update({
          password_changed: true,
          password_changed_at: new Date().toISOString()
        }).eq('user_id', user.id);

        // Ignore error if not a student (e.g. TPO)
        if (profileError && profileError.code !== 'PGRST116') {
          console.log("Not a student or profile not found, skipping flag update");
        }
      }
    }
  },

  tpo: {
    getAcademicYears: async () => {
      const { data, error } = await supabase
        .from('academic_config')
        .select('academic_year')
        .order('academic_year', { ascending: false });

      if (error) throw error;
      return data.map(d => d.academic_year);
    },
    addAcademicYear: async (year: string) => {
      const { error } = await supabase
        .from('academic_config')
        .insert({ academic_year: year, sections: ['A'] });

      if (error) throw error;
      return year;
    },
    deleteAcademicYear: async (year: string) => {
      const { error } = await supabase
        .from('academic_config')
        .delete()
        .eq('academic_year', year);

      if (error) throw error;
      return api.tpo.getAcademicYears();
    },
    getSections: async (year: string) => {
      const { data, error } = await supabase
        .from('academic_config')
        .select('sections')
        .eq('academic_year', year)
        .single();

      if (error) return [];
      return data.sections || [];
    },
    addSection: async (year: string, section: string) => {
      const { data, error } = await supabase
        .from('academic_config')
        .select('sections')
        .eq('academic_year', year)
        .single();

      if (error) throw error;

      const currentSections = data.sections || [];
      if (!currentSections.includes(section)) {
        const { error: updateError } = await supabase
          .from('academic_config')
          .update({ sections: [...currentSections, section] })
          .eq('academic_year', year);

        if (updateError) throw updateError;
      }
      return [...currentSections, section];
    },
    getStudents: async (year: string, section: string) => {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*, profiles(role, email)')
        .eq('academic_year', year)
        .eq('section', section);

      if (error) throw error;

      return data.map(s => ({
        id: s.user_id,
        name: s.name,
        email: s.email,
        role: UserRole.STUDENT,
        rollNumber: s.roll_number,
        section: s.section,
        academicYear: s.academic_year,
        department: s.department,
        cgpa: s.cgpa ? parseFloat(s.cgpa) : 0,
        profile: {
          ...mapUser({ id: s.user_id, email: s.email }, s),
          placementStatus: s.placement_status // Crucial for TPO UI
        }
      }));
    },
    addStudent: async (student: Partial<User>) => {
      const { data, error } = await supabase.rpc('create_student_account', {
        p_roll_number: student.rollNumber,
        p_name: student.name,
        p_email: student.email,
        p_department: student.department || 'Computer Science',
        p_academic_year: student.academicYear,
        p_section: student.section,
        p_cgpa: student.cgpa || 0
      });

      if (error) throw error;
      return { ...student, id: data } as User;
    },
    updateStudent: async (studentId: string, updates: Partial<User>) => {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.rollNumber) updateData.roll_number = updates.rollNumber;
      if (updates.department) updateData.department = updates.department;
      if (updates.section) updateData.section = updates.section;
      if (updates.cgpa) updateData.cgpa = updates.cgpa;

      const { error } = await supabase
        .from('student_profiles')
        .update(updateData)
        .eq('user_id', studentId);

      if (error) throw error;

      if (updates.name) {
        await supabase.from('profiles').update({ name: updates.name }).eq('id', studentId);
      }

      return { id: studentId, ...updates } as User;
    },
    deleteStudent: async (studentId: string) => {
      const { error } = await supabase.from('profiles').delete().eq('id', studentId);
      if (error) throw error;
    },
    importStudents: async (year: string, section: string, data: any[], onProgress?: (index: number, total: number, result?: any) => void) => {
      const results = [];
      const total = data.length;
      
      for (let i = 0; i < total; i++) {
        const item = data[i];
        try {
          const { data: userId, error } = await supabase.rpc('create_student_account', {
            p_roll_number: item.rollNumber?.toString() || '',
            p_name: item.name?.toString() || 'Unknown Student',
            p_email: item.email?.toString() || 'N/A',
            p_department: item.department?.toString() || 'General',
            p_academic_year: year,
            p_section: section,
            p_cgpa: item.cgpa ? parseFloat(item.cgpa.toString()) : 0
          });
          
          if (!error) {
            results.push(userId);
            if (onProgress) onProgress(i + 1, total, { id: userId, ...item });
          } else {
            console.error("RPC Error importing student:", error);
            if (onProgress) onProgress(i + 1, total, { error: error.message || JSON.stringify(error) });
          }
        } catch (e: any) {
          console.error("Failed to import student", item, e);
          if (onProgress) onProgress(i + 1, total, { error: e.message || "Unknown error" });
        }
      }
      return results;
    },
    getPlacementActions: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('applied_date', { ascending: false });

      if (error) throw error;

      return data.map(app => ({
        id: app.id,
        jobId: app.job_id,
        studentId: app.student_id,
        companyName: app.company_name,
        role: app.role,
        appliedDate: app.applied_date ? app.applied_date.split('T')[0] : '',
        status: app.status as ApplicationStatus,
        studentName: app.student_name,
        studentRollNo: app.student_roll_no,
        studentSection: app.student_section,
        studentYear: app.student_year,
        studentBranch: app.student_branch
      }));
    },
    updatePlacementStatus: async (studentId: string, status: PlacementStatus) => {
      const { error } = await supabase
        .from('student_profiles')
        .update({ placement_status: status })
        .eq('user_id', studentId);

      if (error) throw error;
      return status;
    },
    updateApplicationStatus: async (appId: string, status: ApplicationStatus) => {
      const { error } = await supabase
        .from('applications')
        .update({ status: status })
        .eq('id', appId);

      if (error) throw error;
    },
    removeApplication: async (appId: string) => {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', appId);

      if (error) throw error;
    },
    getDashboardStats: async () => {
      const [
        { count: totalStudents },
        { count: placedCount },
        { count: activeJobs },
        { count: totalCompanies },
        { data: recentPlacements },
        { data: deptStatsRaw },
        { data: placedProfiles }
      ] = await Promise.all([
        supabase.from('student_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('student_profiles').select('*', { count: 'exact', head: true }).eq('placement_status', 'placed'),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('applications').select('*').in('status', ['selected', 'offer_accepted']).order('updated_at', { ascending: false }).limit(5),
        supabase.from('student_profiles').select('department, placement_status'),
        supabase.from('student_profiles').select('placed_package').eq('placement_status', 'placed')
      ]);

      const eligible = Math.floor((totalStudents || 0) * 0.85);

      const deptMap: Record<string, { placed: number, total: number }> = {};
      (deptStatsRaw || []).forEach((s: any) => {
        if (!deptMap[s.department]) deptMap[s.department] = { placed: 0, total: 0 };
        deptMap[s.department].total++;
        if (s.placement_status === 'placed') deptMap[s.department].placed++;
      });

      const deptStats = Object.keys(deptMap).map(key => ({
        name: key,
        placed: deptMap[key].placed,
        total: deptMap[key].total
      }));

      // Calculate Packages
      const packages = (placedProfiles || [])
        .map((p: any) => {
          const match = (p.placed_package || '').match(/([\d\.]+)/);
          return match ? parseFloat(match[1]) : 0;
        })
        .filter((val: number) => val > 0)
        .sort((a: number, b: number) => a - b);

      const highest = packages.length > 0 ? packages[packages.length - 1] : 0;
      const average = packages.length > 0 ? packages.reduce((a: number, b: number) => a + b, 0) / packages.length : 0;
      const median = packages.length > 0 ? packages[Math.floor(packages.length / 2)] : 0;

      return {
        totalStudents: totalStudents || 0,
        eligible,
        nonEligible: (totalStudents || 0) - eligible,
        companiesParticipated: totalCompanies || 0,
        totalDrives: activeJobs || 0,
        placedCount: placedCount || 0,
        placedPercentage: totalStudents ? (((placedCount || 0) / totalStudents) * 100).toFixed(1) : '0',
        unplacedCount: (totalStudents || 0) - (placedCount || 0),
        highestPackage: `${highest} LPA`,
        averagePackage: `${average.toFixed(1)} LPA`,
        medianPackage: `${median} LPA`,
        activeJobListings: activeJobs || 0,
        recentPlacements: (recentPlacements || []).map((p: any) => ({
          name: p.student_name,
          company: p.company_name,
          package: p.offer_package || 'N/A',
          date: new Date(p.updated_at).toLocaleDateString()
        })),
        upcomingDrives: [],
        placementTrends: [
          { year: '2021', placed: 142, unplaced: 45 },
          { year: '2022', placed: 168, unplaced: 38 },
          { year: '2023', placed: 195, unplaced: 22 },
          { year: '2024', placed: placedCount || 0, unplaced: (totalStudents || 0) - (placedCount || 0) },
        ],
        deptStats
      };
    },
  },

  announcements: {
    getAll: async (): Promise<Announcement[]> => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('publish_date', { ascending: false });

      if (error) throw error;

      return data.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        date: a.publish_date || a.created_at,
        type: a.type,
        isPinned: a.is_pinned,
        isDraft: a.is_draft,
        author: a.author || 'TPO Admin',
        metadata: a.metadata
      }));
    },
    create: async (data: Omit<Announcement, 'id' | 'date'>): Promise<Announcement> => {
      const { data: newAnn, error } = await supabase
        .from('announcements')
        .insert({
          title: data.title,
          description: data.description,
          type: data.type,
          is_pinned: data.isPinned,
          is_draft: data.isDraft,
          metadata: data.metadata,
          author: data.author,
          publish_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      if (newAnn.type === 'drive' && !newAnn.is_draft && newAnn.metadata) {
        const { error: jobError } = await supabase.from('jobs').insert({
          company_name: newAnn.metadata.companyName || 'Unknown Company',
          role: newAnn.metadata.role || 'Software Engineer',
          roles: [newAnn.metadata.role || 'Software Engineer'],
          domain: 'Engineering',
          package: 'As per Industry Standards',
          location: 'TBD',
          deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          description: newAnn.description,
          full_description: newAnn.description,
          min_cgpa: 6.5,
          max_backlogs: 0,
          allowed_branches: ['All Streams'],
          status: 'active',
          is_visible: true
        });

        if (jobError) console.error("Failed to auto-create job from announcement", jobError);
      }

      return {
        id: newAnn.id,
        title: newAnn.title,
        description: newAnn.description,
        date: newAnn.publish_date,
        type: newAnn.type as any,
        isPinned: newAnn.is_pinned,
        isDraft: newAnn.is_draft,
        author: newAnn.author,
        metadata: newAnn.metadata
      };
    },
    update: async (id: string, updates: Partial<Announcement>): Promise<Announcement> => {
      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.type) updateData.type = updates.type;
      if (updates.isPinned !== undefined) updateData.is_pinned = updates.isPinned;
      if (updates.isDraft !== undefined) updateData.is_draft = updates.isDraft;
      if (updates.metadata) updateData.metadata = updates.metadata;

      const { data, error } = await supabase
        .from('announcements')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        date: data.publish_date,
        type: data.type as any,
        isPinned: data.is_pinned,
        isDraft: data.is_draft,
        author: data.author,
        metadata: data.metadata
      };
    },
    delete: async (id: string): Promise<void> => {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
    }
  },

  student: {
    getProfile: async (userId: string): Promise<StudentProfile> => {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        throw new Error("Profile not found. Please contact TPO.");
      }

      return {
        id: data.id,
        userId: data.user_id,
        bio: data.bio || '',
        bannerUrl: data.banner_url || data.profile_photo,
        socialLinks: data.social_links || {},
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || 'India',
        pincode: data.pincode || '',
        academic: {
          branch: data.department,
          currentYear: data.current_year?.toString() || 'Final Year',
          academicYear: data.academic_year,
          section: data.section,
          cgpa: data.cgpa ? parseFloat(data.cgpa) : 0,
          semesterWiseCgpa: data.semester_wise_sgpa || {},
          tenthPercentage: data.tenth_percentage || 0,
          twelfthPercentage: data.twelfth_percentage || 0,
          totalBacklogs: data.total_backlogs || 0,
          activeBacklogs: data.active_backlogs || 0
        },
        skills: data.skills || [],
        projects: data.projects || [],
        certifications: data.certifications || [],
        experiences: data.experiences || [],
        resumeUrl: data.resume_url,
        gender: data.gender || 'Not Set',
        placementStatus: (data.placement_status as PlacementStatus) || PlacementStatus.UNPLACED
      };
    },
    getApplications: async (studentId: string): Promise<Application[]> => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('student_id', studentId);

      if (error) throw error;

      return data.map(app => ({
        id: app.id,
        jobId: app.job_id,
        studentId: app.student_id,
        companyName: app.company_name,
        role: app.role,
        appliedDate: app.applied_date ? app.applied_date.split('T')[0] : '',
        status: app.status as ApplicationStatus,
        studentName: app.student_name,
        studentRollNo: app.student_roll_no,
        studentSection: app.student_section,
        studentYear: app.student_year,
        studentBranch: app.student_branch
      }));
    },
    applyToJob: async (application: Omit<Application, 'id' | 'appliedDate' | 'status'>): Promise<Application> => {
      const { data: student, error: studentError } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', application.studentId)
        .single();

      if (studentError) throw studentError;

      const { data: newApp, error } = await supabase
        .from('applications')
        .insert({
          job_id: application.jobId,
          student_id: application.studentId,
          company_name: application.companyName,
          role: application.role,
          student_name: student.name,
          student_email: student.email,
          student_roll_no: student.roll_number,
          student_section: student.section,
          student_year: student.academic_year,
          student_branch: student.department,
          student_cgpa: student.cgpa,
          status: 'Applied'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: newApp.id,
        jobId: newApp.job_id,
        studentId: newApp.student_id,
        companyName: newApp.company_name,
        role: newApp.role,
        appliedDate: newApp.applied_date,
        status: newApp.status as ApplicationStatus,
        studentName: newApp.student_name,
        studentRollNo: newApp.student_roll_no,
        studentSection: newApp.student_section,
        studentYear: newApp.student_year,
        studentBranch: newApp.student_branch
      };
    },
    updateProfile: async (userId: string, data: Partial<StudentProfile>): Promise<StudentProfile> => {
      const dbUpdates: any = {};

      if (data.bio !== undefined) dbUpdates.bio = data.bio;
      if (data.phone !== undefined) dbUpdates.phone = data.phone;
      if (data.address !== undefined) dbUpdates.address = data.address;
      if (data.city !== undefined) dbUpdates.city = data.city;
      if (data.state !== undefined) dbUpdates.state = data.state;
      if (data.pincode !== undefined) dbUpdates.pincode = data.pincode;
      if (data.gender !== undefined) dbUpdates.gender = data.gender;
      if (data.socialLinks !== undefined) dbUpdates.social_links = data.socialLinks;
      if (data.skills !== undefined) dbUpdates.skills = data.skills;
      if (data.projects !== undefined) dbUpdates.projects = data.projects;
      if (data.certifications !== undefined) dbUpdates.certifications = data.certifications;
      if (data.experiences !== undefined) dbUpdates.experiences = data.experiences;
      if (data.resumeUrl !== undefined) dbUpdates.resume_url = data.resumeUrl;

      const { data: updated, error } = await supabase
        .from('student_profiles')
        .update(dbUpdates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return api.student.getProfile(userId);
    },
    uploadFile: async (file: File): Promise<string> => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload failed", uploadError);
        return URL.createObjectURL(file);
      }

      const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
      return data.publicUrl;
    }
  },

  jobs: {
    getAll: async (): Promise<Job[]> => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_visible', true)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(j => ({
        id: j.id,
        companyName: j.company_name,
        role: j.role,
        roles: j.roles || [],
        domain: j.domain,
        package: j.package,
        location: j.location,
        deadline: j.deadline,
        logo: j.logo || `https://ui-avatars.com/api/?name=${j.company_name}&background=random`,
        description: j.description,
        fullDescription: j.full_description,
        criteria: {
          minCgpa: j.min_cgpa,
          backlogs: j.max_backlogs,
          allowedBranches: j.allowed_branches || []
        },
        createdAt: j.created_at,
        documents: j.documents || [],
        hrName: j.hr_name,
        contact: j.hr_contact,
        email: j.hr_email,
        address: j.company_address,
        status: j.status as JobStatus
      }));
    },
    getById: async (id: string): Promise<Job | undefined> => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return undefined;

      return {
        id: data.id,
        companyName: data.company_name,
        role: data.role,
        roles: data.roles || [],
        domain: data.domain,
        package: data.package,
        location: data.location,
        deadline: data.deadline,
        logo: data.logo || `https://ui-avatars.com/api/?name=${data.company_name}&background=random`,
        description: data.description,
        fullDescription: data.full_description,
        criteria: {
          minCgpa: data.min_cgpa,
          backlogs: data.max_backlogs,
          allowedBranches: data.allowed_branches || []
        },
        createdAt: data.created_at,
        documents: data.documents || [],
        hrName: data.hr_name,
        contact: data.hr_contact,
        email: data.hr_email,
        address: data.company_address,
        status: data.status as JobStatus
      };
    },
    getApplicationsByJob: async (jobId: string): Promise<any[]> => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', jobId);

      if (error) throw error;

      return data.map(app => ({
        id: app.id,
        jobId: app.job_id,
        studentId: app.student_id,
        companyName: app.company_name,
        role: app.role,
        appliedDate: app.applied_date ? app.applied_date.split('T')[0] : '',
        status: app.status,
        studentName: app.student_name,
        studentRollNo: app.student_roll_no,
        studentSection: app.student_section,
        studentYear: app.student_year,
        studentBranch: app.student_branch
      }));
    },
    create: async (data: Omit<Job, 'id'>): Promise<Job> => {
      const { data: newJob, error } = await supabase
        .from('jobs')
        .insert({
          company_name: data.companyName,
          role: data.role,
          roles: data.roles,
          domain: data.domain,
          package: data.package,
          location: data.location,
          deadline: data.deadline,
          logo: data.logo,
          description: data.description,
          full_description: data.fullDescription,
          min_cgpa: data.criteria.minCgpa,
          max_backlogs: data.criteria.backlogs,
          allowed_branches: data.criteria.allowedBranches,
          status: data.status || 'active',
          is_visible: true,
          hr_name: data.hrName,
          hr_email: data.email,
          hr_contact: data.contact,
          company_address: data.address
        })
        .select()
        .single();

      if (error) throw error;

      return { ...data, id: newJob.id, createdAt: newJob.created_at } as Job;
    },
    update: async (id: string, updates: Partial<Job>): Promise<Job> => {
      const dbUpdates: any = {};
      if (updates.companyName) dbUpdates.company_name = updates.companyName;
      if (updates.role) dbUpdates.role = updates.role;
      if (updates.package) dbUpdates.package = updates.package;
      if (updates.deadline) dbUpdates.deadline = updates.deadline;
      if (updates.status) dbUpdates.status = updates.status;
      // ... map other fields as needed

      const { data: updated, error } = await supabase
        .from('jobs')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { ...updates, id } as Job;
    },
    delete: async (id: string): Promise<void> => {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (error) throw error;
    }
  },
  
  companies: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    create: async (company: { name: string, domain: string, logo: string }) => {
      const { data, error } = await supabase
        .from('companies')
        .insert(company)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    }
  }
};

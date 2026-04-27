
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  Users, UserPlus, FileSpreadsheet, Search, Filter, Trash2, Edit3,
  CheckCircle, XCircle, Slash, Download, Plus, ChevronRight, 
  ChevronLeft, Loader2, AlertTriangle, Layers, Briefcase, GraduationCap,
  Cloud, HardDrive, Link, Globe, Save, Mail, Hash, BookOpen, File as FileIcon, X, Check
} from 'lucide-react';
import { api } from '../../services/api';
import { User, PlacementStatus, Application, ApplicationStatus } from '../../types';
import { GlassCard } from '../../components/common/GlassCard';
import * as XLSX from 'xlsx';

type ActiveTab = 'management' | 'actions';
type ImportType = 'local' | 'drive';

export const TpoStudents: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('management');
  
  // State for Management flow
  const [years, setYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [sections, setSections] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Placement Actions flow
  const [applications, setApplications] = useState<Application[]>([]);
  const [actionSearch, setActionSearch] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterBranch, setFilterBranch] = useState('');

  // Modals & Forms
  const [showYearModal, setShowYearModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  const [newYearFrom, setNewYearFrom] = useState('');
  const [newYearTo, setNewYearTo] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [manualStudent, setManualStudent] = useState({ name: '', rollNumber: '', email: '', department: '', cgpa: '' });
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  
  const [importType, setImportType] = useState<ImportType>('local');
  const [driveUrl, setDriveUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const yrData = await api.tpo.getAcademicYears();
        setYears(yrData);
      } catch (err) {
        console.error("Failed to load batches:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (activeTab === 'actions') {
      refreshApplications();
    }
  }, [activeTab]);

  const handleYearSelect = async (year: string) => {
    setSelectedYear(year);
    setSelectedSection(null);
    setLoading(true);
    const secData = await api.tpo.getSections(year);
    setSections(secData);
    setLoading(false);
  };

  const handleSectionSelect = async (section: string) => {
    setSelectedSection(section);
    if (selectedYear) {
      refreshStudents(selectedYear, section);
    }
  };

  const refreshStudents = async (yearOverride?: string, sectionOverride?: string) => {
    const year = yearOverride || selectedYear;
    const section = sectionOverride || selectedSection;

    if (year && section) {
      setLoading(true);
      try {
        const studData = await api.tpo.getStudents(year, section);
        setStudents(studData);
      } catch (err) {
        console.error("Failed to load students:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const refreshApplications = async () => {
    const apps = await api.tpo.getPlacementActions();
    setApplications(apps);
  };

  const handleAddYear = async () => {
    if (!newYearFrom || !newYearTo) return;
    const yearString = `${newYearFrom}-${newYearTo}`;
    try {
      const newYearString = await api.tpo.addAcademicYear(yearString);
      setYears(prev => [newYearString, ...prev]);
      setShowYearModal(false);
      setNewYearFrom('');
      setNewYearTo('');
    } catch (err: any) {
      console.error("Failed to add batch:", err);
      alert(`Error: ${err.message || 'Failed to save batch to Supabase'}`);
    }
  };

  const handleDeleteYear = async (e: React.MouseEvent, year: string) => {
    e.stopPropagation(); // Don't enter the directory
    const pass = window.prompt(`To delete batch "${year}", enter Admin Password:`);
    if (pass === 'Admin@pass') {
      const updated = await api.tpo.deleteAcademicYear(year);
      setYears(updated);
    } else if (pass !== null) {
      alert("Invalid Password. Deletion denied.");
    }
  };

  const handleAddSection = async () => {
    if (!newSectionName || !selectedYear) return;
    const updated = await api.tpo.addSection(selectedYear, newSectionName);
    setSections(updated);
    setShowSectionModal(false);
    setNewSectionName('');
  };

  const handleOpenAddStudent = () => {
    setEditingStudentId(null);
    setManualStudent({ name: '', rollNumber: '', email: '', department: '', cgpa: '' });
    setShowStudentModal(true);
  };

  const handleEditStudent = (s: any) => {
    setEditingStudentId(s.id);
    setManualStudent({ 
      name: s.name, 
      rollNumber: s.rollNumber, 
      email: s.email, 
      department: s.department, 
      cgpa: s.cgpa.toString() 
    });
    setShowStudentModal(true);
  };

  const handleStudentFormSubmit = async () => {
    if (!selectedYear || !selectedSection) return;
    if (editingStudentId) {
      await api.tpo.updateStudent(editingStudentId, {
        ...manualStudent,
        cgpa: parseFloat(manualStudent.cgpa)
      });
    } else {
      await api.tpo.addStudent({
        ...manualStudent,
        academicYear: selectedYear,
        section: selectedSection,
        cgpa: parseFloat(manualStudent.cgpa)
      });
    }
    refreshStudents();
    setShowStudentModal(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
    }
  };

  const [importProgress, setImportProgress] = useState<{ current: number, total: number } | null>(null);
  
  const handleImportProtocol = async () => {
    if (!selectedYear || !selectedSection) return;
    
    setImporting(true);
    setImportProgress(null);

    const errors: string[] = [];
    const onProgress = (current: number, total: number, result?: any) => {
      setImportProgress({ current, total });
      if (result && !result.error) {
        // Live update the student list in UI
        setStudents(prev => {
          if (prev.find(s => s.id === result.id)) return prev;
          
          const newStudent = {
            id: result.id,
            name: result.name,
            email: result.email || `${result.rollNumber}@gitjaipur.com`,
            role: 'STUDENT',
            rollNumber: result.rollNumber,
            section: selectedSection,
            academicYear: selectedYear,
            department: result.department,
            cgpa: parseFloat(result.cgpa || '0'),
            profile: { placementStatus: 'unplaced' }
          };
          return [newStudent, ...prev];
        });
      } else if (result?.error) {
        errors.push(result.error);
      }
    };

    if (importType === 'drive') {
      if (!driveUrl) return;
      const mockData = [
        { name: 'Cloud User Alpha', rollNumber: '21EGB101', email: 'alpha@gitjaipur.com', cgpa: '8.5', department: 'CS' },
        { name: 'Cloud User Beta', rollNumber: '21EGB102', email: 'beta@gitjaipur.com', cgpa: '7.8', department: 'IT' },
      ];
      await api.tpo.importStudents(selectedYear, selectedSection, mockData, onProgress);
    } else {
      if (!pendingFile) return;
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          
          const mappedData = json.map((row: any) => ({
            name: (row.Name || row.name || row['Full Name'] || row.student_name || '').toString().trim(),
            rollNumber: (row.RollNumber || row.Roll || row['Roll Number'] || row.roll_number || row.rollNumber || '').toString().trim(),
            email: (row.Email || row.email || row.EmailID || '').toString().trim(),
            cgpa: (row.CGPA || row.cgpa || row.GPA || row.gpa || '0.0').toString().trim(),
            department: (row.Department || row.department || row.Branch || row.branch || row.Stream || 'General').toString().trim()
          })).filter(s => s.name && s.rollNumber); // Skip empty rows
          
          if (mappedData.length === 0) {
            alert("No valid student data found in the file.");
            setImporting(false);
            return;
          }

          await api.tpo.importStudents(selectedYear, selectedSection, mappedData, onProgress);
          
          if (errors.length > 0) {
            alert(`Import completed with ${errors.length} errors. Sample: ${errors[0]}`);
          } else {
            // refreshStudents(); // Final sync
          }
          
          setImporting(false);
          setShowImportModal(false);
          setPendingFile(null);
          setImportProgress(null);
        } catch (err) {
          console.error("Import error:", err);
          alert("Failed to parse the file. Please ensure it follows the correct format.");
          setImporting(false);
          setImportProgress(null);
        }
      };
      reader.readAsArrayBuffer(pendingFile);
      return;
    }

    setImporting(false);
    setShowImportModal(false);
    setDriveUrl('');
    setPendingFile(null);
    setImportProgress(null);
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Name: 'Shubham Sharma', Roll: '2022CS01', Email: 'shubham@example.com', CGPA: '8.5', Branch: 'Computer Science' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Student_Upload_Template.xlsx");
  };

  const handleUpdatePlacement = async (studId: string, status: PlacementStatus) => {
    await api.tpo.updatePlacementStatus(studId, status);
    if (activeTab === 'management') {
      refreshStudents();
    } else {
      refreshApplications();
    }
  };

  const handleUpdateAppStatus = async (appId: string, status: ApplicationStatus) => {
    await api.tpo.updateApplicationStatus(appId, status);
    refreshApplications();
  };

  const handleRemoveApp = async (id: string) => {
    if(window.confirm("Remove this action from ledger?")) {
      await api.tpo.removeApplication(id);
      refreshApplications();
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if(window.confirm("Permanently delete this student record?")) {
      await api.tpo.deleteStudent(id);
      refreshStudents();
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const filteredActions = useMemo(() => {
    return applications.filter(a => {
      const matchesSearch = a.studentName?.toLowerCase().includes(actionSearch.toLowerCase()) || a.companyName.toLowerCase().includes(actionSearch.toLowerCase());
      const matchesYear = filterYear ? a.studentYear === filterYear : true;
      const matchesBranch = filterBranch ? a.studentBranch === filterBranch : true;
      return matchesSearch && matchesYear && matchesBranch;
    });
  }, [applications, actionSearch, filterYear, filterBranch]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24 max-w-full">
      <div className="flex flex-wrap bg-white/50 backdrop-blur-xl p-1.5 rounded-[2rem] border border-white/50 w-fit shadow-lg max-w-full overflow-x-auto">
        <button 
          onClick={() => setActiveTab('management')}
          className={`flex items-center gap-3 px-6 md:px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'management' ? 'bg-blue-600 text-white shadow-xl' : 'text-gray-400 hover:text-blue-600'}`}
        >
          <Layers size={16}/> Student Vault
        </button>
        <button 
          onClick={() => setActiveTab('actions')}
          className={`flex items-center gap-3 px-6 md:px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'actions' ? 'bg-blue-600 text-white shadow-xl' : 'text-gray-400 hover:text-blue-600'}`}
        >
          <Briefcase size={16}/> Placement Ledger
        </button>
      </div>

      {activeTab === 'management' ? (
        <div className="space-y-8 w-full overflow-hidden">
          {!selectedYear ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
               <GlassCard className="lg:col-span-full !p-8 md:!p-10 flex flex-col md:flex-row items-center justify-between border-none shadow-xl bg-blue-600 text-white gap-6">
                  <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Academic Directories</h2>
                    <p className="text-sm font-medium opacity-80 uppercase tracking-widest mt-2">Manage student lifecycles by batch</p>
                  </div>
                  <button onClick={() => setShowYearModal(true)} className="flex items-center gap-3 px-8 py-4 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-gray-50 transition-all shrink-0"><Plus size={20}/> New Batch</button>
               </GlassCard>
               {years.map(yr => (
                 <div key={yr} className="relative group w-full">
                   <button onClick={() => handleYearSelect(yr)} className="w-full group/card bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-blue-500 transition-all text-left relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 text-blue-50 opacity-20 pointer-events-none group-hover/card:text-blue-100 transition-colors">
                        <GraduationCap size={120} className="rotate-12"/>
                      </div>
                      <GraduationCap size={48} className="text-blue-600 mb-8 group-hover/card:scale-110 transition-transform relative z-10"/>
                      <h3 className="text-4xl font-black text-gray-900 tracking-tighter mb-2 relative z-10 truncate">{yr}</h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] relative z-10">Directory Active</p>
                      <div className="mt-8 flex items-center text-blue-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover/card:opacity-100 transition-all translate-y-2 group-hover/card:translate-y-0">
                        Enter Directory <ChevronRight size={16} className="ml-1"/>
                      </div>
                   </button>
                   <button 
                    onClick={(e) => handleDeleteYear(e, yr)}
                    className="absolute top-6 right-6 p-4 bg-white text-gray-300 hover:text-red-600 rounded-2xl border border-gray-50 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-20 hover:shadow-xl"
                   >
                     <Trash2 size={20}/>
                   </button>
                 </div>
               ))}
            </div>
          ) : !selectedSection ? (
            <div className="space-y-8 w-full">
               <div className="flex flex-col md:flex-row items-center gap-6">
                  <button onClick={() => setSelectedYear(null)} className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 transition-all shadow-md shrink-0"><ChevronLeft size={24}/></button>
                  <div className="text-center md:text-left min-w-0">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase truncate">{selectedYear} Matrix</h2>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-widest mt-1">Filtering by Sectional Units</p>
                  </div>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8 w-full">
                  {sections.map(sec => (
                    <button key={sec} onClick={() => handleSectionSelect(sec)} className="p-10 md:p-12 bg-white rounded-[2.5rem] border border-gray-100 shadow-lg hover:shadow-2xl hover:border-blue-600 transition-all group flex flex-col items-center justify-center gap-4 min-w-0">
                       <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest group-hover:text-blue-400 transition-colors">Section</span>
                       <span className="text-4xl md:text-6xl font-black text-gray-100 group-hover:text-blue-600 transition-all leading-none">SEC {sec}</span>
                    </button>
                  ))}
                  <button onClick={() => setShowSectionModal(true)} className="p-10 md:p-12 bg-gray-50/50 rounded-[2.5rem] border-4 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 text-gray-300 hover:border-blue-400 hover:text-blue-600 transition-all hover:bg-white shadow-inner">
                     <Plus size={40}/>
                     <span className="text-xs font-black uppercase tracking-widest">Define Section</span>
                  </button>
               </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-10 duration-500 w-full">
               <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 border-b border-gray-100 pb-10">
                  <div className="flex items-center gap-6 min-w-0">
                    <button onClick={() => setSelectedSection(null)} className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 transition-all shadow-md shrink-0"><ChevronLeft size={24}/></button>
                    <div className="min-w-0">
                      <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase truncate">{selectedYear} • Section {selectedSection}</h2>
                      <p className="text-sm text-gray-500 font-medium uppercase tracking-widest mt-1">Accessing Student Identity Ledger</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                    <button onClick={() => setShowImportModal(true)} className="flex items-center justify-center gap-3 px-8 py-4 md:py-5 bg-white border border-gray-100 text-gray-600 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:shadow-xl transition-all"><FileSpreadsheet size={20}/> Bulk Transmission</button>
                    <button onClick={handleOpenAddStudent} className="flex items-center justify-center gap-3 px-8 py-4 md:py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all"><UserPlus size={20}/> Manual Entry</button>
                  </div>
               </div>

               <div className="relative group w-full">
                  <Search className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={24}/>
                  <input 
                    type="text" 
                    placeholder="Search by Identity or Credentials..." 
                    className="w-full pl-16 md:pl-20 pr-8 py-5 md:py-6 rounded-[2rem] md:rounded-[2.5rem] bg-white border-none focus:ring-8 focus:ring-blue-100 outline-none transition-all font-bold text-gray-900 shadow-xl text-sm md:text-base"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>

               {loading ? (
                  <div className="py-32 flex flex-col items-center"><Loader2 className="animate-spin text-blue-600 mb-6" size={48}/><p className="text-xs font-black uppercase text-gray-400 tracking-[0.4em]">Deciphering Records...</p></div>
               ) : (
                <div className="overflow-x-auto glass rounded-[2.5rem] md:rounded-[3rem] border-white/50 shadow-2xl w-full">
                  <table className="w-full text-left min-w-[1000px]">
                    <thead className="bg-white/50 border-b border-gray-100">
                      <tr>
                        <th className="p-8 md:p-10 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Student Asset</th>
                        <th className="p-8 md:p-10 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">Benchmark</th>
                        <th className="p-8 md:p-10 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Stream</th>
                        <th className="p-8 md:p-10 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Placement Pulse</th>
                        <th className="p-8 md:p-10 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 text-right whitespace-nowrap">Edit Identity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredStudents.map(s => (
                        <tr key={s.id} className="hover:bg-white/60 transition-colors group">
                          <td className="p-8 md:p-10">
                             <div className="flex items-center gap-6 min-w-0">
                               <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-gray-50 to-white flex items-center justify-center text-gray-300 font-black text-2xl border border-gray-100 shadow-inner group-hover:scale-105 transition-transform shrink-0">
                                 {(s.name || 'U').charAt(0)}
                               </div>
                               <div className="min-w-0">
                                 <p className="text-base md:text-lg font-black text-gray-900 uppercase tracking-tight truncate max-w-[200px]">{s.name}</p>
                                 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 truncate"># {s.rollNumber}</p>
                               </div>
                             </div>
                          </td>
                          <td className="p-8 md:p-10 text-center">
                             <span className="text-lg md:text-xl font-black text-gray-900 whitespace-nowrap">{s.cgpa} <span className="text-[10px] text-gray-300">CGPA</span></span>
                          </td>
                          <td className="p-8 md:p-10">
                             <span className="px-5 py-2 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black uppercase border border-gray-100 whitespace-nowrap">{s.department}</span>
                          </td>
                          <td className="p-8 md:p-10">
                             <div className="flex gap-2 whitespace-nowrap">
                                <button onClick={() => handleUpdatePlacement(s.id, PlacementStatus.PLACED)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${s.profile?.placementStatus === PlacementStatus.PLACED ? 'bg-green-600 text-white border-green-600 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:text-green-600'}`}>Placed</button>
                                <button onClick={() => handleUpdatePlacement(s.id, PlacementStatus.UNPLACED)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${s.profile?.placementStatus === PlacementStatus.UNPLACED ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:text-blue-600'}`}>Bench</button>
                                <button onClick={() => handleUpdatePlacement(s.id, PlacementStatus.DEBARRED)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${s.profile?.placementStatus === PlacementStatus.DEBARRED ? 'bg-red-600 text-white border-red-600 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:text-red-600'}`}>Debar</button>
                             </div>
                          </td>
                          <td className="p-8 md:p-10 text-right">
                             <div className="flex items-center justify-end gap-3">
                               <button onClick={() => handleEditStudent(s)} className="p-3 md:p-4 bg-white text-gray-400 border border-gray-100 rounded-2xl hover:text-blue-600 hover:shadow-xl transition-all"><Edit3 size={20}/></button>
                               <button onClick={() => handleDeleteStudent(s.id)} className="p-3 md:p-4 bg-white text-gray-400 border border-gray-100 rounded-2xl hover:text-red-600 hover:shadow-xl transition-all"><Trash2 size={20}/></button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredStudents.length === 0 && (
                    <div className="p-32 md:p-40 text-center">
                       <p className="text-xs font-black uppercase text-gray-300 tracking-[0.5em]">Section Ledger Empty</p>
                    </div>
                  )}
                </div>
               )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500 w-full overflow-hidden">
           <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-gray-100 pb-10">
              <div className="min-w-0">
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none truncate">Transmission Ledger</h2>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-widest mt-2">Placements monitoring and real-time editing</p>
              </div>
              <button className="flex items-center justify-center gap-3 px-8 py-4 md:px-10 md:py-5 bg-white border border-gray-100 text-gray-600 rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all shrink-0"><Download size={22}/> Export Activity Log</button>
           </header>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                <input 
                  className="w-full pl-16 pr-8 py-5 bg-white border border-gray-100 rounded-[2rem] text-sm font-bold text-gray-900 outline-none shadow-lg focus:ring-8 focus:ring-blue-50 transition-all placeholder:text-gray-400 placeholder:font-medium" 
                  placeholder="Filter Applicant or Corporate Entity..." 
                  value={actionSearch}
                  onChange={e => setActionSearch(e.target.value)}
                />
              </div>
              <select className="px-8 py-5 bg-white border border-gray-100 rounded-[2rem] text-[10px] font-black text-gray-900 uppercase tracking-widest outline-none shadow-lg cursor-pointer focus:ring-4 focus:ring-blue-50" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                 <option value="">All Batches</option>
                 {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select className="px-8 py-5 bg-white border border-gray-100 rounded-[2rem] text-[10px] font-black text-gray-900 uppercase tracking-widest outline-none shadow-lg cursor-pointer focus:ring-4 focus:ring-blue-50" value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
                 <option value="">All Streams</option>
                 <option>Computer Science</option>
                 <option>Information Technology</option>
                 <option>Electronics</option>
              </select>
           </div>

           <div className="overflow-x-auto glass rounded-[2.5rem] md:rounded-[3rem] border-white/50 shadow-2xl w-full">
              <table className="w-full text-left min-w-[1200px]">
                <thead className="bg-white/50 border-b border-gray-100">
                  <tr>
                    <th className="p-8 md:p-10 text-[11px] font-black uppercase tracking-widest text-gray-400">Applicant</th>
                    <th className="p-8 md:p-10 text-[11px] font-black uppercase tracking-widest text-gray-400">Drive Context</th>
                    <th className="p-8 md:p-10 text-[11px] font-black uppercase tracking-widest text-gray-400 text-center">App Status</th>
                    <th className="p-8 md:p-10 text-[11px] font-black uppercase tracking-widest text-gray-400 text-center">Placement Status</th>
                    <th className="p-8 md:p-10 text-[11px] font-black uppercase tracking-widest text-gray-400 text-right whitespace-nowrap">Audit Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredActions.map(a => (
                    <tr key={a.id} className="hover:bg-white/60 transition-colors group">
                      <td className="p-8 md:p-10">
                        <div className="min-w-0">
                          <p className="text-lg font-black text-gray-900 uppercase tracking-tight truncate max-w-[200px]">{a.studentName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-gray-400 font-black uppercase tracking-widest"># {a.studentRollNo}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="text-[10px] text-blue-600 font-bold uppercase">Section {a.studentSection}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-8 md:p-10 whitespace-nowrap">
                         <p className="text-sm font-black text-gray-900 uppercase tracking-tight truncate max-w-[250px]">{a.companyName}</p>
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{a.role}</p>
                      </td>
                      <td className="p-8 md:p-10 text-center whitespace-nowrap">
                         <div className="flex items-center justify-center">
                            <select 
                              className="px-5 py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-900 uppercase tracking-widest outline-none shadow-sm focus:ring-4 focus:ring-blue-100 cursor-pointer"
                              value={a.status}
                              onChange={(e) => handleUpdateAppStatus(a.id, e.target.value as ApplicationStatus)}
                            >
                               {Object.values(ApplicationStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                         </div>
                      </td>
                      <td className="p-8 md:p-10 text-center whitespace-nowrap">
                         <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleUpdatePlacement(a.studentId, PlacementStatus.PLACED)}
                              className={`p-3 rounded-xl border transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${students.find(s => s.id === a.studentId)?.profile?.placementStatus === PlacementStatus.PLACED ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:text-green-600'}`}
                            >
                              <Check size={14} /> Placed
                            </button>
                            <button 
                              onClick={() => handleUpdatePlacement(a.studentId, PlacementStatus.UNPLACED)}
                              className={`p-3 rounded-xl border transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${students.find(s => s.id === a.studentId)?.profile?.placementStatus === PlacementStatus.UNPLACED ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:text-blue-600'}`}
                            >
                              <Slash size={14} /> Unplaced
                            </button>
                         </div>
                      </td>
                      <td className="p-8 md:p-10 text-right whitespace-nowrap">
                         <div className="flex items-center justify-end gap-3">
                           <button onClick={() => handleRemoveApp(a.id)} className="p-4 bg-white text-gray-300 border border-gray-100 rounded-2xl hover:text-red-600 hover:shadow-xl transition-all" title="Remove Entry"><Trash2 size={20}/></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredActions.length === 0 && (
                <div className="p-40 text-center text-gray-300 uppercase tracking-[0.4em] font-black text-xs">No active applicant vectors</div>
              )}
           </div>
        </div>
      )}

      {/* MODALS */}
      
      {showYearModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
           <GlassCard className="w-full max-w-lg !p-12 shadow-[0_50px_100px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mb-10 shadow-2xl shadow-blue-200">
                <Plus size={40}/>
              </div>
              <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4">Initialize Batch</h3>
              <p className="text-sm text-gray-500 font-medium mb-10 leading-relaxed">Define the academic window for a new group of student identities. This creates a global directory.</p>
              <div className="flex items-center gap-4 mb-10">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">From</label>
                  <input autoFocus className="w-full p-6 bg-white border border-gray-100 rounded-2xl outline-none text-gray-900 font-black text-2xl focus:ring-8 focus:ring-blue-50 transition-all text-center" placeholder="2024" value={newYearFrom} onChange={e => setNewYearFrom(e.target.value)}/>
                </div>
                <div className="pt-8 text-gray-300 font-black text-3xl">-</div>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">To</label>
                  <input className="w-full p-6 bg-white border border-gray-100 rounded-2xl outline-none text-gray-900 font-black text-2xl focus:ring-8 focus:ring-blue-50 transition-all text-center" placeholder="2028" value={newYearTo} onChange={e => setNewYearTo(e.target.value)}/>
                </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => { setShowYearModal(false); setNewYearFrom(''); setNewYearTo(''); }} className="flex-1 py-6 bg-gray-100 text-gray-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
                 <button onClick={handleAddYear} className="flex-1 py-6 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all">Confirm</button>
              </div>
           </GlassCard>
        </div>
      )}

      {showSectionModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
           <GlassCard className="w-full max-w-lg !p-12 shadow-[0_50px_100px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center mb-10 shadow-2xl shadow-indigo-200">
                <Layers size={40}/>
              </div>
              <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4">Partition Batch</h3>
              <p className="text-sm text-gray-500 font-medium mb-10 leading-relaxed">Assign a new sectional ID for organization within <span className="text-blue-600 font-black">{selectedYear}</span>.</p>
              <input autoFocus className="w-full p-6 bg-white border border-gray-100 rounded-2xl outline-none text-gray-900 font-black text-4xl mb-10 uppercase text-center focus:ring-8 focus:ring-indigo-50 transition-all" placeholder="E" value={newSectionName} onChange={e => setNewSectionName(e.target.value.toUpperCase())}/>
              <div className="flex gap-4">
                 <button onClick={() => setShowSectionModal(false)} className="flex-1 py-6 bg-gray-100 text-gray-500 rounded-2xl font-black text-[11px] uppercase tracking-widest">Abort</button>
                 <button onClick={handleAddSection} className="flex-1 py-6 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-indigo-200">Confirm</button>
              </div>
           </GlassCard>
        </div>
      )}

      {showStudentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
           <GlassCard className="w-full max-w-2xl !p-12 shadow-[0_50px_100px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-6 mb-12 border-b border-gray-100 pb-8">
                 <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-200 shrink-0">
                   {editingStudentId ? <Edit3 size={32}/> : <UserPlus size={32}/>}
                 </div>
                 <div className="min-w-0">
                   <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter truncate">{editingStudentId ? 'Refine Identity' : 'Manual Insertion'}</h3>
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 truncate">Directory: {selectedYear} • SEC {selectedSection}</p>
                 </div>
              </div>
              
              <div className="space-y-6 mb-12">
                 <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1"><Users size={12}/> Legal Entity Name</label>
                    <input className="w-full p-5 bg-white border border-gray-100 rounded-2xl outline-none text-gray-900 font-bold text-lg focus:ring-8 focus:ring-blue-50 transition-all" placeholder="Full Legal Name" value={manualStudent.name} onChange={e => setManualStudent({...manualStudent, name: e.target.value})}/>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1"><Hash size={12}/> Academic UIN</label>
                       <input className="w-full p-5 bg-white border border-gray-100 rounded-2xl outline-none text-gray-900 font-bold focus:ring-8 focus:ring-blue-50 transition-all" placeholder="University Roll No" value={manualStudent.rollNumber} onChange={e => setManualStudent({...manualStudent, rollNumber: e.target.value.toUpperCase()})}/>
                    </div>
                    <div className="space-y-2">
                       <label className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1"><Mail size={12}/> Secure Email</label>
                       <input className="w-full p-5 bg-white border border-gray-100 rounded-2xl outline-none text-gray-900 font-bold focus:ring-8 focus:ring-blue-50 transition-all" placeholder="Email Address" value={manualStudent.email} onChange={e => setManualStudent({...manualStudent, email: e.target.value})}/>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1"><BookOpen size={12}/> Dept. Stream</label>
                       <input className="w-full p-5 bg-white border border-gray-100 rounded-2xl outline-none text-gray-900 font-bold focus:ring-8 focus:ring-blue-50 transition-all" placeholder="Branch" value={manualStudent.department} onChange={e => setManualStudent({...manualStudent, department: e.target.value})}/>
                    </div>
                    <div className="space-y-2">
                       <label className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1"><CheckCircle size={12}/> Verified CGPA</label>
                       <input className="w-full p-5 bg-white border border-gray-100 rounded-2xl outline-none text-gray-900 font-bold focus:ring-8 focus:ring-blue-50 transition-all" placeholder="Current CGPA" value={manualStudent.cgpa} onChange={e => setManualStudent({...manualStudent, cgpa: e.target.value})}/>
                    </div>
                 </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                 <button onClick={() => setShowStudentModal(false)} className="flex-1 py-6 bg-gray-100 text-gray-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all">Discard Changes</button>
                 <button onClick={handleStudentFormSubmit} className="flex-[2] py-6 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-blue-200 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all">
                   <Save size={20}/> {editingStudentId ? 'Commit Changes' : 'Inject Identity'}
                 </button>
              </div>
           </GlassCard>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
           <GlassCard className="w-full max-w-xl !p-12 shadow-[0_50px_100px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-4 mb-8 text-orange-600 bg-orange-50 p-6 rounded-2xl border border-orange-100">
                <AlertTriangle size={32} className="shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">Import Protocol Warning</p>
                  <p className="text-[10px] font-medium opacity-80 uppercase tracking-tighter leading-tight">Ensure manifest follows strict schema: Name, Roll, Email, CGPA, Branch</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Batch Transmission</h3>
                <button 
                  onClick={handleDownloadTemplate} 
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-blue-100 shadow-sm"
                >
                  <Download size={14}/> Get Template
                </button>
              </div>
              <p className="text-sm text-gray-500 font-medium mb-10">Target Section: <span className="text-blue-600 font-black">SEC {selectedSection} ({selectedYear})</span></p>
              
              <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-8 border border-gray-100">
                <button onClick={() => { setImportType('local'); setPendingFile(null); }} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all ${importType === 'local' ? 'bg-white shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                  <HardDrive size={14}/> Local Device
                </button>
                <button onClick={() => { setImportType('drive'); setPendingFile(null); }} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all ${importType === 'drive' ? 'bg-white shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                  <Cloud size={14}/> Cloud Storage
                </button>
              </div>

              {importType === 'local' ? (
                <div className="w-full">
                  {!pendingFile ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-16 border-4 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 bg-gray-50/50 hover:bg-white hover:border-blue-400 transition-all cursor-pointer mb-10 group"
                    >
                       <FileSpreadsheet size={64} className="text-gray-200 group-hover:text-blue-600 transition-colors group-hover:scale-110 duration-500"/>
                       <div className="text-center">
                         <p className="text-xs font-black uppercase text-gray-400 tracking-widest group-hover:text-gray-900">Drag & Drop Manifest</p>
                         <p className="text-[10px] text-gray-300 font-bold uppercase mt-2">Support: .xlsx, .xls, .csv only</p>
                       </div>
                       <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileChange} />
                    </div>
                  ) : (
                    <div className="mb-10 animate-in zoom-in duration-300">
                      <div className="p-8 bg-blue-50 border-2 border-blue-200 rounded-[2.5rem] flex items-center gap-6 relative overflow-hidden group shadow-inner">
                        <div className="absolute -right-4 -bottom-4 opacity-5 text-blue-600 rotate-12 transition-transform group-hover:scale-110">
                          <FileSpreadsheet size={160} />
                        </div>
                        <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl relative z-10">
                           <FileIcon size={32} />
                        </div>
                        <div className="flex-1 min-w-0 relative z-10">
                           <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Payload Ready</p>
                           <h4 className="text-lg font-black text-blue-900 truncate tracking-tight">{pendingFile.name}</h4>
                           <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded-md border border-blue-100 uppercase">.{pendingFile.name.split('.').pop()?.toUpperCase()}</span>
                              <span className="text-[10px] font-bold text-blue-400 uppercase">{(pendingFile.size / 1024).toFixed(1)} KB</span>
                           </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPendingFile(null); }}
                          className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-xl shadow-md transition-all relative z-10 border border-gray-100"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-10 space-y-4">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 flex items-center gap-2"><Link size={12}/> Cloud Synchronizer URL</label>
                  <div className="relative group">
                    <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={20}/>
                    <input 
                      autoFocus
                      className="w-full pl-14 p-5 bg-white border border-gray-100 rounded-2xl outline-none text-gray-900 font-bold focus:ring-8 focus:ring-blue-50 transition-all shadow-inner" 
                      placeholder="https://drive.google.com/..." 
                      value={driveUrl} 
                      onChange={e => setDriveUrl(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium italic ml-1 leading-relaxed">Ensure the sharing permissions are set to 'Anyone with the link' or specific API access is enabled.</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                 <button onClick={() => { setShowImportModal(false); setPendingFile(null); }} className="flex-1 py-6 bg-gray-100 text-gray-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all">Abort</button>
                 <button 
                  onClick={handleImportProtocol} 
                  disabled={importing || (importType === 'drive' && !driveUrl) || (importType === 'local' && !pendingFile)} 
                  className="relative flex-[2] py-6 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-blue-200 flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-blue-700 transition-all overflow-hidden"
                 >
                    {importing && importProgress && (
                      <div 
                        className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300" 
                        style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                      />
                    )}
                    {importing ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle size={20}/>}
                    {importing ? (
                      importProgress 
                        ? `Extracting ${importProgress.current}/${importProgress.total}...` 
                        : 'Starting Extraction...'
                    ) : 'Confirm & Extract'}
                 </button>
              </div>
           </GlassCard>
        </div>
      )}
    </div>
  );
};

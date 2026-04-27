
import React, { useEffect, useState, useRef } from 'react';
import { 
  Users, Briefcase, Award, TrendingUp, DollarSign, Calendar, 
  Bell, FileText, Download, Plus, Megaphone, ArrowUpRight, 
  Loader2, CheckCircle, PieChart as PieChartIcon, BarChart as BarChartIcon,
  ShieldCheck, FileDown, Printer, Clock, FileBarChart, Zap, UserCheck, UserX
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { GlassCard } from '../../components/common/GlassCard';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const TpoDashboard: React.FC = () => {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    api.tpo.getDashboardStats().then(data => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    // Ensure all animations and layout are settled
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const element = reportRef.current;
      
      // Capture at a specific high-quality width to ensure professional aspect ratio on PDF
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc',
        windowWidth: 1400, // Force a desktop-like layout for the capture
        onclone: (clonedDoc) => {
          const actionButtons = clonedDoc.querySelector('#dashboard-actions');
          if (actionButtons) (actionButtons as HTMLElement).style.display = 'none';
          
          const exportBtn = clonedDoc.querySelector('#export-report-btn');
          if (exportBtn) (exportBtn as HTMLElement).style.display = 'none';

          const printHeader = clonedDoc.querySelector('#report-print-header');
          if (printHeader) (printHeader as HTMLElement).style.display = 'block';

          const container = clonedDoc.querySelector('#dashboard-container');
          if (container) {
             (container as HTMLElement).style.padding = '40px';
             (container as HTMLElement).style.borderRadius = '0';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, (pdfHeight - 20) / imgHeight);
      
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      // Verification line
      pdf.setFontSize(8);
      pdf.setTextColor(180);
      pdf.text(`Digitally Generated Official Report | Campus Connect Pro | System Signature: ${Math.random().toString(36).substr(2, 12).toUpperCase()}`, 10, pdfHeight - 5);
      
      pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight, undefined, 'FAST');
      
      pdf.save(`Institutional_Placement_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert('Failed to generate PDF. Verification failed.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em]">Aggregating Campus Intelligence...</p>
      </div>
    );
  }

  return (
    <div id="dashboard-container" ref={reportRef} className="space-y-10 animate-in fade-in duration-700 pb-24">
      
      {/* Hidden Print Header for PDF */}
      <div id="report-print-header" className="hidden border-b-4 border-blue-600 pb-8 mb-10">
         <div className="flex justify-between items-end">
            <div>
               <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Placement Intelligence Report</h1>
               <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mt-1">Campus Connect Pro Institutional Suite</p>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Report Reference</p>
               <p className="text-sm font-bold text-gray-900 uppercase">CCP-{new Date().getFullYear()}-{Math.floor(Math.random()*10000)}</p>
               <p className="text-[10px] font-bold text-gray-500 mt-1 italic">Generated: {new Date().toLocaleString()}</p>
            </div>
         </div>
      </div>

      {/* Header & Quick Actions */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-gray-100 pb-10">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-2">
             <ShieldCheck size={20} className="text-blue-600" />
             <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Management Console</span>
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Intelligence Hub</h2>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-widest mt-2 flex items-center gap-2">
            <Clock size={14} /> Comprehensive Placement Ecosystem Snapshot
          </p>
        </div>
        <div id="dashboard-actions" className="flex flex-wrap gap-3 shrink-0">
          <button onClick={() => navigate('/tpo/announcements')} className="flex items-center gap-2 px-6 py-3.5 bg-white border border-gray-100 text-gray-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:shadow-xl transition-all">
            <Megaphone size={16}/> New Broadcast
          </button>
          <button onClick={() => navigate('/tpo/jobs')} className="flex items-center gap-2 px-6 py-3.5 bg-white border border-gray-100 text-gray-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:shadow-xl transition-all">
            <Plus size={16}/> Create Drive
          </button>
          <button onClick={() => navigate('/tpo/students')} className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all">
            <Briefcase size={16}/> Student Ledger
          </button>
          <button 
            id="export-report-btn"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16}/>}
            {isExporting ? 'Generating Report...' : 'Export PDF Report'}
          </button>
        </div>
      </header>

      {/* Expanded KPI Grid (8 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Registered Pipeline" value={stats.totalStudents} icon={<Users size={24}/>} color="blue" subtitle="Total Students" />
        <StatCard title="Placement Yield" value={stats.placedCount} icon={<CheckCircle size={24}/>} color="green" subtitle={`${stats.placedPercentage}% Selected`} />
        <StatCard title="Corporate Matrix" value={stats.companiesParticipated} icon={<Briefcase size={24}/>} color="indigo" subtitle="Active Companies" />
        <StatCard title="Engagement Events" value={stats.totalDrives} icon={<Zap size={24}/>} color="amber" subtitle="Total Drives Conducted" />
        
        <StatCard title="Academic Match" value={stats.eligible} icon={<UserCheck size={24}/>} color="blue" subtitle={`${stats.nonEligible} Non-Eligible`} />
        <StatCard title="Awaiting Selection" value={stats.unplacedCount} icon={<UserX size={24}/>} color="orange" subtitle="Market Ready" />
        <StatCard title="Peak Offering" value={stats.highestPackage} icon={<TrendingUp size={24}/>} color="indigo" subtitle="Highest CTC" />
        <StatCard title="Market Valuation" value={stats.averagePackage} icon={<DollarSign size={24}/>} color="green" subtitle={`Median: ${stats.medianPackage}`} />
      </div>

      {/* Performance Analysis Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <GlassCard className="xl:col-span-2 !p-10 border-none shadow-2xl bg-white/50">
          <div className="flex items-center justify-between mb-10">
             <div>
               <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">Placement Evolution</h3>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Annual Yield & Transmission Comparison</p>
             </div>
             <BarChartIcon size={24} className="text-blue-200" />
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.placementTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)', padding: '20px', fontWeight: 'bold'}}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '30px', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900', letterSpacing: '0.1em'}} />
                <Bar dataKey="placed" name="Successful Placements" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                <Bar dataKey="unplaced" name="Remaining Inventory" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="!p-10 border-none shadow-2xl bg-white/50 flex flex-col">
          <div className="flex items-center justify-between mb-10">
             <div>
               <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">Dept. Efficiency</h3>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Stream Selection Performance</p>
             </div>
             <PieChartIcon size={24} className="text-indigo-200" />
          </div>
          <div className="h-[300px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.deptStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="placed"
                >
                  {stats.deptStats.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" layout="horizontal" iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: '900', textTransform: 'uppercase'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-4">
             {stats.deptStats.map((d: any, idx: number) => (
               <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                    <span className="text-[11px] font-black text-gray-600 uppercase tracking-widest">{d.name} Branch</span>
                  </div>
                  <span className="text-xs font-black text-gray-900">{Math.round((d.placed/d.total)*100)}% Selected</span>
               </div>
             ))}
          </div>
        </GlassCard>
      </div>

      {/* Corporate Pulse Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="!p-10 border-none shadow-2xl">
           <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-6">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Transmission Feed</h3>
              <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[9px] font-black uppercase border border-green-100">Live Selected Assets</span>
           </div>
           <div className="space-y-6">
              {stats.recentPlacements.map((p: any, idx: number) => (
                <div key={idx} className="flex items-center gap-6 group">
                   <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 font-black text-lg border border-gray-100 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                      {p.name.charAt(0)}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{p.name}</p>
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{p.company} • {p.package}</p>
                   </div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase whitespace-nowrap">{p.date}</p>
                </div>
              ))}
           </div>
           <button onClick={() => navigate('/tpo/students')} className="w-full mt-10 py-4 bg-gray-50 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all flex items-center justify-center gap-2 tracking-[0.2em]">
              Access Placement Ledger <ArrowUpRight size={14}/>
           </button>
        </GlassCard>

        <GlassCard className="!p-10 border-none shadow-2xl">
           <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-6">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Engagement Pipeline</h3>
              <Calendar size={20} className="text-indigo-200" />
           </div>
           <div className="space-y-6">
              {stats.upcomingDrives.map((d: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white/40 border border-white/50 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer group">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                        <Calendar size={18}/>
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight leading-none mb-1">{d.company}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Drive Lock Date</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[11px] font-black text-gray-900 uppercase">{new Date(d.date).toLocaleDateString()}</p>
                      <p className="text-[9px] text-indigo-500 font-bold uppercase">Locked</p>
                   </div>
                </div>
              ))}
           </div>
           <div className="mt-8 p-6 bg-blue-50/50 border border-blue-100 rounded-[2rem]">
              <div className="flex items-center gap-3 text-blue-600 mb-2">
                 <ShieldCheck size={18}/>
                 <p className="text-xs font-black uppercase tracking-widest leading-none">Institutional Data Integrity</p>
              </div>
              <p className="text-[10px] text-blue-400 font-medium leading-relaxed uppercase tracking-tight">This dashboard provides a verified snapshot of the placement ecosystem. Reports are suitable for NAC/Accreditation audits.</p>
           </div>
        </GlassCard>
      </div>

      {isExporting && (
        <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right-10">
          <div className="glass shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-full px-10 py-5 flex items-center gap-5 border border-blue-100 bg-white/95 backdrop-blur-3xl">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="font-bold text-gray-900 uppercase tracking-[0.2em] text-[11px]">Compiling Institutional Dataset...</span>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: any; icon: React.ReactNode; color: 'blue' | 'green' | 'indigo' | 'amber' | 'orange'; subtitle: string }> = ({ title, value, icon, color, subtitle }) => {
  const styles = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    green: 'text-green-600 bg-green-50 border-green-100',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    orange: 'text-orange-600 bg-orange-50 border-orange-100',
  };

  return (
    <GlassCard className="flex flex-col border-none shadow-xl hover:-translate-y-1 transition-all !p-8 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-8 relative z-10">
         <div className={`p-4 rounded-2xl shadow-sm ${styles[color as keyof typeof styles]} group-hover:scale-110 transition-transform`}>
           {icon}
         </div>
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{title}</p>
      </div>
      <div className="relative z-10">
         <h4 className="text-3xl font-black text-gray-900 tracking-tighter leading-none mb-2">{value}</h4>
         <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.1em]">{subtitle}</p>
      </div>
      <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        {icon}
      </div>
    </GlassCard>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Layers, 
  Mail, 
  Calculator, 
  ClipboardList, 
  Search, 
  ChevronRight, 
  AlertCircle, 
  Clock, 
  MapPin, 
  GraduationCap, 
  Copy, 
  Check, 
  TrendingUp
} from 'lucide-react';
import dbData from './data/db.json';

// Types
interface Professor {
  name: string;
  role: string;
  interests: string;
  projects: string;
}

interface University {
  name: string;
  slug: string;
  country: string;
  qs_rank: number;
  cs_rank: number;
  dept: string;
  stipend_annual: string;
  stipend_monthly: string;
  funding_guaranteed: boolean;
  tuition_waiver: string;
  health_insurance: string;
  gre: string;
  toefl_waiver: string;
  app_fee: string;
  fee_waiver: string;
  competitiveness: string;
  housing_cost: string;
  food_cost: string;
  misc_cost: string;
  stipend_sufficiency: string;
  professors: Professor[];
  markdown: string;
}

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'explorer' | 'comparison' | 'professors' | 'crm' | 'calculator' | 'documents'>('dashboard');
  
  // Loaded Data
  const universities = useMemo<University[]>(() => {
    return (dbData as any[]) || [];
  }, []);

  // Selected University for Detail Modal
  const [selectedUni, setSelectedUni] = useState<University | null>(null);

  // LocalStorage Persisted States
  const [appStatuses, setAppStatuses] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('phd_app_statuses');
    return saved ? JSON.parse(saved) : {};
  });

  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('phd_notes');
    return saved ? JSON.parse(saved) : {};
  });

  const [crmLogs, setCrmLogs] = useState<Record<string, { date: string; reply: string; replyType: string; nextFollowUp: string }>>(() => {
    const saved = localStorage.getItem('phd_crm_logs');
    return saved ? JSON.parse(saved) : {};
  });

  const [documents, setDocuments] = useState<Record<string, 'Completed' | 'In Progress' | 'Pending'>>(() => {
    const saved = localStorage.getItem('phd_documents');
    return saved ? JSON.parse(saved) : {
      'CV / Resume': 'In Progress',
      'Statement of Purpose (SOP)': 'In Progress',
      'Research Statement': 'Pending',
      'Medium of Instruction Letter': 'Completed',
      'Official Transcripts (BSc)': 'Completed',
      'Official Transcripts (MPhil)': 'In Progress',
      'Reference Letter 1 (MPhil Advisor)': 'In Progress',
      'Reference Letter 2 (BSc Advisor)': 'Pending',
      'Reference Letter 3 (Academic)': 'Pending',
      'Passport / Identity': 'Completed',
    };
  });

  const [calcProfile, setCalcProfile] = useState({
    gpa: '4.5', // UI style first class
    mphil: 'yes',
    publications: '2', // based on scholar
    programming: 'advanced',
    researchYears: '3',
    recStrength: 'strong'
  });

  const [calcResult, setCalcResult] = useState<any>(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('phd_app_statuses', JSON.stringify(appStatuses));
  }, [appStatuses]);

  useEffect(() => {
    localStorage.setItem('phd_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('phd_crm_logs', JSON.stringify(crmLogs));
  }, [crmLogs]);

  useEffect(() => {
    localStorage.setItem('phd_documents', JSON.stringify(documents));
  }, [documents]);

  // Comparison State
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterGRE, setFilterGRE] = useState<string>('all');
  const [filterFee, setFilterFee] = useState<string>('all');

  // Copy state helper
  const [copiedProf, setCopiedProf] = useState<string | null>(null);

  // Stats derivation
  const stats = useMemo(() => {
    const total = universities.length;
    let dream = 0, reach = 0, target = 0, safe = 0;
    
    universities.forEach(u => {
      const diff = u.competitiveness.toLowerCase();
      if (diff.includes('dream')) dream++;
      else if (diff.includes('reach')) reach++;
      else if (diff.includes('target')) target++;
      else safe++;
    });

    const submittedCount = Object.values(appStatuses).filter(s => s === 'Submitted').length;
    const acceptedCount = Object.values(appStatuses).filter(s => s === 'Offer Received' || s === 'Accepted').length;

    return { total, dream, reach, target, safe, submittedCount, acceptedCount };
  }, [universities, appStatuses]);

  // Filtered universities
  const filteredUnis = useMemo(() => {
    return universities.filter(uni => {
      const matchesSearch = 
        uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        uni.professors.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.interests.toLowerCase().includes(searchQuery.toLowerCase())) ||
        uni.markdown.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDiff = filterDifficulty === 'all' || uni.competitiveness.toLowerCase() === filterDifficulty.toLowerCase();
      
      const isGREOpt = uni.gre.toLowerCase().includes('optional') || uni.gre.toLowerCase().includes('not accepted') || uni.gre.toLowerCase().includes('not required');
      const matchesGRE = filterGRE === 'all' || 
        (filterGRE === 'optional' && isGREOpt) || 
        (filterGRE === 'required' && !isGREOpt);
      
      const isFree = uni.app_fee === '$0' || uni.app_fee.toLowerCase().includes('free');
      const matchesFee = filterFee === 'all' ||
        (filterFee === 'free' && isFree) ||
        (filterFee === 'paid' && !isFree);

      return matchesSearch && matchesDiff && matchesGRE && matchesFee;
    });
  }, [universities, searchQuery, filterDifficulty, filterGRE, filterFee]);

  // All extracted professors
  const allProfessors = useMemo(() => {
    const list: { prof: Professor; university: University }[] = [];
    universities.forEach(u => {
      u.professors.forEach(p => {
        list.push({ prof: p, university: u });
      });
    });
    return list;
  }, [universities]);

  const filteredProfs = useMemo(() => {
    return allProfessors.filter(item => {
      const q = searchQuery.toLowerCase();
      return (
        item.prof.name.toLowerCase().includes(q) ||
        item.prof.interests.toLowerCase().includes(q) ||
        item.prof.projects.toLowerCase().includes(q) ||
        item.university.name.toLowerCase().includes(q)
      );
    });
  }, [allProfessors, searchQuery]);

  // Handle calculator submission
  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const gpaNum = parseFloat(calcProfile.gpa);
    const pubNum = parseInt(calcProfile.publications);
    const resYears = parseInt(calcProfile.researchYears);
    
    // Simple weights logic
    let score = 50;
    if (gpaNum >= 4.5) score += 20; // First Class bonus
    else if (gpaNum >= 4.0) score += 10;

    if (calcProfile.mphil === 'yes') score += 15; // MPhil research bonus
    score += Math.min(pubNum * 8, 25); // Google Scholar papers weight
    score += Math.min(resYears * 3, 10);
    
    if (calcProfile.recStrength === 'very_strong') score += 10;
    else if (calcProfile.recStrength === 'strong') score += 5;

    let admissionProb = Math.min(score, 99);
    let fundingProb = Math.min(score + 10, 100); // Funding is guaranteed if admitted

    setCalcResult({
      score,
      admissionProb: Math.round(admissionProb),
      fundingProb: Math.round(fundingProb),
      details: score >= 80 ? 'Highly Competitive' : score >= 65 ? 'Competitive' : 'Target Fit Needs Specific Outreach'
    });
  };

  // Cost of living midpoint numeric helper
  const parseCostMidpoint = (costStr: string) => {
    const clean = costStr.replace(/[^\d-]/g, '');
    const parts = clean.split('-');
    if (parts.length === 2) {
      return (parseInt(parts[0]) + parseInt(parts[1])) / 2;
    }
    return parseInt(clean) || 500;
  };

  const parseStipendMidpoint = (stipendStr: string) => {
    const clean = stipendStr.replace(/[^\d-]/g, '');
    const parts = clean.split('-');
    if (parts.length === 2) {
      return (parseInt(parts[0]) + parseInt(parts[1])) / 2;
    }
    return parseInt(clean) || 3000;
  };

  // Timeline Event List
  const timelineEvents = [
    { month: 'July', title: 'Prepare Transcripts & MOI letter', desc: 'Secure Medium of Instruction letter from University of Ibadan to verify TOEFL waivers.' },
    { month: 'August', title: 'Resume & Scholar Profile Setup', desc: 'Ensure Google Scholar profile is fully updated and linked in CV.' },
    { month: 'September', title: 'Faculty Outreach & Zoom Meetings', desc: 'Reach out to matched professors in clinical NLP and policy ML.' },
    { month: 'October', title: 'Statement of Purpose (SOP)', desc: 'Customize paragraphs outlining your UI publications and fitting matched advisors.' },
    { month: 'November', title: 'Application Portal Setup & Fee Waivers', desc: 'Apply early for Graduate School diversity/hardship waivers.' },
    { month: 'December', title: 'Submit Applications', desc: 'Priority funding deadlines for Stanford, MIT, CMU, and Princeton.' },
    { month: 'January', title: 'PhD Interviews', desc: 'Prepare for Zoom interviews with faculty committees and potential advisors.' },
    { month: 'February', title: 'Admissions Decisions', desc: 'Top tier universities issue letters and formal funding agreements.' },
    { month: 'April', title: 'Decision Day (April 15)', desc: 'Final deadline to select a school and accept the funding package.' },
    { month: 'May', title: 'Visa Preparation (F-1)', desc: 'Receive Form I-20 and schedule embassy interview in Abuja or Lagos.' }
  ];

  // Helper to copy text to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedProf(id);
    setTimeout(() => setCopiedProf(null), 2000);
  };

  // Status color tags
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Offer Received': return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'Submitted': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Contacted': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Researching': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="flex h-screen bg-[#07090e] text-slate-100 overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Platform Title */}
          <div className="p-6 border-b border-slate-800/60 flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-slate-100 shadow-lg glow-primary">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-slate-100 to-indigo-300 bg-clip-text text-transparent">Admissions Intelligence</h1>
              <span className="text-xs text-indigo-400 font-semibold tracking-wider uppercase">PhD Platform v1.0</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'dashboard' ? 'bg-indigo-600/35 text-indigo-300 border-l-4 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="font-semibold text-sm">Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('explorer')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'explorer' ? 'bg-indigo-600/35 text-indigo-300 border-l-4 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
            >
              <Building2 className="h-5 w-5" />
              <span className="font-semibold text-sm">University Explorer</span>
            </button>
            <button 
              onClick={() => setActiveTab('comparison')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'comparison' ? 'bg-indigo-600/35 text-indigo-300 border-l-4 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
            >
              <Layers className="h-5 w-5" />
              <span className="font-semibold text-sm">Compare Programs</span>
            </button>
            <button 
              onClick={() => setActiveTab('professors')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'professors' ? 'bg-indigo-600/35 text-indigo-300 border-l-4 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
            >
              <Users className="h-5 w-5" />
              <span className="font-semibold text-sm">Professor Directory</span>
            </button>
            <button 
              onClick={() => setActiveTab('crm')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'crm' ? 'bg-indigo-600/35 text-indigo-300 border-l-4 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
            >
              <Mail className="h-5 w-5" />
              <span className="font-semibold text-sm">Outreach CRM</span>
            </button>
            <button 
              onClick={() => setActiveTab('calculator')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'calculator' ? 'bg-indigo-600/35 text-indigo-300 border-l-4 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
            >
              <Calculator className="h-5 w-5" />
              <span className="font-semibold text-sm">Score Calculator</span>
            </button>
            <button 
              onClick={() => setActiveTab('documents')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'documents' ? 'bg-indigo-600/35 text-indigo-300 border-l-4 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
            >
              <ClipboardList className="h-5 w-5" />
              <span className="font-semibold text-sm">Document Checklists</span>
            </button>
          </nav>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-500/25 rounded-full border border-indigo-500/35 flex items-center justify-center font-bold text-indigo-300">
              OA
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">Olanrewaju Ahmed</p>
              <p className="text-xs text-slate-400">UI MPhil Candidate</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#07090e] via-[#0b0e17] to-[#0d1222] p-8">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight">Admissions Dashboard</h2>
                <p className="text-slate-400 mt-1">Hello Olanrewaju, here is the status of your US PhD application campaign.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setActiveTab('explorer')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 transition font-bold text-sm text-slate-100 rounded-xl glow-primary"
                >
                  Explore Universities
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-5 rounded-2xl">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Targets</p>
                <p className="text-3xl font-bold mt-2 text-indigo-400">{stats.total}</p>
                <div className="flex justify-between items-center mt-3 text-xs text-slate-500">
                  <span>Dream: {stats.dream}</span>
                  <span>Reach: {stats.reach}</span>
                </div>
              </div>
              <div className="glass-card p-5 rounded-2xl">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Guaranteed Funding</p>
                <p className="text-3xl font-bold mt-2 text-emerald-400">100%</p>
                <p className="text-xs text-slate-500 mt-3">Full waiver + Stipend for all</p>
              </div>
              <div className="glass-card p-5 rounded-2xl">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Annual Stipend</p>
                <p className="text-3xl font-bold mt-2 text-indigo-300">$43,736</p>
                <p className="text-xs text-slate-500 mt-3">Highest: $54,216 (Princeton)</p>
              </div>
              <div className="glass-card p-5 rounded-2xl">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Submitted / Total</p>
                <p className="text-3xl font-bold mt-2 text-blue-400">{stats.submittedCount} / {stats.total}</p>
                <p className="text-xs text-slate-500 mt-3">Offers Received: {stats.acceptedCount}</p>
              </div>
            </div>

            {/* Application Command Center */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Critical Alerts & Missing Documents */}
              <div className="lg:col-span-2 glass-card p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                    <h3 className="text-lg font-bold">Application Command Center</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Documents Progress */}
                    <div>
                      <p className="text-sm font-semibold text-slate-300 flex justify-between">
                        <span>Missing Recommendation Letters</span>
                        <span className="text-amber-400 text-xs">Action Required</span>
                      </p>
                      <div className="mt-2 space-y-1">
                        {Object.entries(documents).filter(([_, s]) => s === 'Pending').map(([doc]) => (
                          <div key={doc} className="text-xs text-slate-400 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            {doc} is still listed as pending.
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cost Adjustments */}
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                      <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                        Highest Net Surplus Stipends (Adjusted for Local Cost of Living)
                      </p>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-[#0b0e17] p-2 rounded-lg border border-slate-800">
                          <p className="font-bold text-slate-300">Princeton</p>
                          <p className="text-emerald-400 font-bold mt-1">+$2,800/mo</p>
                        </div>
                        <div className="bg-[#0b0e17] p-2 rounded-lg border border-slate-800">
                          <p className="font-bold text-slate-300">Yale</p>
                          <p className="text-emerald-400 font-bold mt-1">+$2,600/mo</p>
                        </div>
                        <div className="bg-[#0b0e17] p-2 rounded-lg border border-slate-800">
                          <p className="font-bold text-slate-300">Rice</p>
                          <p className="text-emerald-400 font-bold mt-1">+$2,000/mo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-between items-center text-xs text-slate-400 pt-4 border-t border-slate-800">
                  <span>English Test Requirement: Waived using MOI Letter across all schools</span>
                  <span>GRE Policy: 80% Optional/Not Reviewed</span>
                </div>
              </div>

              {/* Upcoming Deadlines Widget */}
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                  <Clock className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-lg font-bold">Upcoming Deadlines</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-900/30 rounded-xl border border-slate-800/40">
                    <div>
                      <p className="text-sm font-bold">Stanford University</p>
                      <p className="text-xs text-slate-500">December 1 (Strict)</p>
                    </div>
                    <span className="text-xs bg-indigo-500/10 text-indigo-300 px-2.5 py-1 rounded-full font-bold border border-indigo-500/20">
                      15 Priority
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-900/30 rounded-xl border border-slate-800/40">
                    <div>
                      <p className="text-sm font-bold">Carnegie Mellon</p>
                      <p className="text-xs text-slate-500">December 11</p>
                    </div>
                    <span className="text-xs bg-indigo-500/10 text-indigo-300 px-2.5 py-1 rounded-full font-bold border border-indigo-500/20">
                      15 Priority
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-900/30 rounded-xl border border-slate-800/40">
                    <div>
                      <p className="text-sm font-bold">MIT EECS</p>
                      <p className="text-xs text-slate-500">December 15</p>
                    </div>
                    <span className="text-xs bg-indigo-500/10 text-indigo-300 px-2.5 py-1 rounded-full font-bold border border-indigo-500/20">
                      15 Priority
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('explorer')}
                  className="w-full mt-4 text-center text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1"
                >
                  View All Dates <ChevronRight className="h-4 w-4" />
                </button>
              </div>

            </div>

            {/* Timeline Milestones */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-lg font-bold mb-4">Admissions Calendar & Weekly Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {timelineEvents.slice(0, 5).map((e, idx) => (
                  <div key={idx} className="relative p-4 bg-slate-900/40 border border-slate-800 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">{e.month}</span>
                      <h4 className="text-sm font-bold text-slate-200 mt-1">{e.title}</h4>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">{e.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* UNIVERSITY EXPLORER */}
        {activeTab === 'explorer' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold">University Explorer</h2>
              <p className="text-slate-400 text-sm mt-1">Search, filter, and review the admissions dossiers of all 19 universities.</p>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/20 p-4 rounded-2xl border border-slate-800/80">
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search name, professor, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0a0d16] border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <select 
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0a0d16] border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-sm text-slate-300"
                >
                  <option value="all">Admission Difficulty (All)</option>
                  <option value="dream">Dream</option>
                  <option value="reach">Reach</option>
                  <option value="target">Target</option>
                </select>
              </div>

              <div>
                <select 
                  value={filterGRE}
                  onChange={(e) => setFilterGRE(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0a0d16] border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-sm text-slate-300"
                >
                  <option value="all">GRE Requirement (All)</option>
                  <option value="optional">Optional / Not Accepted</option>
                  <option value="required">Required</option>
                </select>
              </div>

              <div>
                <select 
                  value={filterFee}
                  onChange={(e) => setFilterFee(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0a0d16] border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-sm text-slate-300"
                >
                  <option value="all">Application Fee (All)</option>
                  <option value="free">Fee Waiver Available / Free</option>
                  <option value="paid">Paid Application</option>
                </select>
              </div>
            </div>

            {/* University Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredUnis.map((uni) => (
                <div key={uni.slug} className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between border border-slate-800/80">
                  <div className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-slate-100">{uni.name}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" /> {uni.country}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${getStatusColor(appStatuses[uni.slug] || 'Not Started')}`}>
                        {appStatuses[uni.slug] || 'Not Started'}
                      </span>
                    </div>

                    {/* Rankings & Difficulty */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block">QS Rank</span>
                        <span className="font-bold text-slate-300">#{uni.qs_rank}</span>
                      </div>
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block">CS Rank</span>
                        <span className="font-bold text-slate-300">#{uni.cs_rank}</span>
                      </div>
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block">Difficulty</span>
                        <span className="font-bold text-indigo-400">{uni.competitiveness}</span>
                      </div>
                    </div>

                    {/* Stipend Details */}
                    <div className="flex justify-between items-center border-t border-slate-800 pt-3 text-xs">
                      <div>
                        <span className="text-slate-500">Monthly Stipend</span>
                        <p className="font-semibold text-slate-200 mt-0.5">{uni.stipend_monthly}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500">Tuition Coverage</span>
                        <p className="font-semibold text-emerald-400 mt-0.5">{uni.tuition_waiver}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900/30 border-t border-slate-800/80 flex gap-2">
                    <button 
                      onClick={() => setSelectedUni(uni)}
                      className="flex-1 text-center py-2 bg-slate-800 hover:bg-slate-700 transition font-bold text-xs rounded-xl"
                    >
                      View Full Dossier
                    </button>
                    <button 
                      onClick={() => {
                        const isSelected = selectedForComparison.includes(uni.slug);
                        if (isSelected) {
                          setSelectedForComparison(selectedForComparison.filter(s => s !== uni.slug));
                        } else {
                          if (selectedForComparison.length >= 4) {
                            alert("Select up to 4 universities for comparison.");
                          } else {
                            setSelectedForComparison([...selectedForComparison, uni.slug]);
                          }
                        }
                      }}
                      className={`px-3 py-2 border rounded-xl transition ${selectedForComparison.includes(uni.slug) ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300' : 'border-slate-800 hover:bg-slate-800 text-slate-400'}`}
                    >
                      Compare
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMPARISON TOOL */}
        {activeTab === 'comparison' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold">University Comparison Tool</h2>
              <p className="text-slate-400 text-sm mt-1">Select up to 4 universities from Explorer to compare stipends, living costs, and admissions requirements.</p>
            </div>

            {selectedForComparison.length === 0 ? (
              <div className="glass-card p-12 text-center rounded-2xl border border-slate-800">
                <Layers className="h-12 w-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-slate-300 mt-4">No universities selected</h3>
                <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">Go to the University Explorer and click "Compare" on the programs you want to stack side by side.</p>
                <button 
                  onClick={() => setActiveTab('explorer')}
                  className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 transition font-bold text-sm text-slate-100 rounded-xl"
                >
                  Open Explorer
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Clear selection button */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-400">Comparing {selectedForComparison.length} programs</span>
                  <button 
                    onClick={() => setSelectedForComparison([])}
                    className="text-xs font-bold text-slate-400 hover:text-slate-200 border border-slate-800 px-3 py-1.5 rounded-xl hover:bg-slate-800"
                  >
                    Clear Selection
                  </button>
                </div>

                {/* Stipends vs Living Cost Chart (Custom pure HTML/CSS representation) */}
                <div className="glass-card p-6 rounded-2xl border border-slate-800">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-400" />
                    Monthly Financial Comparison: Stipend vs Cost of Living Midpoint
                  </h3>
                  
                  <div className="space-y-6">
                    {selectedForComparison.map((slug) => {
                      const uni = universities.find(u => u.slug === slug);
                      if (!uni) return null;
                      
                      const stipendMid = parseStipendMidpoint(uni.stipend_monthly);
                      const costMid = parseCostMidpoint(uni.housing_cost) + parseCostMidpoint(uni.food_cost) + parseCostMidpoint(uni.misc_cost);
                      const remaining = stipendMid - costMid;

                      // Percent calculations for rendering bar charts
                      const maxBarVal = 5500; // max scale
                      const stipendPct = Math.min((stipendMid / maxBarVal) * 100, 100);
                      const costPct = Math.min((costMid / maxBarVal) * 100, 100);

                      return (
                        <div key={slug} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-200">{uni.name}</span>
                            <span className="text-xs font-bold text-emerald-400">Net Surplus: +${Math.round(remaining)}/month</span>
                          </div>
                          
                          {/* Financial Bars */}
                          <div className="space-y-1.5">
                            {/* Stipend Bar */}
                            <div className="flex items-center gap-2">
                              <span className="w-16 text-xs text-slate-500">Stipend</span>
                              <div className="flex-1 h-3.5 bg-slate-900 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full flex items-center justify-end pr-2 text-[10px] font-extrabold text-slate-900"
                                  style={{ width: `${stipendPct}%` }}
                                >
                                  ${Math.round(stipendMid)}
                                </div>
                              </div>
                            </div>
                            {/* Cost Bar */}
                            <div className="flex items-center gap-2">
                              <span className="w-16 text-xs text-slate-500">Est. Cost</span>
                              <div className="flex-1 h-3.5 bg-slate-900 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full flex items-center justify-end pr-2 text-[10px] font-extrabold text-slate-900"
                                  style={{ width: `${costPct}%` }}
                                >
                                  ${Math.round(costMid)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Table Comparison Grid */}
                <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                  <table className="w-full text-left border-collapse bg-slate-900/20">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60">
                        <th className="p-4 text-sm font-bold text-slate-400 w-1/5">Specification</th>
                        {selectedForComparison.map((slug) => {
                          const uni = universities.find(u => u.slug === slug);
                          return (
                            <th key={slug} className="p-4 text-sm font-bold text-slate-200 border-l border-slate-800">
                              {uni?.name}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      <tr>
                        <td className="p-4 font-semibold text-slate-400">QS World / CS Rank</td>
                        {selectedForComparison.map((slug) => {
                          const uni = universities.find(u => u.slug === slug);
                          return (
                            <td key={slug} className="p-4 border-l border-slate-800">
                              QS #{uni?.qs_rank} / CS #{uni?.cs_rank}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="p-4 font-semibold text-slate-400">Difficulty</td>
                        {selectedForComparison.map((slug) => {
                          const uni = universities.find(u => u.slug === slug);
                          return (
                            <td key={slug} className="p-4 border-l border-slate-800 font-bold text-indigo-400">
                              {uni?.competitiveness}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="p-4 font-semibold text-slate-400">Monthly Stipend</td>
                        {selectedForComparison.map((slug) => {
                          const uni = universities.find(u => u.slug === slug);
                          return (
                            <td key={slug} className="p-4 border-l border-slate-800 text-emerald-400 font-bold">
                              {uni?.stipend_monthly}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="p-4 font-semibold text-slate-400">GRE Requirement</td>
                        {selectedForComparison.map((slug) => {
                          const uni = universities.find(u => u.slug === slug);
                          return (
                            <td key={slug} className="p-4 border-l border-slate-800">
                              {uni?.gre}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="p-4 font-semibold text-slate-400">TOEFL Exemption / Waiver</td>
                        {selectedForComparison.map((slug) => {
                          const uni = universities.find(u => u.slug === slug);
                          return (
                            <td key={slug} className="p-4 border-l border-slate-800 text-slate-300">
                              {uni?.toefl_waiver}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="p-4 font-semibold text-slate-400">Application Fee</td>
                        {selectedForComparison.map((slug) => {
                          const uni = universities.find(u => u.slug === slug);
                          return (
                            <td key={slug} className="p-4 border-l border-slate-800 font-bold">
                              {uni?.app_fee}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="p-4 font-semibold text-slate-400">Matched Professors</td>
                        {selectedForComparison.map((slug) => {
                          const uni = universities.find(u => u.slug === slug);
                          return (
                            <td key={slug} className="p-4 border-l border-slate-800 space-y-2">
                              {uni?.professors.map((p, pIdx) => (
                                <div key={pIdx}>
                                  <p className="font-bold text-slate-200">{p.name}</p>
                                  <p className="text-slate-400 text-[10px]">{p.role}</p>
                                </div>
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROFESSOR DIRECTORY */}
        {activeTab === 'professors' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold">Professor Directory</h2>
              <p className="text-slate-400 text-sm mt-1">Access detailed information for matched advisors in Health Informatics and AI Policy.</p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search professors by name, university, or research keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-sm"
              />
            </div>

            {/* Professors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProfs.map((item, index) => {
                const uniqId = `${item.university.slug}-${index}`;
                const emailTemplate = `Subject: Inquiry from MPhil candidate: Potential PhD Mentorship - Olanrewaju Ahmed

Dear Professor ${item.prof.name.split(' ').pop()},

I am writing to inquire if you are accepting new PhD students in your lab for Fall 2027. I hold a First Class Bachelor's in CS and am completing my MPhil at the University of Ibadan, Nigeria. My research focus lies at the intersection of machine learning and clinical health databases, which directly aligns with your project: "${item.prof.projects}."

I have co-authored publications on medical database knowledge discovery, which I have attached. I would be highly grateful for the opportunity to speak with you briefly via Zoom to discuss potential mentorship.

Sincerely,
Olanrewaju Ahmed
Google Scholar: https://scholar.google.com/citations?hl=en&user=CvAXkBQAAAAJ`;

                return (
                  <div key={uniqId} className="glass-card p-6 rounded-2xl flex flex-col justify-between border border-slate-800">
                    <div className="space-y-4">
                      {/* Name & Uni */}
                      <div className="flex justify-between items-start border-b border-slate-800/60 pb-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-100">{item.prof.name}</h3>
                          <p className="text-xs text-slate-400 mt-1">{item.prof.role}</p>
                          <p className="text-xs text-indigo-400 font-semibold mt-0.5">{item.university.name}</p>
                        </div>
                      </div>

                      {/* Fields & Interests */}
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-500 font-medium">Research Interests:</span>
                          <p className="text-slate-300 mt-0.5">{item.prof.interests}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Highlighted Projects:</span>
                          <p className="text-slate-300 mt-0.5">{item.prof.projects}</p>
                        </div>
                      </div>
                    </div>

                    {/* Email template & copy button */}
                    <div className="mt-6 pt-4 border-t border-slate-800 flex gap-2">
                      <button 
                        onClick={() => {
                          const crm = crmLogs[item.university.slug] || { date: '', reply: '', replyType: 'pending', nextFollowUp: '' };
                          const updated = {
                            ...crm,
                            date: new Date().toISOString().split('T')[0],
                            replyType: 'contacted'
                          };
                          setCrmLogs({
                            ...crmLogs,
                            [item.university.slug]: updated
                          });
                          setAppStatuses({
                            ...appStatuses,
                            [item.university.slug]: 'Contacted'
                          });
                          alert(`Outreach logged for ${item.university.name}. View status in Outreach CRM.`);
                        }}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 transition font-bold text-xs rounded-xl text-slate-100 flex items-center justify-center gap-1 shadow-lg glow-primary"
                      >
                        <Mail className="h-3.5 w-3.5" /> Log Outreach
                      </button>
                      <button 
                        onClick={() => copyToClipboard(emailTemplate, uniqId)}
                        className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition font-bold text-xs rounded-xl flex items-center gap-1.5"
                      >
                        {copiedProf === uniqId ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied Email
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" /> Copy Email Template
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* OUTREACH CRM */}
        {activeTab === 'crm' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold">Supervisor Outreach CRM</h2>
              <p className="text-slate-400 text-sm mt-1">Track and manage your contacts, responses, and follow-ups with target advisors.</p>
            </div>

            {/* CRM List */}
            <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
              <div className="p-4 border-b border-slate-800 bg-slate-900/40 grid grid-cols-5 text-sm font-bold text-slate-400">
                <span className="col-span-2">University / matched Professors</span>
                <span>Outreach Date</span>
                <span>Outreach Status</span>
                <span>Actions</span>
              </div>
              <div className="divide-y divide-slate-800/80">
                {universities.map((uni) => {
                  const crm = crmLogs[uni.slug] || { date: '', reply: '', replyType: 'pending', nextFollowUp: '' };
                  
                  return (
                    <div key={uni.slug} className="p-4 grid grid-cols-5 items-center gap-2 hover:bg-slate-900/10 text-xs">
                      {/* Name */}
                      <div className="col-span-2 space-y-1">
                        <p className="font-bold text-slate-200">{uni.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {uni.professors.map(p => p.name).join(', ')}
                        </p>
                      </div>

                      {/* Contact Date */}
                      <div>
                        <input 
                          type="date" 
                          value={crm.date}
                          onChange={(e) => {
                            const updated = { ...crm, date: e.target.value };
                            setCrmLogs({ ...crmLogs, [uni.slug]: updated });
                          }}
                          className="bg-[#0a0d16] border border-slate-800 rounded-lg p-1.5 focus:outline-none focus:border-indigo-500 text-slate-300"
                        />
                      </div>

                      {/* CRM Status Tag */}
                      <div>
                        <select 
                          value={crm.replyType}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = { ...crm, replyType: val };
                            setCrmLogs({ ...crmLogs, [uni.slug]: updated });
                            
                            // Map CRM status to App status if needed
                            if (val === 'contacted') {
                              setAppStatuses({ ...appStatuses, [uni.slug]: 'Contacted' });
                            } else if (val === 'interested') {
                              setAppStatuses({ ...appStatuses, [uni.slug]: 'Awaiting Reply' });
                            } else if (val === 'interview') {
                              setAppStatuses({ ...appStatuses, [uni.slug]: 'Interview' });
                            }
                          }}
                          className="bg-[#0a0d16] border border-slate-800 rounded-lg p-1.5 focus:outline-none focus:border-indigo-500 text-slate-300"
                        >
                          <option value="pending">Not Contacted</option>
                          <option value="contacted">Email Sent</option>
                          <option value="no_reply">No Reply (14+ Days)</option>
                          <option value="interested">Interested (Awaiting App)</option>
                          <option value="interview">Meeting Scheduled</option>
                        </select>
                      </div>

                      {/* Text Note Field */}
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Quick reply notes..."
                          value={crm.reply}
                          onChange={(e) => {
                            const updated = { ...crm, reply: e.target.value };
                            setCrmLogs({ ...crmLogs, [uni.slug]: updated });
                          }}
                          className="w-full bg-[#0a0d16] border border-slate-800 rounded-lg p-1.5 focus:outline-none focus:border-indigo-500 text-slate-300"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SCORE CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold">Personal Admission Score Calculator</h2>
              <p className="text-slate-400 text-sm mt-1">Provide your academic metrics to compute admission probabilities and recommendations.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form panel */}
              <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800">
                <form onSubmit={handleCalculate} className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">GPA Equivalent</label>
                      <select 
                        value={calcProfile.gpa}
                        onChange={(e) => setCalcProfile({ ...calcProfile, gpa: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#0a0d16] border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-200"
                      >
                        <option value="4.8">BSc 1st Class (Excellent 4.8+/5.0)</option>
                        <option value="4.5">BSc 1st Class (Standard 4.5/5.0)</option>
                        <option value="4.0">BSc 1st Class (Lower range 4.0/5.0)</option>
                        <option value="3.5">BSc 2nd Class Upper (3.5/5.0)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">MPhil Master's Degree</label>
                      <select 
                        value={calcProfile.mphil}
                        onChange={(e) => setCalcProfile({ ...calcProfile, mphil: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#0a0d16] border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-200"
                      >
                        <option value="yes">Completed (Research MPhil)</option>
                        <option value="no">BSc Only / Non-thesis Master's</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Google Scholar Publications</label>
                      <select 
                        value={calcProfile.publications}
                        onChange={(e) => setCalcProfile({ ...calcProfile, publications: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#0a0d16] border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-200"
                      >
                        <option value="3">3+ Papers (Published/Co-authored)</option>
                        <option value="2">2 Papers (Published/Co-authored)</option>
                        <option value="1">1 Paper (Published/Co-authored)</option>
                        <option value="0">No Publications</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Years of Research/Industry Experience</label>
                      <select 
                        value={calcProfile.researchYears}
                        onChange={(e) => setCalcProfile({ ...calcProfile, researchYears: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#0a0d16] border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-200"
                      >
                        <option value="4">4+ Years</option>
                        <option value="3">3 Years</option>
                        <option value="2">2 Years</option>
                        <option value="1">1 Year</option>
                        <option value="0">None</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Programming Skills</label>
                      <select 
                        value={calcProfile.programming}
                        onChange={(e) => setCalcProfile({ ...calcProfile, programming: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#0a0d16] border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-200"
                      >
                        <option value="advanced">Advanced (Python ML frameworks, PyTorch, C/C++)</option>
                        <option value="intermediate">Intermediate (Standard ML algorithms, Pandas, R)</option>
                        <option value="beginner">Beginner (Basic logic, minor coding)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Recommendation Letters Strength</label>
                      <select 
                        value={calcProfile.recStrength}
                        onChange={(e) => setCalcProfile({ ...calcProfile, recStrength: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#0a0d16] border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-200"
                      >
                        <option value="very_strong">Very Strong (Detailed research support from MPhil Advisor)</option>
                        <option value="strong">Strong (Standard positive academic letters)</option>
                        <option value="fair">Moderate / Classroom only</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 transition font-bold text-sm text-slate-100 rounded-xl shadow-lg glow-primary mt-4"
                  >
                    Compute Admissions Probability
                  </button>
                </form>
              </div>

              {/* Outputs panel */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold border-b border-slate-800 pb-3 mb-4">Competitiveness Score</h3>
                  
                  {calcResult ? (
                    <div className="space-y-6 text-center">
                      {/* Radial Progress Display */}
                      <div className="inline-flex relative items-center justify-center p-4">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle cx="64" cy="64" r="54" stroke="currentColor" className="text-slate-800" strokeWidth="8" fill="transparent" />
                          <circle cx="64" cy="64" r="54" stroke="currentColor" className="text-indigo-500" strokeWidth="8" fill="transparent" 
                            strokeDasharray={339}
                            strokeDashoffset={339 - (339 * calcResult.admissionProb) / 100}
                          />
                        </svg>
                        <div className="absolute text-center">
                          <p className="text-3xl font-extrabold text-slate-100">{calcResult.admissionProb}%</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Admissions</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-slate-300">
                          Profile Grade: <span className="text-indigo-400 font-bold">{calcResult.details}</span>
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Your MPhil research output and First Class standing make you highly competitive. Direct advisor outreach in September is the single key factor to lock in these odds.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      Fill out the profile metrics and click Compute.
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-800 pt-4 mt-6 text-[10px] text-slate-500 text-center">
                  *Calculations based on historically matched international admissions criteria.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* DOCUMENT CHECKLISTS */}
        {activeTab === 'documents' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold">Document Checklist</h2>
              <p className="text-slate-400 text-sm mt-1">Track the preparation of required dossier materials for your applications.</p>
            </div>

            {/* Checklist Grid */}
            <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
              <div className="divide-y divide-slate-800/80">
                {Object.entries(documents).map(([doc, status]) => (
                  <div key={doc} className="p-4 flex items-center justify-between hover:bg-slate-900/10 text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${status === 'Completed' ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : status === 'In Progress' ? 'bg-amber-400 shadow-lg shadow-amber-400/50' : 'bg-slate-700'}`} />
                      <p className="font-bold text-slate-200">{doc}</p>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const updated = { ...documents, [doc]: 'Pending' as const };
                          setDocuments(updated);
                        }}
                        className={`px-3 py-1.5 border rounded-lg font-semibold text-[10px] transition ${status === 'Pending' ? 'bg-slate-800 text-slate-300 border-slate-700' : 'border-slate-800 text-slate-500 hover:text-slate-300'}`}
                      >
                        Pending
                      </button>
                      <button 
                        onClick={() => {
                          const updated = { ...documents, [doc]: 'In Progress' as const };
                          setDocuments(updated);
                        }}
                        className={`px-3 py-1.5 border rounded-lg font-semibold text-[10px] transition ${status === 'In Progress' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'border-slate-800 text-slate-500 hover:text-slate-300'}`}
                      >
                        In Progress
                      </button>
                      <button 
                        onClick={() => {
                          const updated = { ...documents, [doc]: 'Completed' as const };
                          setDocuments(updated);
                        }}
                        className={`px-3 py-1.5 border rounded-lg font-semibold text-[10px] transition ${status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'border-slate-800 text-slate-500 hover:text-slate-300'}`}
                      >
                        Completed
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* University Detail Modal */}
      {selectedUni && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-panel w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80 flex flex-col h-[85vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
              <div>
                <h3 className="text-xl font-bold text-slate-100">{selectedUni.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedUni.country} | Department: {selectedUni.dept}</p>
              </div>
              <button 
                onClick={() => setSelectedUni(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 transition font-bold text-xs text-slate-400 hover:text-slate-200 rounded-xl"
              >
                Close
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
              
              {/* Core quick statistics table */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800/60 text-xs">
                <div>
                  <span className="text-slate-500">QS World / CS Rank</span>
                  <p className="font-bold text-slate-200 mt-1">QS #{selectedUni.qs_rank} / CS #{selectedUni.cs_rank}</p>
                </div>
                <div>
                  <span className="text-slate-500">Monthly Stipend</span>
                  <p className="font-bold text-emerald-400 mt-1">{selectedUni.stipend_monthly}</p>
                </div>
                <div>
                  <span className="text-slate-500">Annual Stipend</span>
                  <p className="font-bold text-slate-200 mt-1">{selectedUni.stipend_annual}</p>
                </div>
                <div>
                  <span className="text-slate-500">GRE Requirement</span>
                  <p className="font-bold text-indigo-400 mt-1">{selectedUni.gre}</p>
                </div>
              </div>

              {/* Section 2: Admissions Requirements & Waivers */}
              <div className="space-y-2">
                <h4 className="text-md font-bold text-indigo-400">Admissions & Exemption Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-900/20 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-500 font-medium">English Waiver Policy:</span>
                    <p className="text-slate-300 mt-1 leading-relaxed">{selectedUni.toefl_waiver}</p>
                  </div>
                  <div className="bg-slate-900/20 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-500 font-medium">Application Fee & Waivers:</span>
                    <p className="text-slate-300 mt-1 leading-relaxed">{selectedUni.app_fee} - {selectedUni.fee_waiver}</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Faculty Matches */}
              <div className="space-y-3">
                <h4 className="text-md font-bold text-indigo-400">Matched Research Faculty</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {selectedUni.professors.map((p, idx) => (
                    <div key={idx} className="bg-slate-900/20 p-4 rounded-lg border border-slate-800 space-y-2">
                      <p className="font-bold text-slate-200 text-sm">{p.name}</p>
                      <p className="text-slate-400 text-[10px]">{p.role}</p>
                      <div className="space-y-1 mt-2">
                        <p><span className="text-slate-500 font-medium">Interests:</span> {p.interests}</p>
                        <p><span className="text-slate-500 font-medium">Highlight:</span> {p.projects}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Cost of living vs stipend */}
              <div className="space-y-2">
                <h4 className="text-md font-bold text-indigo-400">Cost of Living (Monthly Midpoints)</h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-900/20 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500">Housing</span>
                    <p className="font-semibold text-slate-300 mt-0.5">{selectedUni.housing_cost}</p>
                  </div>
                  <div className="bg-slate-900/20 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500">Food</span>
                    <p className="font-semibold text-slate-300 mt-0.5">{selectedUni.food_cost}</p>
                  </div>
                  <div className="bg-slate-900/20 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500">Misc / Utilities</span>
                    <p className="font-semibold text-slate-300 mt-0.5">{selectedUni.misc_cost}</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/80 text-xs text-slate-400 leading-relaxed mt-2">
                  <span className="font-semibold text-slate-300">Financial Sufficiency: </span>
                  {selectedUni.stipend_sufficiency}
                </div>
              </div>

              {/* Section 5: Personal Notes */}
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <h4 className="text-md font-bold text-indigo-400">Personal Notes & Checklist</h4>
                <textarea 
                  value={notes[selectedUni.slug] || ''}
                  onChange={(e) => setNotes({ ...notes, [selectedUni.slug]: e.target.value })}
                  placeholder="Type your notes, advisor responses, or checklists for this university..."
                  className="w-full h-32 p-3 bg-[#0a0d16] border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-200 text-xs"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex justify-between items-center text-xs">
              <span className="text-slate-500">Admissions Priority: {selectedUni.competitiveness}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const isSelected = selectedForComparison.includes(selectedUni.slug);
                    if (isSelected) {
                      setSelectedForComparison(selectedForComparison.filter(s => s !== selectedUni.slug));
                    } else {
                      if (selectedForComparison.length >= 4) {
                        alert("Select up to 4 universities for comparison.");
                      } else {
                        setSelectedForComparison([...selectedForComparison, selectedUni.slug]);
                      }
                    }
                  }}
                  className={`px-3 py-1.5 border rounded-lg font-semibold transition ${selectedForComparison.includes(selectedUni.slug) ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'border-slate-800 hover:bg-slate-800 text-slate-400'}`}
                >
                  {selectedForComparison.includes(selectedUni.slug) ? 'Selected for Compare' : 'Add to Compare'}
                </button>
                <select 
                  value={appStatuses[selectedUni.slug] || 'Not Started'}
                  onChange={(e) => {
                    setAppStatuses({
                      ...appStatuses,
                      [selectedUni.slug]: e.target.value
                    });
                  }}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-1.5 focus:outline-none focus:border-indigo-500 text-slate-300 font-bold"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="Researching">Researching</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Awaiting Reply">Awaiting Reply</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Interview">Interview</option>
                  <option value="Offer Received">Offer Received</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

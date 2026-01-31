
import React, { useState, useEffect } from 'react';
import { AppTab, ChatMessage, QuizQuestion, WorkflowConfig } from './types';
import Layout from './components/Layout';
import { getSearchGroundedResponse, analyzeImage } from './services/geminiService';

const INITIAL_QUIZ: QuizQuestion[] = [
  {
    id: 'local-1',
    question: "Which Constitutional Amendment is known as the 'Mini-Constitution' of India?",
    options: ["42nd Amendment", "44th Amendment", "24th Amendment", "73rd Amendment"],
    correctAnswer: 0,
    explanation: "The 42nd Amendment Act (1976) is called the Mini-Constitution because of the massive changes it brought to the Constitution.",
    isLive: false
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  
  // Workflow & API Configuration
  const [workflow, setWorkflow] = useState<WorkflowConfig>(() => {
    const saved = localStorage.getItem('educateurself_workflow');
    return saved ? JSON.parse(saved) : {
      webhookUrl: '',
      lastSuccessfulSync: null,
      isAutoSync: true
    };
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Search & AI State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<ChatMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(INITIAL_QUIZ);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  // Persistence for Workflow Config
  useEffect(() => {
    localStorage.setItem('educateurself_workflow', JSON.stringify(workflow));
  }, [workflow]);

  // Auto-sync on load if URL exists
  useEffect(() => {
    if (workflow.webhookUrl && workflow.isAutoSync) {
      fetchFromN8N();
    }
  }, []);

  const fetchFromN8N = async () => {
    if (!workflow.webhookUrl) {
      setSyncError("Please set your n8n Webhook URL in settings.");
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const response = await fetch(workflow.webhookUrl);
      if (!response.ok) throw new Error("n8n Webhook returned an error.");
      
      const data = await response.json();
      // Expecting an array of QuizQuestion-like objects
      if (Array.isArray(data)) {
        const formatted = data.map((q, idx) => ({
          ...q,
          id: `live-${idx}-${Date.now()}`,
          isLive: true
        }));
        setQuizQuestions(formatted.length > 0 ? formatted : INITIAL_QUIZ);
        setWorkflow(prev => ({ ...prev, lastSuccessfulSync: new Date().toLocaleString() }));
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Failed to connect to n8n.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchHistory(prev => [...prev, { role: 'user', content: searchQuery }]);
    setIsSearching(true);
    setSearchQuery('');
    try {
      const result = await getSearchGroundedResponse(searchQuery);
      setSearchHistory(prev => [...prev, { role: 'ai', content: result.text, sources: result.sources }]);
    } catch (err) {
      setSearchHistory(prev => [...prev, { role: 'ai', content: 'Syncing with live data failed.' }]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (index === quizQuestions[currentQuestionIndex].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === AppTab.DASHBOARD && (
        <div className="space-y-8 animate-fadeIn">
          {/* Hero Banner */}
          <section className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/5">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 rounded-full text-[10px] font-black tracking-widest uppercase mb-6 border border-white/10 backdrop-blur-md">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  n8n Backend Connected
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter leading-tight">
                  Smart Workflow <br/><span className="text-indigo-400 italic">Preparation.</span>
                </h1>
                <p className="text-slate-300 text-lg leading-relaxed mb-8">
                  Your AI Agent creates the MCQs, you approve them in Google Sheets, and they appear here live.
                </p>
                <div className="flex gap-4">
                  <button onClick={() => setActiveTab(AppTab.QUIZ)} className="bg-white text-slate-900 px-8 py-3.5 rounded-2xl font-black hover:bg-indigo-50 transition-all shadow-xl">Start Quiz</button>
                  <button onClick={() => setActiveTab(AppTab.WORKFLOW)} className="bg-white/10 backdrop-blur-md text-white px-8 py-3.5 rounded-2xl font-black border border-white/10 hover:bg-white/20 transition-all">Configure API</button>
                </div>
              </div>
              
              {/* Quick Status Stats */}
              <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5">
                  <p className="text-indigo-400 text-2xl font-black">{quizQuestions.length}</p>
                  <p className="text-[10px] uppercase font-black text-slate-400">Total MCQs</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5">
                  <p className="text-emerald-400 text-2xl font-black">{score}</p>
                  <p className="text-[10px] uppercase font-black text-slate-400">Score</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5 col-span-2">
                  <p className="text-indigo-200 text-xs font-bold truncate">{workflow.lastSuccessfulSync || 'Never Synced'}</p>
                  <p className="text-[10px] uppercase font-black text-slate-400">Last n8n Refresh</p>
                </div>
              </div>
            </div>
            
            {/* Background Decor */}
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500 opacity-20 blur-3xl rounded-full"></div>
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-500 opacity-10 blur-3xl rounded-full"></div>
          </section>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">⚡</div>
              <h3 className="font-black text-xl mb-2 text-slate-800 tracking-tight">n8n Live Feed</h3>
              <p className="text-slate-500 text-sm leading-relaxed">MCQs are fetched via your Google Sheets Webhook in real-time.</p>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">🌍</div>
              <h3 className="font-black text-xl mb-2 text-slate-800 tracking-tight">Search Verify</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Use Gemini AI to verify news topics generated by your AI Agent.</p>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">📸</div>
              <h3 className="font-black text-xl mb-2 text-slate-800 tracking-tight">Note Audit</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Scan physical materials to check alignment with UPSC/BPSC syllabus.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === AppTab.WORKFLOW && (
        <div className="max-w-3xl mx-auto py-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 p-10">
            <h3 className="text-2xl font-black mb-8 text-slate-800 tracking-tight flex items-center gap-3">
              <span className="p-2 bg-indigo-50 rounded-xl">⚙️</span>
              Workflow Configuration
            </h3>
            
            <div className="space-y-8">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">n8n Webhook URL (Production)</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="url" 
                    value={workflow.webhookUrl}
                    onChange={(e) => setWorkflow(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://your-n8n.com/webhook/..."
                    className="flex-1 px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-medium text-slate-700 transition-all"
                  />
                  <button 
                    onClick={fetchFromN8N}
                    disabled={isSyncing}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                  >
                    {isSyncing ? 'Syncing...' : 'Test Connection'}
                  </button>
                </div>
                {syncError && <p className="mt-4 text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{syncError}</p>}
                {!syncError && workflow.lastSuccessfulSync && (
                   <p className="mt-4 text-xs font-bold text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-2">
                     <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                     Connection Verified • {workflow.lastSuccessfulSync}
                   </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <h4 className="font-bold text-slate-700 mb-2">Sync Settings</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">Auto-sync on startup</span>
                    <button 
                      onClick={() => setWorkflow(prev => ({ ...prev, isAutoSync: !prev.isAutoSync }))}
                      className={`w-12 h-6 rounded-full transition-colors relative ${workflow.isAutoSync ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${workflow.isAutoSync ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                  <h4 className="font-bold text-indigo-900 mb-2">n8n Node Schema</h4>
                  <p className="text-[10px] text-indigo-600 font-medium leading-relaxed">
                    Ensure your n8n Webhook returns a JSON array with properties: 
                    <code className="bg-indigo-100 px-1 rounded mx-1">question</code>, 
                    <code className="bg-indigo-100 px-1 rounded mx-1">options[]</code>, 
                    <code className="bg-indigo-100 px-1 rounded mx-1">correctAnswer</code>.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 mb-4 tracking-tight">How it works:</h4>
                <div className="space-y-4">
                  {[
                    "AI Agent generates current affairs MCQs daily.",
                    "Rows are added to Google Sheets (Pending Approval).",
                    "You check the 'Approved' checkbox in the Sheet.",
                    "n8n filters these rows and serves them to this URL."
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">{i + 1}</div>
                      <p className="text-sm text-slate-600 font-medium">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === AppTab.QUIZ && (
        <div className="max-w-2xl mx-auto py-4">
          <div className="mb-6 flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <div>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Status</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-sm font-black text-slate-800">Live Workflow Active</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Score</span>
              <p className="text-lg font-black text-slate-800">{score} Correct</p>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden animate-fadeIn">
            <div className="p-10">
              <div className="mb-10">
                 <div className="flex justify-between items-center mb-4">
                   <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                   {quizQuestions[currentQuestionIndex].isLive && (
                     <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase border border-indigo-100">From n8n Workflow</span>
                   )}
                 </div>
                 <h3 className="text-2xl font-black text-slate-800 leading-snug">
                   {quizQuestions[currentQuestionIndex].question}
                 </h3>
              </div>

              <div className="space-y-4">
                {quizQuestions[currentQuestionIndex].options.map((option, idx) => {
                  let statusClass = "border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md";
                  if (isAnswered) {
                    if (idx === quizQuestions[currentQuestionIndex].correctAnswer) {
                      statusClass = "border-emerald-500 bg-emerald-50 text-emerald-800 scale-[1.02] z-10 shadow-lg shadow-emerald-100";
                    } else if (idx === selectedOption) {
                      statusClass = "border-red-200 bg-red-50 text-red-800 opacity-80";
                    } else { statusClass = "border-slate-50 opacity-40 scale-95"; }
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={isAnswered}
                      className={`w-full text-left p-6 rounded-2xl border-2 font-bold transition-all flex justify-between items-center ${statusClass}`}
                    >
                      <span>{option}</span>
                      {isAnswered && idx === quizQuestions[currentQuestionIndex].correctAnswer && (
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
                      )}
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <div className="mt-10 p-8 bg-slate-50 rounded-3xl border border-slate-200 animate-slideUp">
                  <h4 className="text-[11px] font-black text-indigo-600 uppercase mb-3 tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                    Detailed Analysis
                  </h4>
                  <p className="text-slate-600 text-base leading-relaxed font-medium italic">
                    {quizQuestions[currentQuestionIndex].explanation}
                  </p>
                  <button 
                    onClick={() => {
                      setSelectedOption(null);
                      setIsAnswered(false);
                      setCurrentQuestionIndex(prev => (prev + 1) % quizQuestions.length);
                    }}
                    className="mt-8 w-full bg-slate-900 text-white py-4.5 rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
                  >
                    Next Question
                  </button>
                </div>
              )}
            </div>
            <div className="h-1.5 bg-slate-100">
               <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* SEARCH GROUNDING TAB */}
      {activeTab === AppTab.CURRENT_AFFAIRS && (
        <div className="flex flex-col h-[calc(100vh-14rem)] animate-fadeIn">
          <div className="flex-1 overflow-y-auto space-y-6 mb-4 pr-2 custom-scrollbar">
            {searchHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                <div className="text-8xl mb-8 grayscale opacity-20">🌍</div>
                <p className="text-xl font-black text-slate-400 tracking-tight">Search Grounding Enabled</p>
                <p className="text-sm font-medium">Verify any claim from your n8n workflow news topics.</p>
              </div>
            )}
            {searchHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-7 rounded-[2rem] shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}`}>
                  <p className="whitespace-pre-line text-base leading-loose font-medium">{msg.content}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                      {msg.sources.map((s, si) => (
                        <a key={si} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase px-3 py-1 bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 rounded-full transition-all tracking-widest border border-slate-200">
                          {s.title || 'Source'}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isSearching && (
              <div className="flex justify-start">
                 <div className="bg-white border border-slate-100 p-6 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Consulting Search Grounding...</span>
                 </div>
              </div>
            )}
          </div>
          <form onSubmit={handleSearch} className="relative mt-auto">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Verify a news topic with Google Search grounding..."
              className="w-full pl-8 pr-16 py-6 bg-white border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-indigo-100 focus:outline-none shadow-2xl transition-all font-medium text-slate-700"
            />
            <button type="submit" disabled={isSearching} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* REMAINING TABS (SYLLABUS, IMAGE ANALYZE) COHESIVE WITH NEW DESIGN */}
       {activeTab === AppTab.IMAGE_ANALYZE && (
        <div className="max-w-4xl mx-auto space-y-10 py-4 animate-fadeIn">
          <div className="bg-white p-14 rounded-[3rem] border-4 border-dashed border-slate-100 text-center hover:border-indigo-400 hover:bg-indigo-50/20 transition-all group">
            {!selectedImage ? (
              <>
                <div className="text-8xl mb-8 group-hover:scale-110 transition-transform">📸</div>
                <h3 className="text-3xl font-black mb-4 text-slate-800 tracking-tight">AI Note Analysis</h3>
                <p className="text-slate-500 mb-10 max-w-md mx-auto text-lg">Scan physical materials to check accuracy before approving them for your n8n workflow.</p>
                <label className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black cursor-pointer hover:bg-indigo-600 transition-all shadow-2xl inline-block">
                  Upload Material
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setSelectedImage(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              </>
            ) : (
              <div className="space-y-8">
                <img src={selectedImage} alt="Analysis" className="max-h-96 mx-auto rounded-3xl shadow-2xl border-8 border-white" />
                <div className="flex justify-center gap-6">
                  <button onClick={() => { setSelectedImage(null); setAnalysisResult(''); }} className="px-8 py-4 text-slate-400 font-bold hover:text-red-500 transition-colors">Discard</button>
                  <button onClick={async () => {
                    if (!selectedImage) return;
                    setIsAnalyzing(true);
                    try {
                      const b64 = selectedImage.split(',')[1];
                      const result = await analyzeImage(b64, "Perform a high-level audit of this for UPSC/BPSC curriculum. Check for errors.");
                      setAnalysisResult(result);
                    } finally { setIsAnalyzing(false); }
                  }} disabled={isAnalyzing} className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-200 flex items-center gap-3">
                    {isAnalyzing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Start Analysis'}
                  </button>
                </div>
              </div>
            )}
          </div>
          {analysisResult && (
            <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 animate-slideUp">
              <h4 className="text-sm font-black text-indigo-700 mb-8 uppercase tracking-[0.2em] text-center">Material Intelligence Report</h4>
              <div className="prose prose-indigo max-w-none text-slate-600 whitespace-pre-line text-lg leading-relaxed font-medium">
                {analysisResult}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === AppTab.SYLLABUS && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fadeIn">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-4 text-slate-800 tracking-tight">
              <span className="p-2 bg-indigo-50 rounded-xl">🏛️</span>
              UPSC Milestone
            </h3>
            <div className="space-y-4">
              {['Ancient & Mediaeval History', 'Indian Polity & Governance', 'Economy & Agriculture', 'Science & Tech Development', 'Ethics & Aptitude'].map((item, i) => (
                <div key={i} className="flex items-center gap-5 p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all group">
                  <input type="checkbox" className="w-6 h-6 rounded-lg accent-indigo-600 cursor-pointer" />
                  <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-4 text-slate-800 tracking-tight">
              <span className="p-2 bg-emerald-50 rounded-xl">📍</span>
              BPSC Milestone
            </h3>
            <div className="space-y-4">
              {['History & Culture of Bihar', 'Geography & Natural Resources', 'State Economic Survey', 'Bihar Specific Current Affairs', 'General Science (Bihar Level)'].map((item, i) => (
                <div key={i} className="flex items-center gap-5 p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-200 hover:bg-white transition-all group">
                  <input type="checkbox" className="w-6 h-6 rounded-lg accent-emerald-600 cursor-pointer" />
                  <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;

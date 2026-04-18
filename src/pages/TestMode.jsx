import React, { useState, useContext, useRef, useEffect } from 'react';
import { generateQuizContent, generateStudySummary, generateTestFeedback } from '../services/gemini';
import { TestContext } from '../context/TestContext';
import { HelpCircle, Loader2, RefreshCw, ArrowRight, ArrowLeft, CheckCircle2, XCircle, FileText, Upload, BookOpen, TrendingUp, TrendingDown } from 'lucide-react';

export default function TestMode() {
  const { addTest } = useContext(TestContext);
  const fileInputRef = useRef(null);
  
  const [notes, setNotes] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [step, setStep] = useState('input'); // 'input', 'summary', 'flashcards', 'mcq', 'fill', 'results'
  
  const [aiSummary, setAiSummary] = useState([]);
  const [testData, setTestData] = useState({ flashcards: [], mcqs: [], fillBlanks: [] });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Flashcards state
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // MCQ state
  const [currentMcq, setCurrentMcq] = useState(0);
  const [mcqScore, setMcqScore] = useState(0);
  const [userMcqAnswers, setUserMcqAnswers] = useState([]);

  // Fill in blanks state
  const [currentFill, setCurrentFill] = useState(0);
  const [fillScore, setFillScore] = useState(0);
  const [userFillAnswers, setUserFillAnswers] = useState([]);
  const [currentFillText, setCurrentFillText] = useState('');

  // Results & AI Feedback
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Handlers for Input
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFileName(file.name);
    
    if (file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setNotes(evt.target.result);
      };
      reader.readAsText(file);
    } else {
      // TODO: Improve PDF parsing
      setNotes(`[Basic extracted text from ${file.name}]\nEnsure you implement a proper PDF parser library if this is production.`);
    }
  };

  const handleGenerate = async () => {
    if (!notes.trim()) return;
    setIsGenerating(true);
    setError(null);
    
    try {
      const summaryRes = await generateStudySummary(notes);
      const quizRes = await generateQuizContent(notes);

      if (quizRes.error) {
         setError(quizRes.error);
      } else {
         setAiSummary(summaryRes.summary || []);
         setTestData(quizRes);
         setStep('summary');
         
         // reset internal state safely
         setCurrentFlashcard(0); setIsFlipped(false);
         setCurrentMcq(0); setMcqScore(0); setUserMcqAnswers([]);
         setCurrentFill(0); setFillScore(0); setUserFillAnswers([]); setCurrentFillText('');
      }
    } catch (e) {
      setError("Unable to generate test. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handlers for MCQ
  const handleMcqSelect = (option) => {
    const q = testData.mcqs[currentMcq];
    const isCorrect = option === q.correctAnswer;
    if (isCorrect) setMcqScore(prev => prev + 1);
    
    setUserMcqAnswers(prev => [...prev, { question: q.question, selected: option, correct: q.correctAnswer, isCorrect }]);

    if (currentMcq < testData.mcqs.length - 1) {
      setCurrentMcq(prev => prev + 1);
    } else {
      setStep(testData.fillBlanks && testData.fillBlanks.length > 0 ? 'fill' : 'results_loading');
    }
  };

  // Handlers for Fill-in-Blanks
  const handleFillSubmit = (e) => {
    if (e) e.preventDefault();
    if (!currentFillText.trim()) return;

    const q = testData.fillBlanks[currentFill];
    const isCorrect = currentFillText.trim().toLowerCase() === q.answer.toLowerCase();
    
    if (isCorrect) setFillScore(prev => prev + 1);
    
    setUserFillAnswers(prev => [...prev, { question: q.question, selected: currentFillText.trim(), correct: q.answer, isCorrect }]);
    setCurrentFillText('');

    if (currentFill < testData.fillBlanks.length - 1) {
      setCurrentFill(prev => prev + 1);
    } else {
      setStep('results_loading');
    }
  };

  // Execute AI Analysis on Complete
  useEffect(() => {
    let active = true;
    if (step === 'results_loading') {
      const analyzeResults = async () => {
        setIsAnalyzing(true);
        const totalMcqs = testData.mcqs?.length || 0;
        const totalFills = testData.fillBlanks?.length || 0;
        const totalQs = totalMcqs + totalFills;
        const finalScore = mcqScore + fillScore;

        const qaData = {
          score: finalScore,
          total: totalQs,
          mcqs: userMcqAnswers,
          fillBlanks: userFillAnswers
        };

        const feedbackRes = await generateTestFeedback(qaData);
        
        if (active) {
          setAiFeedback(feedbackRes);
          setIsAnalyzing(false);
          setStep('results');
          
          // Log into Test Context history
          addTest({
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            score: finalScore,
            total: totalQs,
            summary: aiSummary,
            feedback: feedbackRes
          });
        }
      };
      analyzeResults();
    }
    return () => { active = false; };
  }, [step]); // eslint-disable-line

  // --- BEGIN AI LEARNING SUMMARY ---
  const { tests } = useContext(TestContext);
  const [globalLearningSummary, setGlobalLearningSummary] = useState(null);
  const [isFetchingSummary, setIsFetchingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  // Fetch Global AI Summary automatically on load/update
  useEffect(() => {
    let active = true;
    const fetchGlobalSummary = async () => {
      // Don't fetch if no history exists to analyze
      if (!tests || tests.length === 0) {
        setGlobalLearningSummary(null);
        return;
      }
      setIsFetchingSummary(true);
      setSummaryError('');
      
      const { generateLearningSummary } = await import('../services/gemini');
      const res = await generateLearningSummary(tests);
      
      if (active) {
        if (res.error) {
          setSummaryError(res.error);
        } else {
          setGlobalLearningSummary(res);
        }
        setIsFetchingSummary(false);
      }
    };
    
    // Use tests.length to prevent runaway loops while keeping fresh records cached
    fetchGlobalSummary();
    
    return () => { active = false; };
  }, [tests.length]);
  // --- END AI LEARNING SUMMARY ---

  const resetTest = () => {
    setNotes('');
    setUploadedFileName('');
    setStep('input');
    setTestData({ flashcards: [], mcqs: [], fillBlanks: [] });
    setError(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="pb-12 min-h-[75vh] flex flex-col items-center max-w-4xl mx-auto w-full px-4">

      {step === 'input' && (
        <>
        <div className="w-full glass-panel p-8 md:p-12 rounded-3xl border border-slate-700/50 shadow-2xl relative overflow-hidden mt-6 mb-6">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Create AI Learning Sequence</h2>
          <p className="text-slate-400 mb-8 text-lg">Upload a document or paste context to generate your test.</p>
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-5 py-4 rounded-xl mb-8 font-medium">
              {error}
            </div>
          )}

          <div className="mb-6 flex items-center justify-between bg-slate-800/50 border border-slate-700 p-4 rounded-2xl">
            <div className="flex items-center text-slate-300">
              <FileText className="w-6 h-6 mr-3 text-emerald-400" />
              <span className="font-medium truncate max-w-[200px] md:max-w-xs">{uploadedFileName || 'No file selected'}</span>
            </div>
            <input 
              type="file" 
              accept=".txt,.pdf" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold text-white transition-colors flex items-center"
            >
              <Upload className="w-4 h-4 mr-2" /> Upload .txt/.pdf
            </button>
          </div>

          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-72 bg-slate-900/80 border border-slate-700 rounded-2xl p-6 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none mb-8 transition-all text-lg leading-relaxed shadow-inner"
            placeholder="Or paste your raw study notes here..."
          />
          
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || (!notes.trim() && !uploadedFileName)}
            className="w-full flex items-center justify-center px-8 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
          >
            {isGenerating ? (
              <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Igniting AI Engine...</>
            ) : (
              <><HelpCircle className="w-6 h-6 mr-3" /> Execute Test Generation</>
            )}
          </button>
        </div>

        <div className="w-full mt-2 mb-8">
          <div className="glass-panel p-8 rounded-3xl border border-slate-700/50 shadow-xl relative overflow-hidden">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <BookOpen className="w-6 h-6 mr-3 text-primary-400" />
              AI Learning Summary
            </h2>
            
            {tests.length === 0 ? (
              <div className="text-center p-6 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                 <p className="text-slate-400">No test data yet. Complete a test sequence to unlock advanced AI learning insights.</p>
              </div>
            ) : isFetchingSummary ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-700/50">
                 <Loader2 className="w-8 h-8 text-primary-400 animate-spin mb-4" />
                 <p className="text-slate-400 font-medium">Synthesizing comprehensive performance analytics...</p>
              </div>
            ) : summaryError ? (
              <div className="p-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl">
                 <p className="font-semibold">{summaryError}</p>
              </div>
            ) : globalLearningSummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 hover:border-slate-600 transition-colors">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Macro Performance Trend</p>
                       <p className={`text-xl font-semibold capitalize ${globalLearningSummary.summary?.trend === 'improving' ? 'text-emerald-400' : globalLearningSummary.summary?.trend === 'declining' ? 'text-rose-400' : 'text-amber-400'}`}>
                         {globalLearningSummary.summary?.trend || 'Pending'}
                       </p>
                    </div>
                    {globalLearningSummary.summary?.commonWeakTopics?.length > 0 && (
                      <div className="bg-rose-500/5 p-5 rounded-2xl border border-rose-500/20 shadow-inner">
                         <p className="text-sm font-bold text-rose-400 flex items-center mb-3">
                           <TrendingDown className="w-4 h-4 mr-2" /> Top Weak Topics
                         </p>
                         <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 font-medium leading-relaxed">
                           {globalLearningSummary.summary.commonWeakTopics.map((w,i) => <li key={i}>{w}</li>)}
                         </ul>
                      </div>
                    )}
                 </div>
                 <div className="bg-primary-500/5 p-6 rounded-2xl border border-primary-500/20 shadow-inner">
                    <p className="text-lg font-bold text-primary-400 mb-5 flex items-center">
                       <HelpCircle className="w-5 h-5 mr-3" /> Action Plan & Strategy
                    </p>
                    <ul className="space-y-4">
                       {globalLearningSummary.actionPlan?.map((plan, i) => (
                         <li key={i} className="flex">
                           <span className="text-primary-500 mr-3 mt-0.5 animate-pulse">➜</span>
                           <span className="text-slate-200 text-sm leading-relaxed font-medium">{plan}</span>
                         </li>
                       ))}
                    </ul>
                 </div>
              </div>
            )}
          </div>
        </div>
        </>
      )}

      {step === 'summary' && (
        <div className="w-full mt-6">
           <div className="glass-panel p-8 md:p-12 rounded-3xl border border-emerald-700/30 shadow-2xl relative overflow-hidden bg-emerald-900/10">
             <div className="flex items-center mb-8">
               <div className="p-3 bg-emerald-500/20 rounded-xl mr-4 border border-emerald-500/30">
                 <FileText className="w-6 h-6 text-emerald-400" />
               </div>
               <h2 className="text-3xl font-bold text-white tracking-tight">Quick AI Summary</h2>
             </div>
             <p className="text-slate-400 text-lg mb-8">Review these core concepts before initiating the sequence.</p>
             
             <ul className="space-y-4 mb-10">
               {aiSummary.map((point, i) => (
                 <li key={i} className="flex items-start bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
                    <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-emerald-500 mr-4 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    <span className="text-slate-200 text-lg leading-relaxed">{point}</span>
                 </li>
               ))}
             </ul>

             <button 
                onClick={() => setStep('flashcards')}
                className="w-full flex items-center justify-center px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
              >
                Proceed to Flashcards <ArrowRight className="w-5 h-5 ml-3" />
              </button>
           </div>
        </div>
      )}

      {step === 'flashcards' && testData.flashcards.length > 0 && (
        <div className="w-full mt-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">Review Flashcards</h2>
            <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
              {currentFlashcard + 1} / {testData.flashcards.length}
            </span>
          </div>

          <div className="w-full h-80 md:h-96 mb-8 cursor-pointer group [perspective:1000px]" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
              
              <div className="absolute inset-0 [backface-visibility:hidden] glass-panel rounded-3xl border border-slate-700/50 flex flex-col items-center justify-center p-10 text-center shadow-2xl bg-slate-900/80">
                <p className="text-2xl md:text-3xl font-bold text-white leading-relaxed">
                  {testData.flashcards[currentFlashcard].question}
                </p>
                <p className="absolute bottom-6 text-sm text-slate-500 tracking-widest uppercase font-bold">Click to flip</p>
              </div>

              <div className="absolute inset-0 [backface-visibility:hidden] glass-panel rounded-3xl border border-emerald-500/30 flex items-center justify-center p-10 text-center shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] bg-slate-800/95 [transform:rotateY(180deg)]">
                <p className="text-xl md:text-2xl font-medium text-emerald-50 whitespace-pre-wrap leading-relaxed">
                  {testData.flashcards[currentFlashcard].answer}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
            <button 
              onClick={() => { if(currentFlashcard>0) {setCurrentFlashcard(p=>p-1); setIsFlipped(false);} }}
              disabled={currentFlashcard === 0}
              className="flex items-center px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors border border-slate-700"
            >
              <ArrowLeft className="w-5 h-5 mr-2" /> Prev
            </button>
            <button 
              onClick={() => {
                if(currentFlashcard < testData.flashcards.length - 1) { setCurrentFlashcard(p=>p+1); setIsFlipped(false); }
                else setStep('mcq');
              }}
              className="flex items-center px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-900/20"
            >
              {currentFlashcard === testData.flashcards.length - 1 ? (
                 <>Start MCQ <ArrowRight className="w-5 h-5 ml-2" /></>
              ) : (
                 <>Next <ArrowRight className="w-5 h-5 ml-2" /></>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'mcq' && testData.mcqs.length > 0 && (
        <div className="w-full mt-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">Multiple Choice</h2>
            <span className="text-primary-400 font-semibold bg-primary-500/10 px-4 py-1.5 rounded-full border border-primary-500/20">
              Q {currentMcq + 1} of {testData.mcqs.length}
            </span>
          </div>

          <div className="glass-panel p-8 md:p-10 rounded-3xl border border-slate-700/50 shadow-2xl mb-8 relative">
            <div className="absolute -left-10 -top-10 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <p className="text-2xl font-semibold text-white mb-10 relative z-10 leading-relaxed">
              {testData.mcqs[currentMcq].question}
            </p>

            <div className="space-y-4 relative z-10">
              {testData.mcqs[currentMcq].options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleMcqSelect(option)}
                  className="w-full text-left p-6 rounded-2xl border border-slate-700 bg-slate-800/40 hover:bg-slate-700/80 hover:border-primary-500/50 text-slate-200 transition-all font-medium text-lg shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-bold mr-4 shrink-0 transition-colors">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'fill' && testData.fillBlanks.length > 0 && (
        <div className="w-full mt-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">Fill in the Blanks</h2>
            <span className="text-amber-400 font-semibold bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
              Q {currentFill + 1} of {testData.fillBlanks.length}
            </span>
          </div>

          <div className="glass-panel p-8 md:p-10 rounded-3xl border border-slate-700/50 shadow-2xl mb-8 relative">
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <p className="text-2xl font-semibold text-white mb-10 relative z-10 leading-relaxed">
              {testData.fillBlanks[currentFill].question}
            </p>

            <form onSubmit={handleFillSubmit} className="relative z-10">
              <input 
                type="text" 
                value={currentFillText}
                onChange={(e) => setCurrentFillText(e.target.value)}
                autoFocus
                placeholder="Type your answer here..."
                className="w-full bg-slate-900 border border-slate-600 rounded-2xl p-6 text-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-center mb-8"
              />
              <button 
                type="submit"
                disabled={!currentFillText.trim()}
                className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold text-lg transition-all"
              >
                Submit Answer
              </button>
            </form>
          </div>
        </div>
      )}

      {step === 'results_loading' && (
        <div className="w-full mt-10 p-12 text-center">
          <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-primary-400 animate-spin" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Analyzing Global Metrics...</h2>
          <p className="text-slate-400">We are compiling your weak areas and generating personalized feedback.</p>
        </div>
      )}

      {step === 'results' && (
        <div className="w-full mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="glass-panel p-8 rounded-3xl border border-slate-700/50 text-center relative overflow-hidden">
               <div className="absolute inset-x-0 top-0 h-1 bg-primary-500"></div>
               <p className="text-slate-400 font-bold uppercase tracking-wider text-sm mb-2">Total Score</p>
               <div className="text-6xl font-black text-white">{mcqScore + fillScore} <span className="text-2xl text-slate-500">/{(testData.mcqs?.length||0) + (testData.fillBlanks?.length||0)}</span></div>
            </div>
            <div className="glass-panel p-8 rounded-3xl border border-slate-700/50 text-center">
               <p className="text-slate-400 font-bold uppercase tracking-wider text-sm mb-2">MCQ Score</p>
               <div className="text-5xl font-black text-slate-200">{mcqScore}</div>
            </div>
            <div className="glass-panel p-8 rounded-3xl border border-slate-700/50 text-center">
               <p className="text-slate-400 font-bold uppercase tracking-wider text-sm mb-2">Fill Blank Score</p>
               <div className="text-5xl font-black text-slate-200">{fillScore}</div>
            </div>
          </div>

          {aiFeedback && !aiFeedback.error && (
            <div className="mb-10 glass-panel p-8 md:p-10 rounded-3xl border border-emerald-500/30 bg-emerald-900/10 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
                <BookOpen className="w-6 h-6 mr-3 text-emerald-400" />
                AI Post-Test Analysis
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {aiFeedback.weakAreas && (
                  <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-rose-400 flex items-center mb-4">
                      <TrendingDown className="w-5 h-5 mr-2" /> Needs Improvement
                    </h3>
                    <ul className="space-y-2 list-disc list-inside text-slate-300">
                      {aiFeedback.weakAreas.map((w,i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
                {aiFeedback.strongAreas && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-emerald-400 flex items-center mb-4">
                      <TrendingUp className="w-5 h-5 mr-2" /> Excellent
                    </h3>
                    <ul className="space-y-2 list-disc list-inside text-slate-300">
                      {aiFeedback.strongAreas.map((w,i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {aiFeedback.tips && (
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                  <h3 className="font-bold text-white mb-4">Actionable Tips:</h3>
                  <ul className="space-y-3">
                    {aiFeedback.tips.map((t,i) => (
                      <li key={i} className="flex">
                        <span className="text-emerald-500 mr-3">✓</span>
                        <span className="text-slate-300">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center mb-10">
            <button 
              onClick={resetTest}
              className="px-10 py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all border border-slate-600 flex items-center justify-center shadow-lg hover:shadow-xl text-lg w-full md:w-auto"
            >
              <RefreshCw className="w-5 h-5 mr-3" /> Initiate New Training Sequence
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

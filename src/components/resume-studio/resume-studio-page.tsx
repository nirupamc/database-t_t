'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, ArrowLeft, User, AlertTriangle, CheckCircle, Sparkles, Zap, ExternalLink, Download, Trash2, FileText } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getOptimizedResumesAction, deleteOptimizedResumeAction } from '@/actions/resume-studio'

interface Candidate {
  id: string
  fullName: string
  resumeUrl: string | null
  skills: string[]
  experienceYears: number
}

interface Props {
  candidates: Candidate[]
  isAdmin: boolean
}

interface ScoreResult {
  overall: number
  breakdown: {
    keywords: { 
      score: number
      matched: string[]
      missing: string[] 
    }
    skills: { 
      score: number
      matched: string[]
      missing: string[] 
    }
    experience: { score: number; notes: string }
    education: { score: number; notes: string }
  }
  fitIndicator: 'STRONG_FIT' | 'GOOD_FIT' | 'PARTIAL_FIT' | 'NOT_A_FIT'
  suggestions: string[]
}

interface OptimizedResume {
  id: string
  jobTitle: string
  company: string | null
  compatibilityScore: number
  scoreBreakdown: any
  status: string
  originalResumeUrl: string
  optimizedResumeUrl: string | null
  atsResumeUrl: string | null        // ATS-optimized version
  formattedResumeUrl: string | null  // Formatted version
  createdAt: Date
}

export function ResumeStudioPage({ candidates, isAdmin }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [showMobileStudio, setShowMobileStudio] = useState(false)
  
  // Resume Studio state
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [isScoring, setIsScoring] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [optimizedUrl, setOptimizedUrl] = useState<string | null>(null)
  const [atsUrl, setAtsUrl] = useState<string | null>(null)
  const [formattedUrl, setFormattedUrl] = useState<string | null>(null)
  const [optimizedFilename, setOptimizedFilename] = useState('')
  const [previousOptimizations, setPreviousOptimizations] = useState<OptimizedResume[]>([])
  const [loadingPrevious, setLoadingPrevious] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  console.log('[ResumeStudioPage] Loaded with candidates:', candidates.length);
  console.log('[ResumeStudioPage] Selected candidate:', selectedCandidate?.fullName);
  console.log('[ResumeStudioPage] isAdmin:', isAdmin);

  // Filter candidates by search term
  const filteredCandidates = candidates.filter(candidate =>
    candidate.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get candidate initials for avatar
  const getInitials = (name: string) => {
    const names = name.split(' ')
    return names.map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  // Parse skills (first 3)
  const getSkillsArray = (skills: string[]) => {
    if (!skills || !Array.isArray(skills)) return []
    return skills.slice(0, 3)
  }

  // Helper functions for Resume Studio
  const fitColors = {
    STRONG_FIT: 'text-green-500 bg-green-500/10 border-green-500/30',
    GOOD_FIT: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    PARTIAL_FIT: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
    NOT_A_FIT: 'text-red-500 bg-red-500/10 border-red-500/30',
  }

  const fitLabels = {
    STRONG_FIT: '🟢 Strong Fit',
    GOOD_FIT: '🟡 Good Fit',
    PARTIAL_FIT: '🟠 Partial Fit',
    NOT_A_FIT: '🔴 Not a Fit',
  }

  function openInGoogleDocs(url: string) {
    // Open resume in preview modal
    if (!url) {
      toast.error('Resume URL not available')
      return
    }
    
    setPreviewUrl(url)
    setShowPreviewModal(true)
  }

  function ScoreBar({ score, label }: { score: number; label: string }) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{score}/10</span>
        </div>
        <div className="w-full bg-border rounded-full h-1.5">
          <div
            className="bg-yellow-400 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${score * 10}%` }}
          />
        </div>
      </div>
    )
  }

  // Load previous optimizations when candidate is selected
  useEffect(() => {
    if (!selectedCandidate) {
      setLoadingPrevious(true)
      setPreviousOptimizations([])
      return
    }

    const load = async () => {
      try {
        const data = await getOptimizedResumesAction(selectedCandidate.id)
        setPreviousOptimizations(data as OptimizedResume[])
      } catch (e) {
        console.error('Failed to load previous optimizations:', e)
      } finally {
        setLoadingPrevious(false)
      }
    }
    load()
    
    // Reset form when candidate changes
    setJobTitle('')
    setCompany('')
    setJobDescription('')
    setScoreResult(null)
    setOptimizedUrl(null)
    setAtsUrl(null)
    setFormattedUrl(null)
    setCurrentRecordId(null)
  }, [selectedCandidate])

  // Score handler
  const handleScore = async () => {
    if (!selectedCandidate || !selectedCandidate.resumeUrl) return
    
    if (!jobTitle.trim()) {
      toast.error('Please enter a job title')
      return
    }
    if (jobDescription.trim().length < 50) {
      toast.error('Job description must be at least 50 characters')
      return
    }

    setIsScoring(true)
    setScoreResult(null)
    setOptimizedUrl(null)
    setAtsUrl(null)
    setFormattedUrl(null)
    setCurrentRecordId(null)

    try {
      const response = await fetch('/api/resume-studio/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          candidateId: selectedCandidate.id, 
          jobTitle, 
          company, 
          jobDescription 
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Scoring failed')
      
      setScoreResult(data.score)
      setCurrentRecordId(data.id)
      toast.success('Resume analyzed successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Scoring failed')
    } finally {
      setIsScoring(false)
    }
  }

  // Optimize handler
  const handleOptimize = async () => {
    if (!currentRecordId) return
    setIsOptimizing(true)

    try {
      const response = await fetch('/api/resume-studio/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optimizedResumeId: currentRecordId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Optimization failed')
      
      setOptimizedUrl(data.optimizedResumeUrl)
      setAtsUrl(data.atsResumeUrl || data.optimizedResumeUrl)  // Fallback to main URL
      setFormattedUrl(data.formattedResumeUrl || data.optimizedResumeUrl)  // Fallback to main URL
      setOptimizedFilename(data.atsFilename || 'optimized-resume.docx')
      setScoreResult(data.score)
      toast.success('Resume optimized successfully!')

      // Refresh previous list
      if (selectedCandidate) {
        const updated = await getOptimizedResumesAction(selectedCandidate.id)
        setPreviousOptimizations(updated as OptimizedResume[])
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Optimization failed'
      )
    } finally {
      setIsOptimizing(false)
    }
  }

  // Delete handler
  const handleDelete = async (id: string) => {
    try {
      await deleteOptimizedResumeAction(id)
      setPreviousOptimizations(prev => prev.filter(r => r.id !== id))
      toast.success('Deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  // Handle candidate selection
  const handleCandidateSelect = (candidate: Candidate) => {
    console.log('[ResumeStudioPage] Selecting candidate:', candidate.fullName);
    setSelectedCandidate(candidate)
    setShowMobileStudio(true)
  }

  // Handle mobile back
  const handleMobileBack = () => {
    setShowMobileStudio(false)
    setSelectedCandidate(null)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            🎯 Resume Studio
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Candidate List Panel - Desktop always visible, Mobile conditional */}
        <div className={cn(
          "w-80 border-r border-border bg-muted/30 flex flex-col",
          "lg:block", // Always visible on desktop
          showMobileStudio ? "hidden" : "block" // Hidden on mobile when studio is shown
        )}>
          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Candidates List */}
          <div className="flex-1 overflow-y-auto">
            {filteredCandidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-foreground mb-2">No candidates found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search term' : 'No candidates assigned to you yet'}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    onClick={() => handleCandidateSelect(candidate)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-all duration-200",
                      "hover:bg-muted/50",
                      selectedCandidate?.id === candidate.id
                        ? "bg-yellow-500/20 border border-yellow-500/30" // Yellow highlight for selected
                        : "bg-background/50"
                    )}
                  >
                    {/* Candidate Info */}
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {getInitials(candidate.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground truncate">
                          {candidate.fullName}
                        </h4>
                        
                        {/* Skills */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {getSkillsArray(candidate.skills).map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Resume Status */}
                        <div className="flex items-center gap-1 mt-2">
                          {candidate.resumeUrl ? (
                            <>
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-500">Resume uploaded</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs text-yellow-500">No resume</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resume Studio Panel */}
        <div className={cn(
          "flex-1 flex flex-col",
          "lg:block", // Always visible on desktop
          showMobileStudio ? "block" : "hidden lg:block" // Show on mobile when candidate selected
        )}>
          {/* Mobile Back Button */}
          <div className="lg:hidden border-b border-border bg-background/95">
            <div className="flex items-center px-4 h-12">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleMobileBack}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              {selectedCandidate && (
                <h2 className="font-medium text-sm truncate">
                  {selectedCandidate.fullName}
                </h2>
              )}
            </div>
          </div>

          {/* Studio Content */}
          <div className="flex-1">
            {!selectedCandidate ? (
              // No candidate selected state
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="max-w-md">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 text-yellow-400/30" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    👈 Select a candidate to get started
                  </h3>
                  <p className="text-muted-foreground">
                    Choose a candidate from the list to analyze and optimize their resume using AI.
                  </p>
                </div>
              </div>
            ) : !selectedCandidate.resumeUrl ? (
              // No resume uploaded state
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="max-w-md">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    ⚠️ No resume uploaded for {selectedCandidate.fullName}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Please upload a resume on their profile first before using Resume Studio.
                  </p>
                  <Button type="button" asChild>
                    <Link href={`/dashboard/candidates/${selectedCandidate.id}`}>
                      Go to Profile
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              // Resume Studio UI - Full Implementation
              <div className="p-6 space-y-6 max-w-3xl mx-auto w-full pb-20">
  
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-400" />
                      Resume Studio
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Analyzing: <strong>{selectedCandidate.fullName}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openInGoogleDocs(selectedCandidate.resumeUrl!)}
                    className="text-xs px-3 py-1.5 border border-border 
                      rounded-md text-muted-foreground hover:border-yellow-400 
                      hover:text-yellow-400 transition-colors flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Current Resume
                  </button>
                </div>

                {/* Input Form */}
                <div className="border border-border rounded-xl p-5 space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase 
                    tracking-wide">
                    Job Details
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        Job Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. Frontend Developer"
                        className="w-full px-3 py-2 text-sm bg-background 
                          border border-border rounded-lg outline-none 
                          focus:border-yellow-400 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        Company
                        <span className="text-muted-foreground text-xs ml-1">
                          (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. TCS, Infosys"
                        className="w-full px-3 py-2 text-sm bg-background 
                          border border-border rounded-lg outline-none 
                          focus:border-yellow-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      Job Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the full job description here. The more detail you provide, the better the AI can analyze and optimize the resume..."
                      rows={7}
                      className="w-full px-3 py-2 text-sm bg-background 
                        border border-border rounded-lg outline-none 
                        focus:border-yellow-400 transition-colors resize-y"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {jobDescription.length < 50 && jobDescription.length > 0
                          ? '⚠️ Minimum 50 characters required'
                          : jobDescription.length >= 50
                          ? '✅ Good length'
                          : 'Paste job description above'
                        }
                      </span>
                      <span>{jobDescription.length} chars</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleScore}
                    disabled={
                      isScoring || 
                      !jobTitle.trim() || 
                      jobDescription.trim().length < 50
                    }
                    className="w-full py-3 bg-yellow-400 text-black font-bold 
                      rounded-lg hover:bg-yellow-500 transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center justify-center gap-2 text-sm"
                  >
                    {isScoring ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black 
                          border-t-transparent rounded-full animate-spin" />
                        Analyzing resume... (30-60 seconds)
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Analyze Compatibility
                      </>
                    )}
                  </button>
                </div>

                {/* Score Result */}
                {scoreResult && (
                  <div className="border border-border rounded-xl p-5 space-y-5">
                    
                    {/* Overall Score */}
                    <div className="text-center py-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        Compatibility Score
                      </p>
                      <div className="text-6xl font-black text-yellow-400">
                        {scoreResult.overall}
                        <span className="text-3xl text-muted-foreground font-normal">
                          /10
                        </span>
                      </div>
                      <div className="w-48 mx-auto bg-border rounded-full h-2 mt-4">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all 
                            duration-700"
                          style={{ width: `${scoreResult.overall * 10}%` }}
                        />
                      </div>
                      <span className={`
                        inline-block mt-3 px-4 py-1.5 rounded-full text-sm 
                        font-semibold border
                        ${fitColors[scoreResult.fitIndicator]}
                      `}>
                        {fitLabels[scoreResult.fitIndicator]}
                      </span>
                    </div>

                    {/* Score Breakdown */}
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold text-sm">Score Breakdown</h4>
                      <ScoreBar 
                        score={scoreResult.breakdown.keywords.score} 
                        label="Keywords Match" 
                      />
                      <ScoreBar 
                        score={scoreResult.breakdown.skills.score} 
                        label="Skills Match" 
                      />
                      <ScoreBar 
                        score={scoreResult.breakdown.experience.score} 
                        label="Experience Match" 
                      />
                      <ScoreBar 
                        score={scoreResult.breakdown.education.score} 
                        label="Education Match" 
                      />
                    </div>

                    {/* Matched Keywords */}
                    {scoreResult.breakdown.keywords.matched.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-green-500">
                          ✅ Matched Keywords ({scoreResult.breakdown.keywords.matched.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {scoreResult.breakdown.keywords.matched.map((k, i) => (
                            <span key={i} className="text-xs px-2.5 py-1 
                              bg-green-500/10 text-green-500 rounded-full 
                              border border-green-500/20">
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Keywords */}
                    {scoreResult.breakdown.keywords.missing.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-red-400">
                          ❌ Missing Keywords ({scoreResult.breakdown.keywords.missing.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {scoreResult.breakdown.keywords.missing.map((k, i) => (
                            <span 
                              key={i} 
                              className="text-xs px-2.5 py-1 bg-red-500/10 text-red-400 
                                rounded-full border border-red-500/20 inline-block"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience Notes */}
                    {scoreResult.breakdown.experience.notes && (
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground">
                          <strong>Experience: </strong>
                          {scoreResult.breakdown.experience.notes}
                        </p>
                      </div>
                    )}

                    {/* Suggestions */}
                    {scoreResult.suggestions && scoreResult.suggestions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">💡 Improvement Suggestions</h4>
                        <div className="space-y-2">
                          {scoreResult.suggestions.map((s, i) => (
                            <div 
                              key={i} 
                              className="flex items-start gap-2.5 p-3 
                                bg-yellow-400/5 border border-yellow-400/20 
                                rounded-lg"
                            >
                              <span className="text-yellow-400 font-bold text-sm 
                                flex-shrink-0 mt-0.5">
                                {i + 1}.
                              </span>
                              <p className="text-sm text-muted-foreground">
                                {s}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Optimize Button or Already Optimized */}
                    {!optimizedUrl ? (
                      scoreResult.overall < 9 ? (
                        <button
                          type="button"
                          onClick={handleOptimize}
                          disabled={isOptimizing || !currentRecordId}
                          className="w-full py-3 bg-yellow-400 text-black font-bold 
                            rounded-lg hover:bg-yellow-500 transition-colors
                            disabled:opacity-50 disabled:cursor-not-allowed
                            flex items-center justify-center gap-2 text-sm"
                        >
                          {isOptimizing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-black 
                                border-t-transparent rounded-full animate-spin" />
                              Optimizing resume... (this may take 1-2 minutes)
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Optimize Resume to 10/10
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="text-center p-4 bg-green-500/10 rounded-lg 
                          border border-green-500/20">
                          <p className="text-green-500 font-semibold">
                            ✅ Resume is already a strong match!
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            No optimization needed for this role.
                          </p>
                        </div>
                      )
                    ) : (
                      /* Show optimized results */
                      (atsUrl || formattedUrl) && (
                        <div className="p-5 bg-green-500/5 border-2 
                          border-green-500/30 rounded-xl space-y-4 mt-2">
                          
                          {/* Success header */}
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <h4 className="font-bold text-green-500">
                              Resume Optimized Successfully!
                            </h4>
                          </div>

                          <p className="text-xs text-muted-foreground">
                            Two versions generated for different use cases:
                          </p>

                          {/* ATS Version */}
                          <div className="p-3 border border-border rounded-lg space-y-2">
                            <div>
                              <p className="text-sm font-semibold flex items-center gap-1">
                                🤖 ATS-Friendly Version
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Clean format optimized for Applicant Tracking Systems.
                                Use this when applying through job portals 
                                (LinkedIn, Naukri, etc.)
                              </p>
                            </div>
                            {atsUrl && (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => window.open(
                                    `https://docs.google.com/viewer?url=${encodeURIComponent(atsUrl)}`,
                                    '_blank'
                                  )}
                                  className="flex-1 py-2 text-xs border border-yellow-400 
                                    text-yellow-400 rounded-md hover:bg-yellow-400/10 
                                    transition-colors flex items-center justify-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Preview
                                </button>
                                
                                <a
                                  href={atsUrl}
                                  download
                                  className="flex-1 py-2 text-xs bg-yellow-400 text-black 
                                    rounded-md hover:bg-yellow-500 transition-colors 
                                    flex items-center justify-center gap-1 font-semibold"
                                >
                                  <Download className="h-3 w-3" />
                                  Download ATS
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Formatted Version */}
                          <div className="p-3 border border-border rounded-lg space-y-2">
                            <div>
                              <p className="text-sm font-semibold flex items-center gap-1">
                                ✨ Formatted Version
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Professional layout with proper formatting.
                                Use this for direct email submissions or 
                                sharing with hiring managers.
                              </p>
                            </div>
                            {formattedUrl && (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => window.open(
                                    `https://docs.google.com/viewer?url=${encodeURIComponent(formattedUrl)}`,
                                    '_blank'
                                  )}
                                  className="flex-1 py-2 text-xs border border-yellow-400 
                                    text-yellow-400 rounded-md hover:bg-yellow-400/10 
                                    transition-colors flex items-center justify-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Preview
                                </button>
                                
                                <a
                                  href={formattedUrl}
                                  download
                                  className="flex-1 py-2 text-xs bg-yellow-400 text-black 
                                    rounded-md hover:bg-yellow-500 transition-colors 
                                    flex items-center justify-center gap-1 font-semibold"
                                >
                                  <Download className="h-3 w-3" />
                                  Download Formatted
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Re-optimize option */}
                          <button
                            type="button"
                            onClick={handleOptimize}
                            disabled={isOptimizing}
                            className="w-full py-2 text-xs border border-border 
                              text-muted-foreground rounded-lg hover:border-yellow-400 
                              hover:text-yellow-400 transition-colors
                              disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isOptimizing ? 'Optimizing...' : '↺ Re-optimize Resume'}
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Previous Optimizations */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    Previous Optimizations
                    {!loadingPrevious && (
                      <span className="text-xs text-muted-foreground font-normal">
                        ({previousOptimizations.length})
                      </span>
                    )}
                  </h3>
                  
                  {loadingPrevious ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      <div className="w-5 h-5 border-2 border-yellow-400 
                        border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading...
                    </div>
                  ) : previousOptimizations.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed 
                      border-border rounded-xl text-muted-foreground text-sm">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                      <p>No previous optimizations yet.</p>
                      <p className="text-xs mt-1">
                        Analyze a resume above to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {previousOptimizations.map(record => (
                        <div key={record.id} className="border border-border 
                          rounded-xl p-4 space-y-3 hover:border-yellow-400/30 
                          transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">
                                {record.jobTitle}
                                {record.company && (
                                  <span className="text-muted-foreground font-normal">
                                    {' '}@ {record.company}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(record.createdAt).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>

                              {/* Version availability indicators */}
                              <div className="flex items-center gap-1 mt-1">
                                {record.atsResumeUrl && (
                                  <span className="text-xs px-1.5 py-0.5 bg-yellow-400/10
                                    text-yellow-400 rounded border border-yellow-400/20">
                                    ATS
                                  </span>
                                )}
                                {record.formattedResumeUrl && (
                                  <span className="text-xs px-1.5 py-0.5 bg-green-500/10
                                    text-green-500 rounded border border-green-500/20">
                                    Formatted
                                  </span>
                                )}
                                {!record.atsResumeUrl && record.optimizedResumeUrl && (
                                  <span className="text-xs px-1.5 py-0.5 bg-muted
                                    text-muted-foreground rounded border border-border">
                                    Legacy
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-sm font-black text-yellow-400">
                                {record.compatibilityScore}/10
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border
                                ${record.status === 'OPTIMIZED' 
                                  ? 'text-green-500 bg-green-500/10 border-green-500/20' 
                                  : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                                }`}>
                                {record.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap items-center">
                            {/* View Original */}
                            <button
                              type="button"
                              onClick={() => openInGoogleDocs(record.originalResumeUrl)}
                              className="text-xs px-3 py-1.5 border border-border
                                text-muted-foreground rounded-lg hover:border-yellow-400
                                hover:text-yellow-400 transition-colors"
                            >
                              📄 Original
                            </button>

                            {/* Smart button rendering based on available URLs */}
                            {record.atsResumeUrl ? (
                              // New format — show both versions separately
                              <>
                                <button
                                  type="button"
                                  onClick={() => openInGoogleDocs(record.atsResumeUrl!)}
                                  className="text-xs px-3 py-1.5 border border-yellow-400
                                    text-yellow-400 rounded-lg hover:bg-yellow-400/10
                                    transition-colors flex items-center gap-1"
                                >
                                  🤖 ATS Version
                                </button>

                                {record.formattedResumeUrl && (
                                  <button
                                    type="button"
                                    onClick={() => openInGoogleDocs(record.formattedResumeUrl!)}
                                    className="text-xs px-3 py-1.5 border border-green-500/50
                                      text-green-500 rounded-lg hover:bg-green-500/10
                                      transition-colors flex items-center gap-1"
                                  >
                                    ✨ Formatted
                                  </button>
                                )}
                              </>
                            ) : record.optimizedResumeUrl ? (
                              // Old format — show single view button
                              <button
                                type="button"
                                onClick={() => openInGoogleDocs(record.optimizedResumeUrl!)}
                                className="text-xs px-3 py-1.5 border border-yellow-400
                                  text-yellow-400 rounded-lg hover:bg-yellow-400/10
                                  transition-colors"
                              >
                                View Optimized
                              </button>
                            ) : null}

                            {/* Download buttons */}
                            {record.atsResumeUrl && (
                              <a
                                href={record.atsResumeUrl}
                                download
                                className="text-xs px-3 py-1.5 border border-border
                                  text-muted-foreground rounded-lg hover:border-yellow-400
                                  hover:text-yellow-400 transition-colors flex items-center gap-1"
                              >
                                ⬇ ATS
                              </a>
                            )}

                            {record.formattedResumeUrl && (
                              <a
                                href={record.formattedResumeUrl}
                                download
                                className="text-xs px-3 py-1.5 border border-border
                                  text-muted-foreground rounded-lg hover:border-green-500
                                  hover:text-green-500 transition-colors flex items-center gap-1"
                              >
                                ⬇ Formatted
                              </a>
                            )}

                            {/* Legacy single download */}
                            {!record.atsResumeUrl && record.optimizedResumeUrl && (
                              <a
                                href={record.optimizedResumeUrl}
                                download
                                className="text-xs px-3 py-1.5 border border-border
                                  text-muted-foreground rounded-lg hover:border-yellow-400
                                  hover:text-yellow-400 transition-colors"
                              >
                                Download
                              </a>
                            )}

                            {/* Delete button — always last */}
                            <button
                              type="button"
                              onClick={() => handleDelete(record.id)}
                              className="text-xs px-2 py-1.5 border
                                border-red-500/30 text-red-400 rounded-lg
                                hover:bg-red-500/10 transition-colors ml-auto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resume Preview Modal */}
      {showPreviewModal && previewUrl && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] 
            flex flex-col border border-border">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resume Preview
              </h2>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Embed the file */}
            <div className="flex-1 overflow-auto bg-muted/20">
              {previewUrl.endsWith('.pdf') ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title="Resume Preview"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8">
                  <p className="text-muted-foreground text-center">
                    DOCX files cannot be previewed in browser. Please download to view.
                  </p>
                  <a
                    href={previewUrl}
                    download
                    className="px-4 py-2 bg-yellow-400 text-black rounded-lg 
                      hover:bg-yellow-500 transition-colors font-semibold 
                      flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Resume
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {previewUrl.split('/').pop() || 'Resume'}
              </p>
              <div className="flex gap-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="px-4 py-2 text-xs bg-yellow-400 text-black rounded-lg 
                    hover:bg-yellow-500 transition-colors font-semibold 
                    flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 text-xs border border-border text-muted-foreground 
                    rounded-lg hover:border-foreground hover:text-foreground 
                    transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
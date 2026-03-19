'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { getOptimizedResumesAction, deleteOptimizedResumeAction } from '@/actions/resume-studio'
import { toast } from 'sonner'

interface Props {
  candidateId: string
  candidateName: string
  resumeUrl: string | null
}

interface ScoreResult {
  overall: number
  breakdown: {
    keywords: { score: number; matched: string[]; missing: string[] }
    skills: { score: number; matched: string[]; missing: string[] }
    experience: { score: number; notes: string }
    education: { score: number; notes: string }
  }
  fitIndicator: 'STRONG_FIT' | 'GOOD_FIT' | 'PARTIAL_FIT' | 'NOT_A_FIT'
  suggestions: string[]
}

interface OptimizedResumeRecord {
  id: string
  jobTitle: string
  company: string | null
  compatibilityScore: number
  scoreBreakdown: any
  status: 'SCORED' | 'OPTIMIZED'
  originalResumeUrl: string
  optimizedResumeUrl: string | null
  atsResumeUrl: string | null
  formattedResumeUrl: string | null
  createdAt: Date
}

export default function ResumeStudioTab({ candidateId, candidateName, resumeUrl }: Props) {
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [isScoring, setIsScoring] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [optimizedUrl, setOptimizedUrl] = useState<string | null>(null)
  const [previousOptimizations, setPreviousOptimizations] = useState<OptimizedResumeRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPreviousOptimizations()
  }, [candidateId])

  const loadPreviousOptimizations = async () => {
    try {
      const data = await getOptimizedResumesAction(candidateId)
      setPreviousOptimizations(data as OptimizedResumeRecord[])
    } catch (error) {
      console.error('Failed to load previous optimizations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyzeResume = async () => {
    if (!jobTitle.trim() || !jobDescription.trim()) {
      toast.error('Please fill in Job Title and Job Description')
      return
    }

    setIsScoring(true)
    try {
      const response = await fetch('/api/score-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          jobTitle: jobTitle.trim(),
          company: company.trim() || null,
          jobDescription: jobDescription.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Scoring failed')
      }

      setCurrentRecordId(data.id)
      setScoreResult(data.score)
      toast.success('Resume analyzed successfully!')
      await loadPreviousOptimizations()

    } catch (error: any) {
      console.error('Scoring error:', error)
      toast.error(error.message || 'Failed to analyze resume')
    } finally {
      setIsScoring(false)
    }
  }

  const handleOptimizeResume = async () => {
    if (!currentRecordId) return

    setIsOptimizing(true)
    try {
      const response = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optimizedResumeId: currentRecordId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Optimization failed')
      }

      setOptimizedUrl(data.optimizedResumeUrl)
      setScoreResult(data.score)
      toast.success('Resume optimized successfully!')
      await loadPreviousOptimizations()

    } catch (error: any) {
      console.error('Optimization error:', error)
      toast.error(error.message || 'Failed to optimize resume')
    } finally {
      setIsOptimizing(false)
    }
  }

  const viewResumeInGoogleViewer = (url: string) => {
    const isDocx = /\.docx(\?|$)/i.test(url)
    if (isDocx) {
      window.open(url, '_blank')
      return
    }
    window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(url)}`, '_blank')
  }

  const downloadResume = (url: string) => {
    window.open(url, '_blank')
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteOptimizedResumeAction(id)
      toast.success('Record deleted')
      await loadPreviousOptimizations()
    } catch (error) {
      toast.error('Failed to delete record')
    }
  }

  const getFitColor = (indicator: string) => {
    switch (indicator) {
      case 'STRONG_FIT': return 'bg-green-500'
      case 'GOOD_FIT': return 'bg-yellow-500'
      case 'PARTIAL_FIT': return 'bg-orange-500'
      case 'NOT_A_FIT': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatScore = (score: number) => {
    return '█'.repeat(Math.ceil(score)) + '░'.repeat(10 - Math.ceil(score))
  }

  if (!resumeUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center gap-2">
            🎯 Resume Studio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <p className="text-yellow-300">
              ⚠️ No resume uploaded for this candidate.
              Please upload a resume first to use Resume Studio.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Score & Optimize Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center gap-2">
            🎯 Resume Studio
          </CardTitle>
          <p className="text-gray-400">Optimize resume for a specific role</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">
                Job Title *
              </label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Frontend Developer"
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">
                Company
              </label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. TCS"
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              Job Description *
            </label>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={6}
              className="bg-gray-800 border-gray-700"
            />
          </div>

          <Button
            type="button"
            onClick={handleAnalyzeResume}
            disabled={isScoring || !jobTitle.trim() || !jobDescription.trim()}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
          >
            {isScoring ? '⚡ Analyzing...' : '⚡ Analyze Resume'}
          </Button>
        </CardContent>
      </Card>

      {/* Score Result */}
      {scoreResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-400">Compatibility Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">
                {scoreResult.overall}/10
              </div>
              <div className="text-lg font-mono text-gray-300 mb-2">
                {formatScore(scoreResult.overall)} {Math.round(scoreResult.overall * 10)}%
              </div>
              <Badge className={`${getFitColor(scoreResult.fitIndicator)} text-white font-medium`}>
                {scoreResult.fitIndicator.replace('_', ' ')} {
                  scoreResult.fitIndicator === 'STRONG_FIT' ? '🟢' :
                  scoreResult.fitIndicator === 'GOOD_FIT' ? '🟡' :
                  scoreResult.fitIndicator === 'PARTIAL_FIT' ? '🟠' : '🔴'
                }
              </Badge>
            </div>

            <div>
              <h4 className="text-lg font-medium text-white mb-3">Breakdown:</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Keywords</span>
                  <span className="font-mono text-gray-300">
                    [{formatScore(scoreResult.breakdown.keywords.score)}] {scoreResult.breakdown.keywords.score}/10
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Skills</span>
                  <span className="font-mono text-gray-300">
                    [{formatScore(scoreResult.breakdown.skills.score)}] {scoreResult.breakdown.skills.score}/10
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Experience</span>
                  <span className="font-mono text-gray-300">
                    [{formatScore(scoreResult.breakdown.experience.score)}] {scoreResult.breakdown.experience.score}/10
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Education</span>
                  <span className="font-mono text-gray-300">
                    [{formatScore(scoreResult.breakdown.education.score)}] {scoreResult.breakdown.education.score}/10
                  </span>
                </div>
              </div>
            </div>

            {scoreResult.breakdown.keywords.matched.length > 0 && (
              <div>
                <h5 className="text-green-400 font-medium mb-2">✅ Matched Keywords:</h5>
                <p className="text-gray-300">{scoreResult.breakdown.keywords.matched.join(', ')}</p>
              </div>
            )}

            {scoreResult.breakdown.keywords.missing.length > 0 && (
              <div>
                <h5 className="text-red-400 font-medium mb-2">❌ Missing Keywords:</h5>
                <p className="text-gray-300">{scoreResult.breakdown.keywords.missing.join(', ')}</p>
              </div>
            )}

            {scoreResult.suggestions && scoreResult.suggestions.length > 0 && (
              <div>
                <h5 className="text-blue-400 font-medium mb-2">💡 Suggestions:</h5>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  {scoreResult.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {!optimizedUrl && scoreResult.overall < 9 && (
              <Button
                type="button"
                onClick={handleOptimizeResume}
                disabled={isOptimizing}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
              >
                {isOptimizing ? '🚀 Optimizing...' : '🚀 Optimize Resume to 10/10'}
              </Button>
            )}

            {scoreResult.overall >= 9 && !optimizedUrl && (
              <div className="text-center">
                <Badge className="bg-green-500 text-white">
                  ✅ Already optimized
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Optimized Result */}
      {optimizedUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-400">✅ Resume Optimized!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2">
                New Score: {scoreResult?.overall}/10{' '}
                <Badge className="bg-green-500 text-white">STRONG FIT 🟢</Badge>
              </div>
            </div>

            <div>
              <h5 className="text-gray-300 font-medium mb-2">📄 Filename:</h5>
              <p className="text-gray-400 font-mono text-sm">
                {candidateName.replace(/[^a-zA-Z0-9]/g, '_')}_{jobTitle.replace(/[^a-zA-Z0-9]/g, '_')}_optimized
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => viewResumeInGoogleViewer(optimizedUrl)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                👁 View Optimized Resume
              </Button>
              <Button
                type="button"
                onClick={() => downloadResume(optimizedUrl)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                ⬇️ Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previous Optimizations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-yellow-400">Previous Optimizations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-400">Loading...</p>
          ) : previousOptimizations.length === 0 ? (
            <p className="text-gray-400">
              No previous optimizations yet.
              Use the form above to analyze and optimize this candidate's resume.
            </p>
          ) : (
            <div className="space-y-4">
              {previousOptimizations.map((record) => (
                <Card key={record.id} className="bg-gray-800">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-white">
                          📄 {record.jobTitle}{record.company ? ` @ ${record.company}` : ''}
                        </h4>
                        <p className="text-sm text-gray-400">
                          Score: {record.compatibilityScore}/10 • Created: {new Date(record.createdAt).toLocaleDateString()}
                        </p>
                        <Badge className="mt-1" variant={record.status === 'OPTIMIZED' ? 'default' : 'secondary'}>
                          {record.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Version availability indicators */}
                    <div className="flex items-center gap-1 mt-1 mb-2">
                      {record.atsResumeUrl && (
                        <span className="text-xs px-1.5 py-0.5 bg-yellow-400/10 text-yellow-400 rounded border border-yellow-400/20">
                          ATS
                        </span>
                      )}
                      {record.formattedResumeUrl && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded border border-green-500/20">
                          Formatted
                        </span>
                      )}
                      {!record.atsResumeUrl && record.optimizedResumeUrl && (
                        <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded border border-border">
                          Legacy
                        </span>
                      )}
                    </div>

                    {/* Action buttons for each record */}
                    <div className="flex gap-2 flex-wrap items-center mt-3 pt-3 border-t border-border">
                      {/* View Original */}
                      <button
                        type="button"
                        onClick={() => viewResumeInGoogleViewer(record.originalResumeUrl)}
                        className="text-xs px-3 py-1.5 border border-border text-muted-foreground rounded-lg hover:border-yellow-400 hover:text-yellow-400 transition-colors"
                      >
                        📄 Original
                      </button>

                      {/* Always show ATS + Formatted actions with fallback for legacy records */}
                      {(record.atsResumeUrl || record.optimizedResumeUrl) && (
                        <button
                          type="button"
                          onClick={() => viewResumeInGoogleViewer(record.atsResumeUrl || record.optimizedResumeUrl!)}
                          className="text-xs px-3 py-1.5 border border-yellow-400 text-yellow-400 rounded-lg hover:bg-yellow-400/10 transition-colors flex items-center gap-1"
                        >
                          🤖 ATS Version
                        </button>
                      )}
                      {(record.formattedResumeUrl || record.optimizedResumeUrl) && (
                        <button
                          type="button"
                          onClick={() => viewResumeInGoogleViewer(record.formattedResumeUrl || record.optimizedResumeUrl!)}
                          className="text-xs px-3 py-1.5 border border-green-500/50 text-green-500 rounded-lg hover:bg-green-500/10 transition-colors flex items-center gap-1"
                        >
                          ✨ Formatted
                        </button>
                      )}

                      {(record.atsResumeUrl || record.optimizedResumeUrl) && (
                        <a
                          href={record.atsResumeUrl || record.optimizedResumeUrl!}
                          download
                          className="text-xs px-3 py-1.5 border border-border text-muted-foreground rounded-lg hover:border-yellow-400 hover:text-yellow-400 transition-colors flex items-center gap-1"
                        >
                          ⬇ ATS
                        </a>
                      )}

                      {(record.formattedResumeUrl || record.optimizedResumeUrl) && (
                        <a
                          href={record.formattedResumeUrl || record.optimizedResumeUrl!}
                          download
                          className="text-xs px-3 py-1.5 border border-border text-muted-foreground rounded-lg hover:border-green-500 hover:text-green-500 transition-colors flex items-center gap-1"
                        >
                          ⬇ Formatted
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(record.id)}
                        className="text-xs px-2 py-1.5 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors ml-auto"
                      >
                        Delete
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

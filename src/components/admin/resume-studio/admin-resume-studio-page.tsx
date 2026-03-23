'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Search,
  Filter,
  ChevronDown,
} from 'lucide-react'

interface OptimizedResumeWithRelations {
  id: string
  jobTitle: string
  company: string | null
  compatibilityScore: number
  status: string
  originalResumeUrl: string
  optimizedResumeUrl: string | null
  atsResumeUrl: string | null
  formattedResumeUrl: string | null
  jobDescription: string
  scoreBreakdown: Record<string, any> | null
  createdAt: Date
  candidate: {
    id: string
    fullName: string
    skills: string[]
  }
  recruiter: {
    id: string
    name: string
    email: string
  }
}

interface Recruiter {
  id: string
  name: string
  email: string
}

interface Candidate {
  id: string
  fullName: string
}

interface Props {
  optimizedResumes: OptimizedResumeWithRelations[]
  recruiters: Recruiter[]
  candidates: Candidate[]
}

export function AdminResumeStudioPage({
  optimizedResumes,
  recruiters,
  candidates,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecruiter, setSelectedRecruiter] = useState('all')
  const [selectedCandidate, setSelectedCandidate] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function openInGoogleDocs(url: string) {
    window.open(
      `https://docs.google.com/viewer?url=${encodeURIComponent(url)}`,
      '_blank'
    )
  }

  // Filtering logic
  const filtered = optimizedResumes.filter(record => {
    const matchesSearch =
      searchQuery === '' ||
      record.candidate.fullName.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      record.jobTitle.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (record.company || '').toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      record.recruiter.name.toLowerCase()
        .includes(searchQuery.toLowerCase())

    const matchesRecruiter =
      selectedRecruiter === 'all' ||
      record.recruiter.id === selectedRecruiter

    const matchesCandidate =
      selectedCandidate === 'all' ||
      record.candidate.id === selectedCandidate

    const matchesStatus =
      selectedStatus === 'all' ||
      record.status === selectedStatus

    const matchesDateFrom =
      !dateFrom ||
      new Date(record.createdAt) >= new Date(dateFrom)

    const matchesDateTo =
      !dateTo ||
      new Date(record.createdAt) <= new Date(dateTo)

    return matchesSearch && matchesRecruiter &&
      matchesCandidate && matchesStatus &&
      matchesDateFrom && matchesDateTo
  })

  // Stats
  const totalOptimized = optimizedResumes.filter(
    r => r.status === 'OPTIMIZED'
  ).length
  const totalScored = optimizedResumes.filter(
    r => r.status === 'SCORED'
  ).length
  const avgScore = optimizedResumes.length > 0
    ? Math.round(
        optimizedResumes.reduce(
          (sum, r) => sum + r.compatibilityScore, 0
        ) / optimizedResumes.length
      )
    : 0
  const uniqueCandidates = new Set(
    optimizedResumes.map(r => r.candidate.id)
  ).size

  return (
    <div className="p-6 space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-400" />
            Resume Studio
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            All AI-optimized resumes across all recruiters and candidates
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Optimizations',
            value: optimizedResumes.length,
            icon: '📄'
          },
          {
            label: 'Fully Optimized',
            value: totalOptimized,
            icon: '✅'
          },
          {
            label: 'Avg Score',
            value: `${avgScore}/10`,
            icon: '⭐'
          },
          {
            label: 'Candidates',
            value: uniqueCandidates,
            icon: '👤'
          },
        ].map(stat => (
          <div key={stat.label} className="border border-border
            rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span>{stat.icon}</span>
              <p className="text-xs text-muted-foreground">
                {stat.label}
              </p>
            </div>
            <p className="text-2xl font-black text-yellow-400">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="border border-border rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2
          lg:grid-cols-3 xl:grid-cols-6 gap-3">

          {/* Search */}
          <div className="xl:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4
              text-muted-foreground" />
            <input
              type="text"
              placeholder="Search candidate, job, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm
                bg-background border border-border rounded-lg
                outline-none focus:border-yellow-400
                transition-colors"
            />
          </div>

          {/* Recruiter filter */}
          <select
            value={selectedRecruiter}
            onChange={(e) => setSelectedRecruiter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background
              border border-border rounded-lg outline-none
              focus:border-yellow-400 transition-colors"
          >
            <option value="all">All Recruiters</option>
            {recruiters.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          {/* Candidate filter */}
          <select
            value={selectedCandidate}
            onChange={(e) => setSelectedCandidate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background
              border border-border rounded-lg outline-none
              focus:border-yellow-400 transition-colors"
          >
            <option value="all">All Candidates</option>
            {candidates.map(c => (
              <option key={c.id} value={c.id}>{c.fullName}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background
              border border-border rounded-lg outline-none
              focus:border-yellow-400 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="OPTIMIZED">Optimized</option>
            <option value="SCORED">Scored Only</option>
          </select>

          {/* Reset filters */}
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setSelectedRecruiter('all')
              setSelectedCandidate('all')
              setSelectedStatus('all')
              setDateFrom('')
              setDateTo('')
            }}
            className="px-3 py-2 text-sm border border-border
              text-muted-foreground rounded-lg
              hover:border-yellow-400 hover:text-yellow-400
              transition-colors"
          >
            Reset Filters
          </button>
        </div>

        {/* Date range */}
        <div className="flex gap-3 items-center">
          <span className="text-xs text-muted-foreground
            flex-shrink-0">
            Date range:
          </span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 text-sm bg-background
              border border-border rounded-lg outline-none
              focus:border-yellow-400 transition-colors"
          />
          <span className="text-muted-foreground text-xs">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-1.5 text-sm bg-background
              border border-border rounded-lg outline-none
              focus:border-yellow-400 transition-colors"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} of {optimizedResumes.length}
          optimizations
        </p>
      </div>

      {/* Results List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed
          border-border rounded-xl">
          <Sparkles className="h-12 w-12 mx-auto mb-3
            text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">
            No optimizations found
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(record => (
            <div key={record.id} className="border border-border
              rounded-xl overflow-hidden hover:border-yellow-400/30
              transition-colors">

              {/* Record Header - always visible */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(
                  expandedId === record.id ? null : record.id
                )}
              >
                <div className="flex items-start
                  justify-between gap-4">

                  {/* Left side info */}
                  <div className="flex items-start gap-3
                    min-w-0 flex-1">

                    {/* Score circle */}
                    <div className={`
                      w-12 h-12 rounded-full flex items-center
                      justify-center flex-shrink-0 font-black text-sm
                      ${record.compatibilityScore >= 9
                        ? 'bg-green-500/20 text-green-500'
                        : record.compatibilityScore >= 7
                        ? 'bg-yellow-400/20 text-yellow-400'
                        : record.compatibilityScore >= 5
                        ? 'bg-orange-500/20 text-orange-500'
                        : 'bg-red-500/20 text-red-500'
                      }
                    `}>
                      {record.compatibilityScore}/10
                    </div>

                    <div className="min-w-0">
                      {/* Job title and company */}
                      <p className="font-semibold truncate">
                        {record.jobTitle}
                        {record.company && (
                          <span className="text-muted-foreground
                            font-normal">
                            {' '}@ {record.company}
                          </span>
                        )}
                      </p>

                      {/* Candidate and recruiter */}
                      <div className="flex items-center gap-2
                        mt-0.5 flex-wrap">
                        <span className="text-xs text-yellow-400
                          font-medium">
                          👤 {record.candidate.fullName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          •
                        </span>
                        <span className="text-xs text-muted-foreground">
                          by {record.recruiter.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          •
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(record.createdAt)
                            .toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                        </span>
                      </div>

                      {/* Version badges */}
                      <div className="flex items-center gap-1 mt-1">
                        {record.atsResumeUrl && (
                          <span className="text-xs px-1.5 py-0.5
                            bg-yellow-400/10 text-yellow-400 rounded
                            border border-yellow-400/20">
                            ATS
                          </span>
                        )}
                        {record.formattedResumeUrl && (
                          <span className="text-xs px-1.5 py-0.5
                            bg-green-500/10 text-green-500 rounded
                            border border-green-500/20">
                            Formatted
                          </span>
                        )}
                        {!record.atsResumeUrl &&
                          record.optimizedResumeUrl && (
                          <span className="text-xs px-1.5 py-0.5
                            bg-muted text-muted-foreground rounded
                            border border-border">
                            Legacy
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-2
                    flex-shrink-0">
                    <span className={`text-xs px-2 py-1
                      rounded-full border font-medium
                      ${record.status === 'OPTIMIZED'
                        ? 'text-green-500 bg-green-500/10 border-green-500/20'
                        : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                      }`}>
                      {record.status}
                    </span>
                    <ChevronDown className={`h-4 w-4
                      text-muted-foreground transition-transform
                      ${expandedId === record.id ? 'rotate-180' : ''}
                    `} />
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === record.id && (
                <div className="border-t border-border p-4
                  space-y-4 bg-muted/10">

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => openInGoogleDocs(
                        record.originalResumeUrl
                      )}
                      className="text-xs px-3 py-1.5 border
                        border-border text-muted-foreground
                        rounded-lg hover:border-yellow-400
                        hover:text-yellow-400 transition-colors"
                    >
                      📄 View Original
                    </button>

                    {record.atsResumeUrl ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openInGoogleDocs(
                            record.atsResumeUrl!
                          )}
                          className="text-xs px-3 py-1.5 border
                            border-yellow-400 text-yellow-400
                            rounded-lg hover:bg-yellow-400/10
                            transition-colors"
                        >
                          🤖 View ATS Version
                        </button>

                        <a
                          href={record.atsResumeUrl}
                          download
                          className="text-xs px-3 py-1.5 border
                            border-border text-muted-foreground
                            rounded-lg hover:border-yellow-400
                            hover:text-yellow-400 transition-colors"
                        >
                          ⬇ Download ATS
                        </a>
                      </>
                    ) : record.optimizedResumeUrl ? (
                      <button
                        type="button"
                        onClick={() => openInGoogleDocs(
                          record.optimizedResumeUrl!
                        )}
                        className="text-xs px-3 py-1.5 border
                          border-yellow-400 text-yellow-400
                          rounded-lg hover:bg-yellow-400/10
                          transition-colors"
                      >
                        View Optimized
                      </button>
                    ) : null}

                    {record.formattedResumeUrl && (
                      <>
                        <button
                          type="button"
                          onClick={() => openInGoogleDocs(
                            record.formattedResumeUrl!
                          )}
                          className="text-xs px-3 py-1.5 border
                            border-green-500/50 text-green-500
                            rounded-lg hover:bg-green-500/10
                            transition-colors"
                        >
                          ✨ View Formatted
                        </button>

                        <a
                          href={record.formattedResumeUrl}
                          download
                          className="text-xs px-3 py-1.5 border
                            border-border text-muted-foreground
                            rounded-lg hover:border-green-500
                            hover:text-green-500 transition-colors"
                        >
                          ⬇ Download Formatted
                        </a>
                      </>
                    )}

                    {/* Link to candidate profile */}
                    <Link
                      href={`/admin/candidates/${record.candidate.id}`}
                      className="text-xs px-3 py-1.5 border
                        border-border text-muted-foreground
                        rounded-lg hover:border-yellow-400
                        hover:text-yellow-400 transition-colors
                        ml-auto"
                    >
                      View Candidate →
                    </Link>
                  </div>

                  {/* Score Breakdown */}
                  {record.scoreBreakdown && Object.keys(record.scoreBreakdown).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold
                        text-muted-foreground uppercase tracking-wide">
                        Score Breakdown
                      </p>
                      <div className="grid grid-cols-2
                        md:grid-cols-4 gap-2">
                        {['keywords', 'skills',
                          'experience', 'education'].map(key => {
                          const breakdown = record.scoreBreakdown?.breakdown as Record<string, any> | undefined
                          const score = breakdown?.[key] as
                            { score?: number } | undefined
                          const scoreVal = score?.score ?? 0

                          return (
                            <div key={key} className="space-y-1">
                              <div className="flex justify-between
                                text-xs">
                                <span className="text-muted-foreground
                                  capitalize">
                                  {key}
                                </span>
                                <span className="font-medium">
                                  {scoreVal}/10
                                </span>
                              </div>
                              <div className="w-full bg-border
                                rounded-full h-1">
                                <div
                                  className="bg-yellow-400 h-1
                                    rounded-full"
                                  style={{
                                    width: `${scoreVal * 10}%`
                                  }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Job Description Preview */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold
                      text-muted-foreground uppercase tracking-wide">
                      Job Description Preview
                    </p>
                    <p className="text-xs text-muted-foreground
                      line-clamp-3 bg-muted/30 p-3 rounded-lg">
                      {record.jobDescription}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

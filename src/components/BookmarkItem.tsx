'use client'

import { useState, useTransition } from 'react'
import { deleteBookmark } from '@/app/dashboard/actions'

type Bookmark = {
    id: string
    url: string
    title: string
    created_at: string
}

export default function BookmarkItem({ bookmark }: { bookmark: Bookmark }) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const hostname = (() => {
        try {
            return new URL(bookmark.url).hostname.replace('www.', '')
        } catch {
            return bookmark.url
        }
    })()

    const formattedDate = new Date(bookmark.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })

    function handleDelete() {
        setError(null)
        startTransition(async () => {
            try {
                await deleteBookmark(bookmark.id)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to delete')
            }
        })
    }

    return (
        <div className={`group bg-white/5 hover:bg-white/8 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all duration-200 ${isPending ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Favicon */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden mt-0.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                            alt=""
                            className="w-4 h-4"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none'
                            }}
                        />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                        <a
                            href={bookmark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white font-medium text-sm hover:text-purple-300 transition-colors duration-200 line-clamp-1 block"
                        >
                            {bookmark.title}
                        </a>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-slate-500 text-xs truncate">{hostname}</span>
                            <span className="text-slate-700 text-xs">·</span>
                            <span className="text-slate-600 text-xs flex-shrink-0">{formattedDate}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-white/10 transition-all duration-200 opacity-0 group-hover:opacity-100"
                        title="Open link"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                    <button
                        onClick={handleDelete}
                        disabled={isPending}
                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:cursor-not-allowed"
                        title="Delete bookmark"
                    >
                        {isPending ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <p className="text-red-400 text-xs mt-2 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1">
                    {error}
                </p>
            )}
        </div>
    )
}

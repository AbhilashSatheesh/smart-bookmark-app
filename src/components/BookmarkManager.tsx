'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import BookmarkItem from './BookmarkItem'

type Bookmark = {
    id: string
    url: string
    title: string
    created_at: string
    user_id: string
}

type Props = {
    initialBookmarks: Bookmark[]
    userId: string
}

export default function BookmarkManager({ initialBookmarks, userId }: Props) {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
    const [isPending, setIsPending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Realtime subscription — handles updates from OTHER tabs/clients
    useEffect(() => {
        const supabase = createClient()
        let channel: ReturnType<typeof supabase.channel> | null = null

        async function subscribe() {
            // Must set auth token BEFORE subscribing so INSERT events are delivered
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.access_token) {
                await supabase.realtime.setAuth(session.access_token)
            }

            channel = supabase
                .channel(`bookmarks-${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'bookmarks',
                    },
                    (payload) => {
                        const newBookmark = payload.new as Bookmark
                        // Only process events for this user
                        if (newBookmark.user_id !== userId) return
                        setBookmarks((prev) => {
                            // Skip if already added optimistically
                            if (prev.some((b) => b.id === newBookmark.id)) return prev
                            return [newBookmark, ...prev]
                        })
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'DELETE',
                        schema: 'public',
                        table: 'bookmarks',
                    },
                    (payload) => {
                        const deleted = payload.old as Partial<Bookmark>
                        if (deleted.user_id && deleted.user_id !== userId) return
                        setBookmarks((prev) => prev.filter((b) => b.id !== deleted.id))
                    }
                )
                .subscribe()
        }

        subscribe()

        return () => {
            if (channel) supabase.removeChannel(channel)
        }
    }, [userId])




    async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setSuccess(false)
        setIsPending(true)

        const form = e.currentTarget
        const formData = new FormData(form)
        const title = (formData.get('title') as string).trim()
        const rawUrl = formData.get('url') as string
        const url = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
            ? rawUrl
            : `https://${rawUrl}`

        try {
            const supabase = createClient()

            const { data, error: insertError } = await supabase
                .from('bookmarks')
                .insert({ url, title, user_id: userId })
                .select()
                .single()

            if (insertError) throw new Error(insertError.message)

            // Optimistically add to list immediately (Realtime won't echo back to sender)
            if (data) {
                setBookmarks((prev) => {
                    if (prev.some((b) => b.id === data.id)) return prev
                    return [data, ...prev]
                })
            }

            setSuccess(true)
            form.reset()
            setTimeout(() => setSuccess(false), 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add bookmark')
        } finally {
            setIsPending(false)
        }
    }

    function handleOptimisticRemove(id: string) {
        setBookmarks((prev) => prev.filter((b) => b.id !== id))
    }

    return (
        <div className="space-y-8">
            {/* Add Bookmark Form */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Bookmark
                </h2>

                <form onSubmit={handleAdd} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="title" className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">
                                Title
                            </label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                required
                                placeholder="My favourite article"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                            />
                        </div>
                        <div>
                            <label htmlFor="url" className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">
                                URL
                            </label>
                            <input
                                id="url"
                                name="url"
                                type="text"
                                required
                                placeholder="https://example.com"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}
                    {success && (
                        <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                            ✓ Bookmark added successfully!
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-200 text-sm hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Saving...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                                Save Bookmark
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Bookmark List */}
            {bookmarks.length === 0 ? (
                <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-4">
                        <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </div>
                    <h3 className="text-slate-300 font-medium mb-1">No bookmarks yet</h3>
                    <p className="text-slate-500 text-sm">Add your first bookmark above to get started</p>
                </div>
            ) : (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            Your Bookmarks
                        </h2>
                        <span className="text-slate-500 text-sm bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                            {bookmarks.length} {bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
                        </span>
                    </div>
                    <div className="space-y-3">
                        {bookmarks.map((bookmark) => (
                            <BookmarkItem
                                key={bookmark.id}
                                bookmark={bookmark}
                                onOptimisticRemove={handleOptimisticRemove}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

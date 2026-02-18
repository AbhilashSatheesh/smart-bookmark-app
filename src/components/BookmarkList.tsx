'use client'

import { useEffect, useState } from 'react'
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

export default function BookmarkList({ initialBookmarks, userId }: Props) {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)

    useEffect(() => {
        const supabase = createClient()

        // Subscribe to real-time changes for this user's bookmarks
        const channel = supabase
            .channel('bookmarks-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'bookmarks',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const newBookmark = payload.new as Bookmark
                    setBookmarks((prev) => {
                        // Avoid duplicates
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
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId])

    if (bookmarks.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-4">
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                </div>
                <h3 className="text-slate-300 font-medium mb-1">No bookmarks yet</h3>
                <p className="text-slate-500 text-sm">Add your first bookmark above to get started</p>
            </div>
        )
    }

    return (
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
                    <BookmarkItem key={bookmark.id} bookmark={bookmark} />
                ))}
            </div>
        </div>
    )
}

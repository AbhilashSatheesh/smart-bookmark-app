'use client'

import { useState, useTransition } from 'react'
import { addBookmark } from '@/app/dashboard/actions'

export default function AddBookmarkForm() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    async function handleSubmit(formData: FormData) {
        setError(null)
        setSuccess(false)
        startTransition(async () => {
            try {
                await addBookmark(formData)
                setSuccess(true)
                // Reset form
                const form = document.getElementById('add-bookmark-form') as HTMLFormElement
                form?.reset()
                setTimeout(() => setSuccess(false), 3000)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to add bookmark')
            }
        })
    }

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Bookmark
            </h2>

            <form id="add-bookmark-form" action={handleSubmit} className="space-y-3">
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
    )
}

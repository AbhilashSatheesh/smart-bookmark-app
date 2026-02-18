import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions'
import BookmarkList from '@/components/BookmarkList'
import AddBookmarkForm from '@/components/AddBookmarkForm'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: bookmarks } = await supabase
        .from('bookmarks')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                        </div>
                        <h1 className="text-white font-semibold text-lg">Smart Bookmarks</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            {user.user_metadata?.avatar_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-full border border-white/20"
                                />
                            )}
                            <span className="text-slate-300 text-sm hidden sm:block">
                                {user.user_metadata?.full_name || user.email}
                            </span>
                        </div>
                        <form action={signOut}>
                            <button
                                type="submit"
                                className="text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all duration-200"
                            >
                                Sign out
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Add Bookmark Form */}
                <div className="mb-8">
                    <AddBookmarkForm />
                </div>

                {/* Bookmark List */}
                <BookmarkList initialBookmarks={bookmarks || []} userId={user.id} />
            </main>
        </div>
    )
}

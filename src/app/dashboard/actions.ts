'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addBookmark(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    const url = formData.get('url') as string
    const title = formData.get('title') as string

    if (!url || !title) {
        throw new Error('URL and title are required')
    }

    // Ensure URL has a protocol
    const normalizedUrl = url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `https://${url}`

    const { error } = await supabase
        .from('bookmarks')
        .insert({
            url: normalizedUrl,
            title: title.trim(),
            user_id: user.id,
        })

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/dashboard')
}

export async function deleteBookmark(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // Extra safety check

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/dashboard')
}

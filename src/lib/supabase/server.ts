import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 用於 Next.js App Router server components / server actions
// 使用 cookie-based session，正確在 Vercel SSR 讀取用戶身份
export async function createSupabaseServerClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet: any[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Server component 無法 set cookies，忽略即可
                        // （實際 set 由 middleware 處理）
                    }
                },
            },
        }
    );
}

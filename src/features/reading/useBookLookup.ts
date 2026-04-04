import { useState } from 'react';
import { getSupabaseFunctionUrl, supabase } from '@/lib/supabaseClient';

type LookupState = 'idle' | 'loading' | 'done' | 'error' | 'not_found';

type BookInfo = {
  author: string | null;
  pages: number | null;
};

export function useBookLookup(onFound: (info: BookInfo) => void) {
  const [state, setState] = useState<LookupState>('idle');

  async function lookup(title: string, author: string) {
    if (!title.trim()) return;

    setState('loading');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(getSupabaseFunctionUrl('hyper-responder'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'lookup_book', title: title.trim(), author: author.trim() }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const pages: number | null = json?.pages ?? null;
      const foundAuthor: string | null = json?.author ?? null;

      if (pages || foundAuthor) {
        onFound({ pages, author: foundAuthor });
        setState('done');
      } else {
        setState('not_found');
      }
    } catch {
      setState('error');
    }

    setTimeout(() => setState('idle'), 3000);
  }

  return { lookup, state };
}

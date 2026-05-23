import { createReply } from '@/app/[locale]/community/actions';

type Labels = { label: string; submit: string; empty: string; placeholder: string };
type Props = { locale: string; threadId: string; slug: string; labels: Labels };

export function ReplyForm({ locale, threadId, slug, labels }: Props) {
  return (
    <form action={createReply} className="space-y-4 rounded-sm border border-line bg-surface p-6 md:p-8">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="thread_id" value={threadId} />
      <input type="hidden" name="slug" value={slug} />
      <label htmlFor="reply-body" className="block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
        {labels.label}
      </label>
      <textarea
        id="reply-body"
        name="body"
        rows={5}
        minLength={4}
        maxLength={4000}
        required
        placeholder={labels.placeholder}
        className="block w-full resize-none rounded-sm border border-line bg-canvas px-4 py-3 text-[15px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
      />
      <button
        type="submit"
        className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium tracking-tight text-canvas hover:bg-ink/90"
      >
        {labels.submit}
      </button>
    </form>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { getLiveChat, sendLiveChatMessage, startLiveChat } from '../../services/api';

const STORAGE_KEY = 'sm_live_chat';

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

export default function LiveChatWidget() {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('form'); // form | chat
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [session, setSession] = useState(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: f.name || user.name || '',
        email: f.email || user.email || '',
        phone: f.phone || user.phone || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    const saved = loadSaved();
    if (!saved?.id || !saved?.accessToken) return;
    getLiveChat(saved.id, saved.accessToken)
      .then((res) => {
        setSession(res.data.data);
        setStep('chat');
      })
      .catch(() => localStorage.removeItem(STORAGE_KEY));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages?.length, open]);

  // Poll while chat open
  useEffect(() => {
    if (!open || step !== 'chat' || !session?.id) return undefined;
    const t = setInterval(async () => {
      try {
        const saved = loadSaved();
        if (!saved?.accessToken) return;
        const res = await getLiveChat(session.id, saved.accessToken);
        setSession(res.data.data);
      } catch {
        /* ignore */
      }
    }, 4000);
    return () => clearInterval(t);
  }, [open, step, session?.id]);

  const start = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await startLiveChat({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim() || undefined,
      });
      const data = res.data.data;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ id: data.id, accessToken: data.accessToken })
      );
      setSession(data);
      setStep('chat');
      setForm((f) => ({ ...f, message: '' }));
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not start chat');
    } finally {
      setBusy(false);
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !session) return;
    const saved = loadSaved();
    setBusy(true);
    setError('');
    try {
      const res = await sendLiveChatMessage(session.id, {
        token: saved?.accessToken,
        body: draft.trim(),
      });
      setSession(res.data.data);
      setDraft('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Send failed');
    } finally {
      setBusy(false);
    }
  };

  const resetChat = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setStep('form');
    setDraft('');
  };

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-3 print:hidden sm:bottom-6 sm:right-6">
      {open ? (
        <div className="pointer-events-auto flex h-[min(560px,78vh)] w-[min(100vw-1.5rem,380px)] flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
          <div className="flex items-center justify-between bg-brand px-4 py-3 text-white">
            <div>
              <div className="text-sm font-semibold">Live chat support</div>
              <div className="text-[11px] text-accent-soft">SM Global team · usually instant</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1 text-lg leading-none text-white/80 hover:bg-white/10"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {step === 'form' ? (
            <form onSubmit={start} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              <p className="text-xs text-muted">
                Chat shuru karne se pehle naam, email aur phone save karte hain — team follow-up ke
                liye.
              </p>
              <input
                required
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
              <input
                required
                placeholder="Phone / WhatsApp"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
              <textarea
                rows={3}
                placeholder="How can we help? (optional)"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
              {error ? <p className="text-xs text-rose-700">{error}</p> : null}
              <button
                type="submit"
                disabled={busy}
                className="mt-auto rounded-xl bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-deep disabled:opacity-60"
              >
                {busy ? 'Starting…' : 'Start chat'}
              </button>
            </form>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-line bg-mist/50 px-3 py-2 text-[11px] text-muted">
                <span>
                  {session?.chatId} · {session?.visitorEmail}
                </span>
                <button type="button" onClick={resetChat} className="font-semibold text-brand">
                  New chat
                </button>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto bg-sand/40 px-3 py-3">
                {(session?.messages || []).map((m) => {
                  const mine = m.sender === 'visitor';
                  return (
                    <div
                      key={m.id || `${m.createdAt}-${m.body.slice(0, 12)}`}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                          mine
                            ? 'bg-brand text-white'
                            : 'border border-line bg-card text-brand'
                        }`}
                      >
                        {!mine ? (
                          <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                            {m.senderName || 'Support'}
                          </div>
                        ) : null}
                        <div className="whitespace-pre-wrap">{m.body}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={send} className="border-t border-line p-3">
                {error ? <p className="mb-2 text-xs text-rose-700">{error}</p> : null}
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a message…"
                    className="min-w-0 flex-1 rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={busy || !draft.trim()}
                    className="rounded-xl bg-accent px-4 text-sm font-semibold text-brand-deep disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg ring-2 ring-accent/40 transition hover:bg-brand-deep"
      >
        <span className="grid h-2.5 w-2.5 place-items-center">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
        </span>
        {open ? 'Close chat' : 'Chat with us'}
      </button>
    </div>
  );
}

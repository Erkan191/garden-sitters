"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function getStatusBadgeClass(status) {
  if (status === "open") return "bg-emerald-50 text-emerald-800 border-emerald-100";
  if (status === "accepted") return "bg-amber-50 text-amber-800 border-amber-100";
  if (status === "completed") return "bg-stone-100 text-stone-700 border-stone-200";
  if (status === "closed") return "bg-zinc-100 text-zinc-600 border-zinc-200";
  return "bg-stone-100 text-stone-700 border-stone-200";
}

function getStatusLabel(status) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function ChatPage() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [req, setReq] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");
  const [userId, setUserId] = useState(null);

  const channelRef = useRef(null);
  const messagesEndRef = useRef(null);

  async function markRead() {
    const { error } = await supabase.rpc("mark_request_chat_read", {
      p_request_id: id,
    });

    return error;
  }

  async function loadInitial() {
    setLoading(true);
    setMsg("");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    const readErr = await markRead();

    if (readErr) {
      setMsg(readErr.message);
      setLoading(false);
      return;
    }

    const { data: requestData, error: reqErr } = await supabase
      .from("care_requests")
      .select("id, title, status")
      .eq("id", id)
      .maybeSingle();

    if (reqErr) {
      setMsg(reqErr.message);
      setLoading(false);
      return;
    }

    setReq(requestData);

    const { data: msgs, error: msgErr } = await supabase
      .from("messages")
      .select("id, body, sender_id, created_at")
      .eq("request_id", id)
      .order("created_at", { ascending: true });

    if (msgErr) {
      setMsg(msgErr.message);
    } else {
      setMessages(msgs ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!id) return;

    loadInitial();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `request_id=eq.${id}`,
        },
        async (payload) => {
          const newMsg = payload.new;

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          const { data: userData } = await supabase.auth.getUser();
          const currentUserId = userData?.user?.id;

          if (currentUserId && newMsg.sender_id !== currentUserId) {
            await markRead();
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendMessage(e) {
    e.preventDefault();
    setMsg("");

    const text = body.trim();
    if (!text) return;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("messages").insert({
      request_id: id,
      sender_id: user.id,
      body: text,
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    setBody("");
  }

  const requestStatusLabel = getStatusLabel(req?.status);
  const requestStatusBadgeClass = getStatusBadgeClass(req?.status);

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 px-4 py-10 text-zinc-900 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-[1.5rem] border border-stone-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          Loading chat...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10 text-zinc-900 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          className="inline-flex text-sm font-medium text-zinc-600 hover:text-emerald-900"
          href={`/requests/${id}`}
        >
          ← Back to request
        </Link>

        <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-gradient-to-br from-white via-stone-50 to-emerald-50/70 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.35fr] lg:items-start">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
                Job chat
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                Chat about the practical details.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                Use this space to agree watering routines, access instructions,
                greenhouse vents, harvest notes, and anything else that matters before
                or during the job.
              </p>
            </div>

            <aside className="rounded-[1.5rem] border border-emerald-100 bg-white/80 p-5 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
                Request
              </p>

              <p className="mt-3 text-sm font-medium text-zinc-900">
                {req?.title || "Request"}
              </p>

              <span
                className={`mt-3 inline-flex rounded-full border px-2 py-1 text-xs font-medium ${requestStatusBadgeClass}`}
              >
                {requestStatusLabel}
              </span>
            </aside>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
                  Messages
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-zinc-900">
                  Conversation
                </h2>
              </div>

              <p className="text-sm text-zinc-500">
                {messages.length} message{messages.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="max-h-[55vh] min-h-80 overflow-y-auto bg-stone-50/60 p-5 sm:p-6">
            {messages.length === 0 ? (
              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
                <p className="text-sm font-medium text-zinc-900">
                  No messages yet.
                </p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  Start by confirming the key details: dates, access, watering, and
                  anything that needs special care.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => {
                  const mine = m.sender_id === userId;

                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-[1.25rem] border p-4 shadow-sm sm:max-w-[70%] ${
                          mine
                            ? "border-emerald-100 bg-emerald-900 text-white"
                            : "border-stone-200 bg-white text-zinc-900"
                        }`}
                      >
                        <p
                          className={`text-xs font-medium ${
                            mine ? "text-emerald-50/80" : "text-zinc-500"
                          }`}
                        >
                          {mine ? "You" : "Them"}
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                          {m.body}
                        </p>

                        <p
                          className={`mt-3 text-xs ${
                            mine ? "text-emerald-50/70" : "text-zinc-500"
                          }`}
                        >
                          {new Date(m.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <form
            onSubmit={sendMessage}
            className="border-t border-stone-200 bg-white p-5 sm:p-6"
          >
            <label className="text-sm font-medium text-zinc-700">
              Message
            </label>

            <textarea
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm leading-6 text-zinc-900 outline-none focus:border-emerald-500 focus:bg-white"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a message..."
            />

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-zinc-500">
                Keep exact access details sensible. Share only what the other person
                needs for the job.
              </p>

              <button className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-800">
                Send message
              </button>
            </div>

            {msg && (
              <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-zinc-600">
                {msg}
              </div>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}

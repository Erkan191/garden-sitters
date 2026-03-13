"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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

  async function sendMessage(e) {
    e.preventDefault();
    setMsg("");

    const text = body.trim();
    if (!text) return;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return router.push("/login");

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

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <a className="underline" href={`/requests/${id}`}>
          ← Back to request
        </a>

        <div className="rounded-2xl border p-6">
          <div>
            <h1 className="text-2xl font-semibold">Chat</h1>
            <p className="mt-1 text-sm opacity-80">
              {req?.title || "Request"} • Status: {req?.status || "?"}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {messages.length === 0 ? (
              <p className="text-sm opacity-80">No messages yet.</p>
            ) : (
              messages.map((m) => {
                const mine = m.sender_id === userId;

                return (
                  <div key={m.id} className="rounded-xl border p-3">
                    <p className="text-xs opacity-60">
                      {mine ? "You" : "Them"}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                    <p className="mt-2 text-xs opacity-60">
                      {new Date(m.created_at).toLocaleString()}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={sendMessage} className="mt-6 space-y-3">
            <div>
              <label className="text-sm">Message</label>
              <textarea
                className="mt-1 w-full rounded-xl border p-2"
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write a message..."
              />
            </div>

            <button className="rounded-xl bg-black px-4 py-2 text-white">
              Send
            </button>

            {msg && <p className="text-sm opacity-80">{msg}</p>}
          </form>
        </div>
      </div>
    </main>
  );
}
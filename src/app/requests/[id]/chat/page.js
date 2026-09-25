"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function formatDateRange(start, end) {
  if (!start && !end) return "Dates to be agreed";
  const options = { day: "numeric", month: "short", year: "numeric" };
  const date = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", options) : "To agree";
  return start === end ? date(start) : `${date(start)} - ${date(end)}`;
}

function buildCareTags(request) {
  return [
    request?.need_watering && "Watering",
    request?.need_harvesting && "Harvesting",
    request?.has_greenhouse && "Greenhouse",
    request?.has_veg_beds && "Veg beds",
    request?.has_pots && "Pots",
    request?.has_seedlings && "Seedlings",
  ].filter(Boolean);
}

export default function ChatPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [req, setReq] = useState(null);
  const [messages, setMessages] = useState([]);
  const [offers, setOffers] = useState([]);
  const [booking, setBooking] = useState(null);
  const [profiles, setProfiles] = useState({});
  const [body, setBody] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [msg, setMsg] = useState("");
  const [userId, setUserId] = useState(null);
  const [working, setWorking] = useState(false);
  const channelRef = useRef(null);
  const messagesEndRef = useRef(null);

  async function markRead() {
    return supabase.rpc("mark_request_chat_read", { p_request_id: id });
  }

  async function loadThread(showLoader = true) {
    if (showLoader) setLoading(true);
    setMsg("");
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/requests/${id}/chat`)}`);
      return;
    }
    setUserId(user.id);

    const { data: requestData, error: requestError } = await supabase
      .from("care_requests")
      .select("id, title, status, owner_id, invited_gardener_id, invitation_status, postcode, start_date, end_date, need_watering, need_harvesting, has_greenhouse, has_veg_beds, has_pots, has_seedlings")
      .eq("id", id)
      .maybeSingle();
    if (requestError || !requestData) {
      setMsg(requestError?.message || "This conversation is not available.");
      setLoading(false);
      return;
    }
    setReq(requestData);
    await markRead();

    const [messageResult, offerResult, bookingResult] = await Promise.all([
      supabase.from("messages").select("id, body, sender_id, created_at").eq("request_id", id).order("created_at", { ascending: true }),
      supabase.from("offers").select("id, gardener_id, proposed_price_gbp, message, status, created_at").eq("request_id", id).order("created_at", { ascending: false }),
      supabase.from("bookings").select("id, offer_id, gardener_id, owner_id, amount_gbp, status").eq("request_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const error = messageResult.error || offerResult.error || bookingResult.error;
    if (error) setMsg(error.message);
    setMessages(messageResult.data || []);
    setOffers(offerResult.data || []);
    setBooking(bookingResult.data || null);

    const profileIds = [...new Set([
      requestData.owner_id,
      requestData.invited_gardener_id,
      ...(offerResult.data || []).map((offer) => offer.gardener_id),
      bookingResult.data?.gardener_id,
    ].filter(Boolean))];
    if (profileIds.length) {
      const { data } = await supabase.from("profiles").select("id, full_name, avatar_url, stripe_direct_charges_ready").in("id", profileIds);
      setProfiles(Object.fromEntries((data || []).map((profile) => [profile.id, profile])));
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!id) return;
    loadThread();
    const channel = supabase.channel(`messages:${id}`).on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `request_id=eq.${id}` },
      async (payload) => {
        setMessages((current) => current.some((item) => item.id === payload.new.id) ? current : [...current, payload.new]);
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id && payload.new.sender_id !== data.user.id) await markRead();
      }
    ).subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages.length]);

  async function sendMessage(event) {
    event.preventDefault();
    const text = body.trim();
    if (!text || !userId) return;
    const { error } = await supabase.from("messages").insert({ request_id: id, sender_id: userId, body: text });
    if (error) setMsg(error.message);
    else setBody("");
  }

  async function respondWithOffer(event) {
    event.preventDefault();
    const amount = Number(offerPrice);
    if (!Number.isFinite(amount) || amount < 5 || Math.round(amount * 100) !== amount * 100) {
      setMsg("Enter a total price of at least £5, with no more than two decimal places.");
      return;
    }
    setWorking(true);
    const { error } = await supabase.from("offers").insert({
      request_id: id,
      gardener_id: userId,
      proposed_price_gbp: amount,
      message: offerMessage.trim() || null,
      status: "pending",
    });
    if (error) setMsg(error.message);
    else {
      setOfferPrice("");
      setOfferMessage("");
      await loadThread(false);
    }
    setWorking(false);
  }

  async function declineInvitation() {
    if (!window.confirm("Decline this garden-care request?")) return;
    setWorking(true);
    const { error } = await supabase.rpc("decline_gardener_invitation", { p_request_id: id });
    if (error) setMsg(error.message);
    else await loadThread(false);
    setWorking(false);
  }

  async function startCheckout(offer) {
    setWorking(true);
    setMsg("Securing your booking...");
    if (offer.status === "pending") {
      const { error } = await supabase.rpc("accept_offer_safely", { p_request_id: id, p_offer_id: offer.id });
      if (error) {
        setWorking(false);
        setMsg(error.message);
        return;
      }
    }
    const { data } = await supabase.auth.getSession();
    const response = await fetch("/api/stripe/checkout/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${data?.session?.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ offerId: offer.id }),
    });
    const json = await response.json();
    if (!response.ok) {
      setWorking(false);
      setMsg(json.error || "Checkout could not be started. Your agreed booking is saved, so you can try again.");
      await loadThread(false);
      return;
    }
    window.location.href = json.url;
  }

  const isOwner = userId === req?.owner_id;
  const isInvitedGardener = userId === req?.invited_gardener_id;
  const acceptedOffer = offers.find((offer) => offer.status === "accepted");
  const myOffer = offers.find((offer) => offer.gardener_id === userId);
  const actionableOffer = offers.find((offer) => offer.status === "pending") || acceptedOffer;
  const gardenerId = booking?.gardener_id || acceptedOffer?.gardener_id || req?.invited_gardener_id;
  const gardener = profiles[gardenerId];
  const owner = profiles[req?.owner_id];
  const counterpart = isOwner ? gardener : owner;
  const careTags = useMemo(() => buildCareTags(req), [req]);
  const isPaid = booking?.status === "paid" || booking?.status === "completed";
  const canOffer = isInvitedGardener && req?.status === "open" && req?.invitation_status === "pending" && !myOffer;

  if (loading) return <main className="wmp-page"><div className="wmp-shell wmp-card rounded-lg text-sm text-zinc-600">Loading conversation...</div></main>;

  return (
    <main className="wmp-page">
      <div className="wmp-shell wmp-stack">
        <Link className="wmp-back-link" href="/dashboard">← Back to dashboard</Link>
        <section className="wmp-hero rounded-lg bg-[#fffdf8]">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.42fr] lg:items-start">
            <div>
              <p className="wmp-eyebrow">Conversation and booking</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">{req?.title || "Garden care"}</h1>
              <p className="mt-3 text-sm text-zinc-600">{formatDateRange(req?.start_date, req?.end_date)} · {req?.postcode || "Area to agree"}</p>
              <div className="mt-4 flex flex-wrap gap-2">{careTags.map((tag) => <span key={tag} className="wmp-chip bg-white">{tag}</span>)}</div>
            </div>
            <aside className="rounded-lg border border-emerald-100 bg-[#f4f8ef] p-5">
              <p className="wmp-eyebrow">With</p>
              <div className="mt-3 flex items-center gap-3">
                {counterpart?.avatar_url ? <img src={counterpart.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" /> : <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white font-bold text-emerald-900">{(counterpart?.full_name || "W").slice(0, 1)}</div>}
                <p className="font-bold text-zinc-900">{counterpart?.full_name || (isOwner ? "Gardener" : "Owner")}</p>
              </div>
              <Link href={`/requests/${id}`} className="mt-4 inline-flex text-sm font-bold text-emerald-900 underline">View full care details</Link>
            </aside>
          </div>
        </section>

        {isPaid && <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-950"><p className="text-lg font-bold">✓ You’re booked</p><p className="mt-1 text-sm">{gardener?.full_name || "Your gardener"} will look after the garden. Keep practical details in this conversation.</p>{booking?.id && <Link href={`/bookings/${booking.id}`} className="mt-3 inline-flex font-bold underline">View booking</Link>}</section>}

        {canOffer && <section className="wmp-panel rounded-lg"><p className="wmp-eyebrow">Your response</p><h2 className="mt-1 text-2xl font-bold text-zinc-900">Can you help?</h2><form onSubmit={respondWithOffer} className="mt-5 grid gap-4 md:grid-cols-[0.3fr_1fr_auto] md:items-end"><label className="wmp-label">Total price (£)<input className="mt-1 wmp-field rounded-lg" type="number" min="5" step="0.01" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder="10" required /></label><label className="wmp-label">Message (optional)<input className="mt-1 wmp-field rounded-lg" value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} placeholder="I can help on those dates." /></label><button disabled={working} className="wmp-button wmp-button-primary">I can help</button></form><button type="button" disabled={working} onClick={declineInvitation} className="mt-3 text-sm font-bold text-zinc-600 underline">Decline</button></section>}
        {isInvitedGardener && req?.invitation_status === "declined" && <section className="wmp-panel rounded-lg text-sm text-zinc-600">You declined this request.</section>}
        {myOffer && !isPaid && <section className="wmp-panel rounded-lg"><p className="wmp-eyebrow">Price proposed</p><h2 className="mt-1 text-2xl font-bold text-zinc-900">£{Number(myOffer.proposed_price_gbp).toFixed(2)} total</h2><p className="mt-2 text-sm text-zinc-600">{myOffer.status === "accepted" ? "The owner agreed your price. Payment is the next step." : "Waiting for the owner to book."}</p></section>}
        {isOwner && actionableOffer && !isPaid && <section className="wmp-panel rounded-lg border-emerald-100"><p className="wmp-eyebrow">Ready to book</p><h2 className="mt-1 text-2xl font-bold text-zinc-900">{gardener?.full_name || "Your gardener"} is available — £{Number(actionableOffer.proposed_price_gbp).toFixed(2)} total</h2><p className="mt-2 text-sm leading-6 text-zinc-600">Pay securely now to confirm the booking. Watch My Plot keeps its 10% fee and Stripe sends the gardener’s share to their Stripe balance.</p><button disabled={working || !gardener?.stripe_direct_charges_ready} onClick={() => startCheckout(actionableOffer)} className="mt-5 wmp-button wmp-button-primary disabled:cursor-not-allowed disabled:opacity-60">{working ? "Opening secure payment..." : `Book ${gardener?.full_name || "gardener"} — £${Number(actionableOffer.proposed_price_gbp).toFixed(2)}`}</button>{!gardener?.stripe_direct_charges_ready && <p className="mt-3 text-sm text-amber-700">The gardener needs to finish Stripe payout setup before payment can be taken.</p>}</section>}

        <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 p-5 sm:p-6"><p className="wmp-eyebrow">Messages</p><h2 className="mt-1 text-2xl font-bold text-zinc-900">Conversation</h2></div>
          <div className="max-h-[55vh] min-h-80 overflow-y-auto bg-stone-50/60 p-5 sm:p-6">
            {messages.length === 0 ? <div className="rounded-lg border border-stone-200 bg-white p-5 text-sm text-zinc-600">Start the conversation with dates, access, watering, and anything that needs special care.</div> : <div className="space-y-3">{messages.map((message) => { const mine = message.sender_id === userId; const sender = profiles[message.sender_id]; return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-lg border p-4 shadow-sm sm:max-w-[70%] ${mine ? "border-emerald-900 bg-emerald-900 text-white" : "border-stone-200 bg-white text-zinc-900"}`}><p className={`text-xs font-medium ${mine ? "text-emerald-50/80" : "text-zinc-500"}`}>{mine ? "You" : sender?.full_name || "Them"}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.body}</p><p className={`mt-3 text-xs ${mine ? "text-emerald-50/70" : "text-zinc-500"}`}>{new Date(message.created_at).toLocaleString()}</p></div></div>; })}<div ref={messagesEndRef} /></div>}
          </div>
          <form onSubmit={sendMessage} className="border-t border-stone-200 p-5 sm:p-6"><label className="wmp-label">Message<textarea className="mt-1 wmp-field rounded-lg leading-6" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message..." /></label><div className="mt-3 flex justify-end"><button className="wmp-button wmp-button-primary">Send message</button></div></form>
        </section>
        {msg && <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-zinc-700">{msg}</div>}
      </div>
    </main>
  );
}

"use client";

import { useParams } from "next/navigation";

export default function BookingCancelPage() {
  const { id } = useParams();

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold">Payment cancelled</h1>
        <p className="mt-4">No worries — you can try again.</p>
        <a className="mt-6 inline-block underline" href="/requests">
          Back to requests
        </a>
        <p className="mt-2 text-sm opacity-70">Booking id: {id}</p>
      </div>
    </main>
  );
}
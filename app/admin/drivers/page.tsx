"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, FileSearch, ShieldCheck } from "lucide-react";
import { adminSupabase } from "../../lib/browser-supabase";

const supabase = adminSupabase();

type DriverDocument = {
  id: string;
  document_type: string;
  status: string;
  expiry_date: string | null;
  review_note: string | null;
  signed_url: string | null;
};

type Eligibility = {
  id: string;
  service_code: string;
  status: string;
};

type DriverApplication = {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  city: string;
  requested_services: string[];
  vehicle_type: string | null;
  registration_type: string;
  status: string;
  identity_verified: boolean;
  background_verified: boolean;
  medical_verified: boolean;
  psychological_verified: boolean;
  bank_verified: boolean;
  safety_training_completed: boolean;
  rejection_reason: string | null;
  documents: DriverDocument[];
  eligibility: Eligibility[];
  rider: { id: string; is_active: boolean; admin_suspended: boolean; vehicle_number: string | null } | null;
};

const CHECKS = [
  ["background_verified", "Background / antecedent check"],
  ["bank_verified", "Bank / payout verification"],
  ["safety_training_completed", "Safety training completed"],
  ["medical_verified", "Medical fitness / eye check"],
  ["psychological_verified", "Psychological assessment"],
] as const;

export default function AdminDriverVerificationPage() {
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token || "";

  const load = async () => {
    setLoading(true);
    const token = await getToken();
    if (!token) { window.location.href = "/admin/login"; return; }
    const response = await fetch("/api/admin/drivers", { headers: { Authorization: `Bearer ${token}` } });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) { setError(payload.error || "Driver verification queue unavailable."); return; }
    setApplications(Array.isArray(payload.applications) ? payload.applications : []);
  };

  useEffect(() => { void load(); }, []);

  const action = async (applicationId: string, payload: Record<string, unknown>) => {
    setBusy(applicationId); setError(""); setNotice("");
    const response = await fetch("/api/admin/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` },
      body: JSON.stringify({ application_id: applicationId, ...payload }),
    });
    const result = await response.json().catch(() => ({}));
    setBusy("");
    if (!response.ok) { setError(result.error || "Verification action failed."); return; }
    setNotice("Driver verification updated.");
    await load();
  };

  const rejectDocument = async (applicationId: string, documentId: string) => {
    const note = window.prompt("Reason the applicant should replace this document:");
    if (!note?.trim()) return;
    await action(applicationId, { action: "REVIEW_DOCUMENT", document_id: documentId, decision: "REJECTED", note });
  };

  const activate = async (application: DriverApplication, serviceCode: string) => {
    let vehicleNumber = "";
    if (serviceCode !== "DELIVERY_RIDER") {
      vehicleNumber = window.prompt("Enter the vehicle registration number confirmed from the approved RC:")?.trim() || "";
      if (!vehicleNumber) return;
    }
    await action(application.id, { action: "ACTIVATE", service_code: serviceCode, vehicle_number: vehicleNumber });
  };

  return (
    <main className="min-h-screen bg-[#f5f8f4] px-4 py-7 md:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm font-black text-[#075E45]"><ArrowLeft size={16} /> Admin dashboard</Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
          <div><h1 className="text-3xl font-black">Driver & Courier Verification</h1><p className="mt-2 text-sm text-slate-600">No applicant becomes dispatch-eligible until required documents and safety checks pass.</p></div>
          <button onClick={() => void load()} className="rounded-xl bg-white px-4 py-2 text-sm font-black shadow-sm">Refresh</button>
        </div>

        {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
        {notice && <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{notice}</p>}

        {loading ? <p className="mt-8 text-sm text-slate-500">Loading verification queue…</p> : applications.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-white p-8 text-center text-sm text-slate-500">No driver verification applications yet.</div>
        ) : (
          <div className="mt-6 grid gap-5">
            {applications.map((application) => {
              const passenger = application.requested_services.some((service) => service === "AUTO_DRIVER" || service === "CAB_DRIVER");
              return (
                <section key={application.id} className="rounded-3xl bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-xl font-black">{application.full_name}</h2>
                      <p className="mt-1 text-sm text-slate-500">{application.phone_number} · {application.city} · {application.vehicle_type || "Vehicle not entered"}</p>
                      <div className="mt-2 flex flex-wrap gap-2">{application.requested_services.map((service) => <span key={service} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black">{service.replaceAll("_", " ")}</span>)}</div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-[#075E45]">{application.status.replaceAll("_", " ")}</span>
                  </div>

                  {application.rejection_reason && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-900">{application.rejection_reason}</p>}

                  <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
                    <div>
                      <h3 className="font-black">Documents</h3>
                      <div className="mt-3 grid gap-2">
                        {application.documents.length === 0 ? <p className="text-sm text-slate-500">No documents uploaded.</p> : application.documents.map((document) => (
                          <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                            <div>
                              <p className="text-sm font-black">{document.document_type.replaceAll("_", " ")}</p>
                              <p className="mt-1 text-[11px] text-slate-500">{document.status}{document.expiry_date ? ` · expires ${document.expiry_date}` : ""}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {document.signed_url && <a href={document.signed_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-black"><FileSearch size={14} /> Review</a>}
                              {document.status !== "APPROVED" && <button disabled={busy === application.id} onClick={() => void action(application.id, { action: "REVIEW_DOCUMENT", document_id: document.id, decision: "APPROVED" })} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Approve</button>}
                              {document.status !== "REJECTED" && <button disabled={busy === application.id} onClick={() => void rejectDocument(application.id, document.id)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-700">Replace</button>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-black">Safety & identity checks</h3>
                      <div className="mt-3 grid gap-2">
                        <div className="flex items-center justify-between rounded-xl border p-3 text-sm font-bold"><span>Identity document verified</span><span>{application.identity_verified ? "✅" : "—"}</span></div>
                        {CHECKS.map(([field,label]) => {
                          if (!passenger && (field === "medical_verified" || field === "psychological_verified")) return null;
                          const checked = Boolean(application[field as keyof DriverApplication]);
                          return <button key={field} disabled={busy === application.id} onClick={() => void action(application.id, { action: "SET_CHECK", field, value: !checked })} className="flex items-center justify-between rounded-xl border p-3 text-left text-sm font-bold"><span>{label}</span><span>{checked ? "✅" : "Mark complete"}</span></button>;
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {["UNDER_REVIEW","ACTION_REQUIRED"].includes(application.status) && <button disabled={busy === application.id} onClick={() => void action(application.id, { action: "FINALIZE" })} className="inline-flex items-center gap-2 rounded-xl bg-[#075E45] px-4 py-3 text-sm font-black text-white"><ShieldCheck size={16} /> Final verification</button>}
                    {application.status === "VERIFIED" && application.eligibility.filter((item) => ["DELIVERY_RIDER","BIKE_COURIER","GOODS_DRIVER"].includes(item.service_code)).map((item) => (
                      <button key={item.id} disabled={busy === application.id || item.status === "ACTIVE"} onClick={() => void activate(application, item.service_code)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50"><CheckCircle2 size={16} />{item.status === "ACTIVE" ? `${item.service_code.replaceAll("_", " ")} ACTIVE` : `Activate ${item.service_code.replaceAll("_", " ")}`}</button>
                    ))}
                    {application.status === "VERIFIED" && application.requested_services.some((service) => service === "AUTO_DRIVER" || service === "CAB_DRIVER") && <span className="rounded-xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900">Auto/Cab documents may be verified, but passenger dispatch activation stays provider/compliance gated.</span>}
                    {application.rider && <span className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-800">Rider profile created · currently {application.rider.is_active ? "online" : "offline"}</span>}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-xs leading-5 text-red-800">
          Verification documents are private. Do not copy identity, licence, RC or bank details into support chats, spreadsheets or customer-facing screens.
        </div>
      </div>
    </main>
  );
}

"use client";

import type { KoboResult } from "@/types/kobo";
import { findAttachmentFor } from "@/utils/kobo";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function ItemRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm py-1">
      <div className="text-gray-500">{label}</div>
      <div className="col-span-2 text-gray-900">{value ?? "-"}</div>
    </div>
  );
}

function HSBlock({ idx, s }: { idx: 1 | 2 | 3 | 4 | 5; s: KoboResult }) {
  const prefix = `group_hs_${idx}/hs_${idx}_` as const;

  const getField = <K extends keyof KoboResult>(key: K): KoboResult[K] =>
    s[key];

  const q1 = getField(`${prefix}q1` as keyof KoboResult) as string | undefined;
  const q2 = getField(`${prefix}q2` as keyof KoboResult) as string | undefined;
  const q3 = getField(`${prefix}q3` as keyof KoboResult) as string | undefined;
  const q4 = getField(`${prefix}q4` as keyof KoboResult) as string | undefined;
  const q5 = getField(`${prefix}q5` as keyof KoboResult) as string | undefined;
  const q6 = getField(`${prefix}q6` as keyof KoboResult) as string | undefined;
  const q7 = getField(`${prefix}q7` as keyof KoboResult) as string | undefined;
  const q8 = getField(`${prefix}q8` as keyof KoboResult) as string | undefined;
  const q9 = getField(`${prefix}q9` as keyof KoboResult) as string | undefined;
  const q10 = getField(`${prefix}q10` as keyof KoboResult) as
    | string
    | undefined;

  const picXPath = `group_hs_${idx}/hs_${idx}_picture`;
  const attachment = findAttachmentFor(picXPath, s._attachments);

  return (
    <Section title={`House/Spot Verified ${idx}`}>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <ItemRow label="Location/Spot Number" value={q1} />
          <ItemRow label="Resident Name" value={q2} />
          <ItemRow label="Contact Number" value={q3} />
          <ItemRow label="House Inspected Inside" value={q4} />
          <ItemRow label="Last Visit Date" value={q5} />
          <ItemRow label="Roof Inspected" value={q6} />
          <ItemRow label="Larvae Found" value={q7} />
          <ItemRow label="Larvae Remaining" value={q8} />
          <ItemRow label="Awareness Provided" value={q9} />
          <ItemRow label="Work is Fake" value={q10} />
        </div>
        <div>
          {attachment ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  attachment.download_medium_url ||
                  attachment.download_small_url ||
                  attachment.download_url
                }
                alt={`HS ${idx} picture`}
                className="w-full rounded border object-cover"
              />
              <div className="text-xs text-gray-600 break-all">
                <a
                  className="text-blue-600 hover:underline"
                  href={attachment.download_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open original
                </a>
              </div>
            </div>
          ) : (
            <div className="h-32 rounded bg-gray-50 border text-xs text-gray-400 flex items-center justify-center">
              No picture
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

export default function SupervisionDetail({
  submission,
}: {
  submission: KoboResult;
}) {
  return (
    <main className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          Submission #{submission._id}
        </h1>
        <span className="text-xs text-gray-500">
          {submission._submission_time
            ? new Date(submission._submission_time).toLocaleString()
            : ""}
        </span>
      </div>

      <Section title="General">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <ItemRow label="Town" value={submission["group_general/town"]} />
            <ItemRow label="UC" value={submission["group_general/uc"]} />
            <ItemRow
              label="Supervisor CNIC"
              value={submission["group_general/supervisor_cnic"]}
            />
            <ItemRow
              label="Date of Visit"
              value={submission["group_general/Date_of_Visit"]}
            />
            <ItemRow
              label="Time of Visit"
              value={submission["group_general/Time_of_Visit"]}
            />
          </div>
          <div>
            <ItemRow
              label="Team Type"
              value={submission["group_general_001/Team_Type"]}
            />
            <ItemRow
              label="Dengue Team Number"
              value={submission["group_general_001/Dengue_Team_Number"]}
            />
            <ItemRow
              label="Team Member 1"
              value={submission["group_general_001/Team_Member_1_Name"]}
            />
            <ItemRow
              label="Team Member 2"
              value={submission["group_general_001/Team_Member_2_Name"]}
            />
            <ItemRow
              label="Area Address"
              value={submission["group_general_001/group_ln8pu96/area_address"]}
            />
          </div>
        </div>
      </Section>

      <HSBlock idx={1} s={submission} />
      <HSBlock idx={2} s={submission} />
      <HSBlock idx={3} s={submission} />
      <HSBlock idx={4} s={submission} />
      <HSBlock idx={5} s={submission} />

      <Section title="Attachments">
        <div className="space-y-2">
          {submission._attachments.map((a) => (
            <div key={a.id} className="text-xs text-gray-700 break-all">
              <div className="font-medium">{a.question_xpath}</div>
              <a
                className="text-blue-600 hover:underline"
                href={a.download_url}
                target="_blank"
                rel="noreferrer"
              >
                {a.filename}
              </a>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}

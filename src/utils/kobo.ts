import type { KoboAttachment, KoboResult } from "@/types/kobo";

export type ParsedLocation = {
  lat: number;
  lng: number;
  alt?: number;
  acc?: number;
};

/**
 * Parse a Kobo location string like "33.6352407 73.0899091 469.5 17.992"
 * Returns lat/lng and optionally altitude and accuracy if present.
 */
export function parseLocation(loc?: string | null): ParsedLocation | undefined {
  if (!loc) return undefined;
  const parts = loc
    .trim()
    .split(/\s+/)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  if (parts.length < 2) return undefined;
  const [lat, lng, alt, acc] = parts;
  const result: ParsedLocation = { lat, lng };
  if (typeof alt === "number") result.alt = alt;
  if (typeof acc === "number") result.acc = acc;
  return result;
}

/**
 * Find the attachment matching a specific question xpath (e.g., "group_hs_1/hs_1_picture")
 */
export function findAttachmentFor(
  questionXPath: string,
  attachments?: KoboAttachment[]
): KoboAttachment | undefined {
  if (!attachments) return undefined;
  return attachments.find((a) => a.question_xpath === questionXPath);
}

/**
 * Get a displayable thumbnail URL (small) from the first available attachment
 */
export function getFirstThumb(
  attachments?: KoboAttachment[]
): string | undefined {
  if (!attachments || attachments.length === 0) return undefined;
  return (
    attachments[0].download_small_url ??
    attachments[0].download_medium_url ??
    attachments[0].download_url
  );
}

/**
 * Analyze both team performance and supervisory quality based on findings across all houses
 */
export function analyzeSupervisoryQuality(s: KoboResult) {
  // Get all house data
  const houses = [1, 2, 3, 4, 5]
    .map((idx) => ({
      idx,
      houseInspected: s[
        `group_hs_${idx}/hs_${idx}_q4` as keyof KoboResult
      ] as string,
      roofInspected: s[
        `group_hs_${idx}/hs_${idx}_q6` as keyof KoboResult
      ] as string,
      larvaeFound: s[
        `group_hs_${idx}/hs_${idx}_q7` as keyof KoboResult
      ] as string,
      larvaeRemaining: s[
        `group_hs_${idx}/hs_${idx}_q8` as keyof KoboResult
      ] as string,
      awarenessProvided: s[
        `group_hs_${idx}/hs_${idx}_q9` as keyof KoboResult
      ] as string,
      workIsFake: s[
        `group_hs_${idx}/hs_${idx}_q10` as keyof KoboResult
      ] as string,
      hasData: Boolean(s[`group_hs_${idx}/hs_${idx}_q1` as keyof KoboResult]),
    }))
    .filter((house) => house.hasData);

  const totalHouses = houses.length;

  // TEAM PERFORMANCE ANALYSIS
  const teamFindings = {
    criticalIssues: [] as string[],
    warnings: [] as string[],
    positiveFindings: [] as string[],
  };

  // Team Critical Issues (poor field work)
  const fakeWorkHouses = houses.filter(
    (h) => h.workIsFake?.toLowerCase() === "yes"
  );
  if (fakeWorkHouses.length > 0) {
    teamFindings.criticalIssues.push(
      `Fake work in ${fakeWorkHouses.length} house(s)`
    );
  }

  const larvaeRemainingHouses = houses.filter(
    (h) => h.larvaeRemaining?.toLowerCase() === "yes"
  );
  if (larvaeRemainingHouses.length > 0) {
    teamFindings.criticalIssues.push(
      `Larvae left untreated in ${larvaeRemainingHouses.length} house(s)`
    );
  }

  const notInspectedHouses = houses.filter(
    (h) => h.houseInspected?.toLowerCase() === "no"
  );
  if (notInspectedHouses.length > 0) {
    teamFindings.criticalIssues.push(
      `${notInspectedHouses.length} house(s) not inspected inside`
    );
  }

  const roofNotInspectedHouses = houses.filter(
    (h) => h.roofInspected?.toLowerCase() === "no"
  );
  if (roofNotInspectedHouses.length > 0) {
    teamFindings.criticalIssues.push(
      `Roof not inspected in ${roofNotInspectedHouses.length} house(s)`
    );
  }

  const noAwarenessHouses = houses.filter(
    (h) => h.awarenessProvided?.toLowerCase() === "no"
  );
  if (noAwarenessHouses.length > 0) {
    teamFindings.criticalIssues.push(
      `No awareness provided in ${noAwarenessHouses.length} house(s)`
    );
  }

  // Team Warnings
  const larvaeFoundHouses = houses.filter(
    (h) => h.larvaeFound?.toLowerCase() === "yes"
  );
  if (larvaeFoundHouses.length === 0 && totalHouses > 0) {
    teamFindings.warnings.push(
      "No larvae found - could indicate missed breeding sites"
    );
  }

  // Team Positive Findings
  if (fakeWorkHouses.length === 0) {
    teamFindings.positiveFindings.push("All work appears genuine");
  }
  if (larvaeRemainingHouses.length === 0) {
    teamFindings.positiveFindings.push("All larvae properly treated");
  }
  if (notInspectedHouses.length === 0) {
    teamFindings.positiveFindings.push("All houses inspected inside");
  }
  if (roofNotInspectedHouses.length === 0) {
    teamFindings.positiveFindings.push("All roofs properly inspected");
  }
  if (noAwarenessHouses.length === 0) {
    teamFindings.positiveFindings.push("Awareness provided to all residents");
  }

  // SUPERVISORY QUALITY ANALYSIS
  const supervisoryFindings = {
    criticalIssues: [] as string[],
    warnings: [] as string[],
    positiveFindings: [] as string[],
  };

  // Calculate supervision duration
  let supervisionDurationMinutes = 0;

  if (s.start && s.end) {
    const startTime = new Date(s.start as string);
    const endTime = new Date(s.end as string);
    supervisionDurationMinutes = Math.round(
      (endTime.getTime() - startTime.getTime()) / (1000 * 60)
    );

    if (supervisionDurationMinutes < 5) {
      supervisoryFindings.criticalIssues.push(
        `Very short supervision duration (${supervisionDurationMinutes} minutes) - insufficient time for proper verification`
      );
    } else if (
      supervisionDurationMinutes >= 5 &&
      supervisionDurationMinutes <= 15
    ) {
      supervisoryFindings.warnings.push(
        `Short supervision duration (${supervisionDurationMinutes} minutes) - may not allow thorough verification`
      );
    } else {
      supervisoryFindings.positiveFindings.push(
        `Adequate supervision duration (${supervisionDurationMinutes} minutes) - sufficient time for thorough verification`
      );
    }
  }

  // Supervisory Quality: Finding issues shows GOOD supervision
  const totalIssuesFound =
    fakeWorkHouses.length +
    larvaeRemainingHouses.length +
    notInspectedHouses.length +
    roofNotInspectedHouses.length +
    noAwarenessHouses.length;

  if (totalIssuesFound > 0) {
    supervisoryFindings.positiveFindings.push(
      `Identified ${totalIssuesFound} team performance issue(s) - thorough verification`
    );
  }

  // Supervisory Critical Issues: Not finding any issues when there should be some
  if (larvaeFoundHouses.length === 0 && totalHouses > 0) {
    supervisoryFindings.warnings.push(
      "No larvae found in any house - verify if supervisor checked breeding sites thoroughly"
    );
  }

  // Supervisory Positive Findings
  if (fakeWorkHouses.length > 0) {
    supervisoryFindings.positiveFindings.push(
      "Successfully detected fake work"
    );
  }
  if (larvaeRemainingHouses.length > 0) {
    supervisoryFindings.positiveFindings.push("Caught untreated larvae");
  }
  if (notInspectedHouses.length > 0) {
    supervisoryFindings.positiveFindings.push(
      "Verified incomplete house inspections"
    );
  }
  if (roofNotInspectedHouses.length > 0) {
    supervisoryFindings.positiveFindings.push(
      "Identified missed roof inspections"
    );
  }
  if (noAwarenessHouses.length > 0) {
    supervisoryFindings.positiveFindings.push(
      "Caught missing awareness activities"
    );
  }

  if (totalIssuesFound === 0) {
    supervisoryFindings.positiveFindings.push(
      "Team work verified as satisfactory"
    );
  }

  // Calculate Team Grade - Consider severity of issues
  let teamGrade = "A";
  let teamGradeColor = "green";
  let teamGradeDescription = "Excellent team performance";

  if (teamFindings.criticalIssues.length > 0) {
    // Check for severe issues that affect multiple houses
    const severeIssues = teamFindings.criticalIssues.filter(
      (issue) =>
        issue.includes("3 house(s)") ||
        issue.includes("4 house(s)") ||
        issue.includes("5 house(s)")
    );

    if (severeIssues.length > 0 || teamFindings.criticalIssues.length >= 3) {
      teamGrade = "F";
      teamGradeColor = "red";
      teamGradeDescription =
        "Unacceptable team performance - immediate action required";
    } else if (teamFindings.criticalIssues.length === 2) {
      teamGrade = "D";
      teamGradeColor = "red";
      teamGradeDescription = "Poor team performance - retraining needed";
    } else {
      // Single issue but check if it's severe
      const singleSevereIssue = teamFindings.criticalIssues.some(
        (issue) => issue.includes("2 house(s)") || issue.includes("Fake work")
      );

      if (singleSevereIssue) {
        teamGrade = "D";
        teamGradeColor = "red";
        teamGradeDescription = "Serious team performance issues identified";
      } else {
        teamGrade = "C";
        teamGradeColor = "orange";
        teamGradeDescription = "Team performance needs improvement";
      }
    }
  } else if (teamFindings.warnings.length > 0) {
    teamGrade = "B";
    teamGradeColor = "yellow";
    teamGradeDescription = "Good team performance with minor concerns";
  }

  // Calculate Supervisory Grade
  let supervisoryGrade = "A";
  let supervisoryGradeColor = "green";
  let supervisoryGradeDescription = "Excellent supervisory verification";

  // Check for critical supervisory issues first (time-based)
  if (supervisoryFindings.criticalIssues.length > 0) {
    supervisoryGrade = "F";
    supervisoryGradeColor = "red";
    supervisoryGradeDescription =
      "Poor supervision - insufficient time spent for proper verification";
  } else if (supervisoryFindings.warnings.length > 0) {
    // Check if it's time-related warning or other concerns
    const hasTimeWarning = supervisoryFindings.warnings.some((w) =>
      w.includes("supervision duration")
    );
    const hasOtherWarnings = supervisoryFindings.warnings.some(
      (w) => !w.includes("supervision duration")
    );

    if (hasTimeWarning && hasOtherWarnings) {
      supervisoryGrade = "D";
      supervisoryGradeColor = "red";
      supervisoryGradeDescription =
        "Below standard supervision - time and verification concerns";
    } else if (hasTimeWarning) {
      supervisoryGrade = "C";
      supervisoryGradeColor = "orange";
      supervisoryGradeDescription =
        "Questionable supervision - limited time for thorough verification";
    } else {
      supervisoryGrade = "C";
      supervisoryGradeColor = "orange";
      supervisoryGradeDescription =
        "Supervision quality questionable - verification concerns identified";
    }
  } else if (totalIssuesFound > 0) {
    // Good supervision means finding issues (if they exist)
    supervisoryGradeDescription =
      "Thorough supervision - issues properly identified";
  } else {
    // No issues found and no concerns - could be good or could indicate missed issues
    supervisoryGradeDescription = "Team work verified as satisfactory";
  }

  return {
    totalHouses,
    supervisionDurationMinutes,
    teamAnalysis: {
      grade: teamGrade,
      gradeColor: teamGradeColor,
      gradeDescription: teamGradeDescription,
      findings: teamFindings,
    },
    supervisoryAnalysis: {
      grade: supervisoryGrade,
      gradeColor: supervisoryGradeColor,
      gradeDescription: supervisoryGradeDescription,
      findings: supervisoryFindings,
    },
    // Legacy support for existing components
    grade: supervisoryGrade,
    gradeColor: supervisoryGradeColor,
    gradeDescription: supervisoryGradeDescription,
    findings: supervisoryFindings,
    housesAnalyzed: houses,
  };
}

/**
 * Extract quick insights for a submission to show on list cards.
 */
export function getSubmissionInsights(s: KoboResult) {
  const hsCount = [
    s["group_hs_1/hs_1_q1"],
    s["group_hs_2/hs_2_q1"],
    s["group_hs_3/hs_3_q1"],
    s["group_hs_4/hs_4_q1"],
    s["group_hs_5/hs_5_q1"],
  ].filter(Boolean).length;

  // Risk flags based on the actual questions
  const riskFlags: string[] = [];

  // Check for larvae found (q7 = "کیا  ٹیم کو لاروہ ملا؟")
  const larvaeFoundFields = [
    s["group_hs_1/hs_1_q7"],
    s["group_hs_2/hs_2_q7"],
    s["group_hs_3/hs_3_q7"],
    s["group_hs_4/hs_4_q7"],
    s["group_hs_5/hs_5_q7"],
  ];
  if (larvaeFoundFields.some((v) => (v ?? "").toLowerCase() === "yes")) {
    riskFlags.push("Larvae Found");
  }

  // Check for larvae remaining (q8 = "کیا ٹیم سے لاروہ رہ گیا؟")
  const larvaeRemainingFields = [
    s["group_hs_1/hs_1_q8"],
    s["group_hs_2/hs_2_q8"],
    s["group_hs_3/hs_3_q8"],
    s["group_hs_4/hs_4_q8"],
    s["group_hs_5/hs_5_q8"],
  ];
  if (larvaeRemainingFields.some((v) => (v ?? "").toLowerCase() === "yes")) {
    riskFlags.push("Larvae Remaining");
  }

  // Check for fake work (q10 = "کیا ٹیم کا کام اس گھر میں fake ہے؟")
  const fakeWorkFields = [
    s["group_hs_1/hs_1_q10"],
    s["group_hs_2/hs_2_q10"],
    s["group_hs_3/hs_3_q10"],
    s["group_hs_4/hs_4_q10"],
    s["group_hs_5/hs_5_q10"],
  ];
  if (fakeWorkFields.some((v) => (v ?? "").toLowerCase() === "yes")) {
    riskFlags.push("Fake Work Detected");
  }

  // Check for incomplete inspections (q4 = "کیا ٹیم نے اندر سے گھر کا معائنہ کیا" or q6 = "کیا ٹیم نے چھت کا معائنہ کیا؟")
  const incompleteInspectionFields = [
    s["group_hs_1/hs_1_q4"],
    s["group_hs_1/hs_1_q6"],
    s["group_hs_2/hs_2_q4"],
    s["group_hs_2/hs_2_q6"],
    s["group_hs_3/hs_3_q4"],
    s["group_hs_3/hs_3_q6"],
    s["group_hs_4/hs_4_q4"],
    s["group_hs_4/hs_4_q6"],
    s["group_hs_5/hs_5_q4"],
    s["group_hs_5/hs_5_q6"],
  ];
  if (
    incompleteInspectionFields.some((v) => (v ?? "").toLowerCase() === "no")
  ) {
    riskFlags.push("Incomplete Inspection");
  }

  // Check for missing awareness (q9 = "کیا ٹیم نے اس دورے میں گھر والوں کو ڈینگی کے بارے میں آگاہی دی ہے؟")
  const noAwarenessFields = [
    s["group_hs_1/hs_1_q9"],
    s["group_hs_2/hs_2_q9"],
    s["group_hs_3/hs_3_q9"],
    s["group_hs_4/hs_4_q9"],
    s["group_hs_5/hs_5_q9"],
  ];
  if (noAwarenessFields.some((v) => (v ?? "").toLowerCase() === "no")) {
    riskFlags.push("No Awareness Provided");
  }

  return {
    hsCount,
    riskFlags,
    town: s["group_general/town"],
    uc: s["group_general/uc"],
    supervisorCnic: s["group_general/supervisor_cnic"],
    visitDate: s["group_general/Date_of_Visit"],
    visitTime: s["group_general/Time_of_Visit"],
    teamType: s["group_general_001/Team_Type"],
    teamMember1: s["group_general_001/Team_Member_1_Name"],
    teamMember2: s["group_general_001/Team_Member_2_Name"],
    areaAddress: s["group_general_001/group_ln8pu96/area_address"],
    thumb: getFirstThumb(s._attachments),
  };
}

export function humanizeSupabaseError(err) {
  const msg = (err?.message || "").toLowerCase();
  const code = err?.code; // vaak '23505', '42501', 'PGRST116', ...

  // 23505 = unique violation (duplicate) [web:275]
  if (code === "23505") {
    // specifiek voor jouw DONE constraint naam
    if (msg.includes("uq_checkin_once_per_user")) {
      return "Je hebt deze challenge al afgevinkt. Je kan dit maar één keer doen.";
    }
    return "Dat bestaat al. Probeer iets anders.";
  }

  // 42501 = onvoldoende rechten (RLS/privileges) [web:284][web:290]
  if (code === "42501" || msg.includes("row-level security") || msg.includes("violates row-level security")) {
    return "Je hebt geen toegang om dit te doen. Log opnieuw in of contacteer de coach.";
  }

  // 23503 = foreign key violation (bv. post verwijst naar challenge die niet bestaat) [web:275]
  if (code === "23503") {
    return "Er ging iets mis met de koppeling (bv. challenge bestaat niet meer). Herlaad de pagina en probeer opnieuw.";
  }

  // Rate limit (auth) herkenning
  if (msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("429")) {
    return "Je probeert te snel na elkaar. Wacht even en probeer opnieuw.";
  }

  // Offline / netwerk
  if (msg.includes("failed to fetch") || msg.includes("network")) {
    return "Geen internetverbinding of server onbereikbaar. Probeer opnieuw.";
  }

  return "Er ging iets mis. Probeer opnieuw.";
}

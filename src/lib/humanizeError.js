export function humanizeSupabaseError(err) {
  const msg = (err?.message || "").toLowerCase();
  const code = err?.code;

  if (code === "23505") {
    if (msg.includes("uq_checkin_once_per_user")) {
      return "Je hebt deze challenge al afgevinkt. Dit kan maar één keer.";
    }
    if (msg.includes("post_likes")) {
      return "Je hebt dit al geliket.";
    }
    return "Dit bestaat al. Probeer iets anders.";
  }

  if (code === "42501" || msg.includes("row-level security") || msg.includes("violates row-level security")) {
    return "Je hebt geen rechten om dit te doen.";
  }

  if (code === "23503") {
    return "Er ging iets mis met de koppeling (bv. challenge bestaat niet meer). Herlaad en probeer opnieuw.";
  }

  if (msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("429")) {
    return "Je probeert te snel na elkaar. Wacht even en probeer opnieuw.";
  }

  if (msg.includes("failed to fetch") || msg.includes("network")) {
    return "Geen internetverbinding of server onbereikbaar. Probeer opnieuw.";
  }

  return "Er ging iets mis. Probeer opnieuw.";
}

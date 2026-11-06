import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { auth } from "../auth";
import { ADMIN_EMAIL } from "../lib/business";

const isAdmin = (email?: string | null) => !!email && email.toLowerCase() === ADMIN_EMAIL;

/** Sessione opzionale: `context.isAdmin` vero solo per l'account autorizzato. */
export const withUser = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  return next({
    context: { user: session?.user ?? null, isAdmin: isAdmin(session?.user.email) },
  });
});

/** Procedure della dashboard: solo l'email amministratore, verificata lato server. */
export const adminOnly = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  if (!session) throw new ORPCError("UNAUTHORIZED", { message: "Accesso richiesto" });
  if (!isAdmin(session.user.email)) throw new ORPCError("FORBIDDEN", { message: "Non autorizzato" });
  return next({ context: { user: session.user } });
});

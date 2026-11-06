import { createAuthClient } from "better-auth/react";

/**
 * Sessione amministratore: token bearer in sessionStorage (funziona anche dentro
 * l'iframe di anteprima, dove i cookie di terze parti sono bloccati). Si cancella
 * chiudendo la scheda.
 */
const TOKEN_KEY = "ia-admin-token";

export function getAuthToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setAuthToken(token: string) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage non disponibile */
  }
}

export const authClient = createAuthClient({
  baseURL: window.location.origin,
  basePath: "/api/auth",
  fetchOptions: {
    auth: { type: "Bearer", token: () => getAuthToken() },
    onSuccess: (ctx) => {
      const token = ctx.response.headers.get("set-auth-token");
      if (token) setAuthToken(token);
    },
  },
});

export async function signOut() {
  try {
    await authClient.signOut();
  } finally {
    setAuthToken("");
  }
}

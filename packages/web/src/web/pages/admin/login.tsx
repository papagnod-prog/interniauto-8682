import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Lock } from "lucide-react";
import { authClient, getAuthToken } from "../../lib/auth";

export default function AdminLoginPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.title = "Accesso dashboard · Interni Auto";
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await authClient.signIn.email({ email: email.trim(), password });
      if (res.error || !getAuthToken()) {
        const status = res.error?.status;
        setError(
          status === 429
            ? "Troppi tentativi. Riprova tra 15 minuti."
            : status === 403
              ? "Questo account non è autorizzato alla dashboard."
              : "Email o password non corretti.",
        );
        return;
      }
      await qc.invalidateQueries();
      navigate("/admin", { replace: true });
    } catch {
      setError("Servizio non raggiungibile. Riprova.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="bp-site">
      <main className="bp-login">
        <form className="bp-login-card" onSubmit={submit}>
          <img className="bp-wordmark" src="/images/boutique/wordmark-dark.png" alt="Interni Auto — Luxury Boutique" />
          <p className="bp-eyebrow">AREA RISERVATA</p>
          <h1>Dashboard</h1>
          <label className="bp-field" htmlFor="login-email">
            <span>Email</span>
            <input aria-label="Email"
              id="login-email"
              className="bp-input"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="bp-field" htmlFor="login-password">
            <span>Password</span>
            <input aria-label="Password"
              id="login-password"
              className="bp-input"
              type="password"
              autoComplete="current-password"
              required
              minLength={12}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <p className="bp-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="bp-button bp-button-block" disabled={pending}>
            {pending ? <Loader2 size={16} className="bp-spin" aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
            Accedi
          </button>
          <p className="bp-detail-bottom-note">Accesso riservato al titolare. Nessuna registrazione pubblica.</p>
        </form>
      </main>
    </div>
  );
}

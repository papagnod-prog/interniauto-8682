import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { APIError } from "better-auth/api";
import { db } from "./database";

const ADMIN = "info@interniautodesign.it";

/**
 * Solo accesso email/password per l'unico amministratore. Registrazione pubblica
 * disabilitata; ogni sessione per email diverse viene rifiutata lato server.
 */
export const auth = betterAuth({
  basePath: "/api/auth",
  baseURL: process.env.WEBSITE_URL,
  database: drizzleAdapter(db, { provider: "sqlite" }),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 15 * 60, max: 5 },
      "/request-password-reset": { window: 60 * 60, max: 3 },
    },
  },
  advanced: {
    ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip"] },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await db.query.user.findFirst({
            where: (u, { eq }) => eq(u.id, session.userId),
          });
          if (!user || user.email.toLowerCase() !== ADMIN) {
            throw new APIError("FORBIDDEN", { message: "Accesso non autorizzato" });
          }
          return { data: session };
        },
      },
    },
  },
  trustedOrigins: (request) => {
    const origin = request?.headers.get("origin");
    return origin ? [origin] : ["*"];
  },
  plugins: [bearer()],
});

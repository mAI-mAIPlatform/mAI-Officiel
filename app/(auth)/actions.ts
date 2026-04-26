"use server";

import { headers } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

import { anonymizeAndDisableUser, createUser, getUser, getUserById, updateUserPasswordByEmail } from "@/lib/db/queries";
import { checkScopedRateLimit } from "@/lib/ratelimit";

import { auth, signIn } from "./auth";

const authFormSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Za-z]/, "Le mot de passe doit contenir des lettres.")
    .regex(/[0-9]/, "Le mot de passe doit contenir des chiffres."),
});

const passwordResetSchema = z.object({ email: z.string().email() });
const newPasswordSchema = z.object({
  token: z.string().min(20),
  password: authFormSchema.shape.password,
});
const RESET_TTL_SECONDS = 60 * 30;
const RESET_SECRET = process.env.AUTH_SECRET ?? "dev-reset-secret";

function createResetToken(email: string) {
  const expiry = Math.floor(Date.now() / 1000) + RESET_TTL_SECONDS;
  const payload = `${email.toLowerCase().trim()}|${expiry}`;
  const signature = createHmac("sha256", RESET_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}|${signature}`).toString("base64url");
}

function verifyResetToken(token: string) {
  const decoded = Buffer.from(token, "base64url").toString("utf8");
  const [email, expiryRaw, signature] = decoded.split("|");
  if (!email || !expiryRaw || !signature) return null;
  const payload = `${email}|${expiryRaw}`;
  const expected = createHmac("sha256", RESET_SECRET).update(payload).digest("hex");
  if (signature.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const expiry = Number(expiryRaw);
  if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) return null;
  return { email };
}

export type LoginActionState = {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "invalid_data"
    | "rate_limited";
};

const WEEK_IN_SECONDS = 60 * 60 * 24 * 7;
const MONTH_IN_SECONDS = 60 * 60 * 24 * 30;

async function getRequestIpAddress() {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const realIp = headerList.get("x-real-ip");
  const cfIp = headerList.get("cf-connecting-ip");
  const candidate = forwardedFor?.split(",")[0]?.trim() || realIp || cfIp;
  return candidate?.trim() || "unknown";
}

export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  try {
    const ipAddress = await getRequestIpAddress();
    const limitResult = await checkScopedRateLimit({
      key: `auth:login:${ipAddress}`,
      maxAttempts: 3,
      ttlSeconds: WEEK_IN_SECONDS,
    });
    if (!limitResult.allowed) {
      return { status: "rate_limited" };
    }

    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};

export type RegisterActionState = {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data"
    | "rate_limited";
};

export async function requestPasswordReset(
  _: { status: "idle" | "success" | "failed" },
  formData: FormData
) {
  try {
    const validated = passwordResetSchema.parse({ email: formData.get("email") });
    const userList = await getUser(validated.email);
    if (!userList[0]) return { status: "success" } as const;
    const token = createResetToken(validated.email);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    console.info(`Reset link for ${validated.email}: ${baseUrl}/reset-password/${token}`);
    return { status: "success" as const };
  } catch {
    return { status: "failed" as const };
  }
}

export async function resetPasswordWithToken(
  _: { status: "idle" | "success" | "failed" | "invalid_token" | "invalid_data" },
  formData: FormData
) {
  try {
    const validated = newPasswordSchema.parse({
      token: formData.get("token"),
      password: formData.get("password"),
    });
    const parsed = verifyResetToken(validated.token);
    if (!parsed) return { status: "invalid_token" as const };
    await updateUserPasswordByEmail(parsed.email, validated.password);
    return { status: "success" as const };
  } catch (error) {
    if (error instanceof z.ZodError) return { status: "invalid_data" as const };
    return { status: "failed" as const };
  }
}

export async function getAccountSnapshot() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  const rows = await getUserById(userId);
  const current = rows[0];
  if (!current) throw new Error("Utilisateur introuvable");
  return {
    email: current.email,
    provider: session.user.provider ?? (session.user.type === "guest" ? "guest" : "credentials"),
    createdAt: current.createdAt,
  };
}

export async function deleteMyAccount() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  await anonymizeAndDisableUser(userId);
  return { success: true };
}

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  try {
    const ipAddress = await getRequestIpAddress();
    const limitResult = await checkScopedRateLimit({
      key: `auth:register:${ipAddress}`,
      maxAttempts: 1,
      ttlSeconds: MONTH_IN_SECONDS,
    });
    if (!limitResult.allowed) {
      return { status: "rate_limited" };
    }

    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const [user] = await getUser(validatedData.email);

    if (user) {
      return { status: "user_exists" } as RegisterActionState;
    }
    await createUser(validatedData.email, validatedData.password);
    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};

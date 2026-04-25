"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { createUser, getUser } from "@/lib/db/queries";
import { checkScopedRateLimit } from "@/lib/ratelimit";

import { signIn } from "./auth";

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

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

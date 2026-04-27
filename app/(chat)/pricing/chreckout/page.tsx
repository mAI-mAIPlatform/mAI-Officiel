import { redirect } from "next/navigation";

export default async function ChreckoutAliasPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const plan = params.plan ? `?plan=${encodeURIComponent(params.plan)}` : "";
  redirect(`/pricing/checkout${plan}`);
}

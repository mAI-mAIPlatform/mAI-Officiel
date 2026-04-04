import { auth } from "@/app/(auth)/auth";
import { getAllGatewayModels, getCapabilities, isDemo } from "@/lib/ai/models";
import { getAgentsByUser } from "@/lib/db/queries";

export async function GET() {
  const headers = {
    "Cache-Control": "public, max-age=86400, s-maxage=86400",
  };

  const curatedCapabilities = await getCapabilities();

  const session = await auth();
  let customAgents: any[] = [];
  if (session?.user?.id) {
    customAgents = await getAgentsByUser(session.user.id);
  }

  if (isDemo) {
    const models = await getAllGatewayModels();
    const capabilities = Object.fromEntries(
      models.map((m) => [m.id, curatedCapabilities[m.id] ?? m.capabilities])
    );

    return Response.json({ capabilities, models, customAgents }, { headers });
  }

  return Response.json(
    { capabilities: curatedCapabilities, customAgents },
    { headers }
  );
}

import { NextResponse } from "next/server";
import { getProjectAccess } from "@/lib/db/queries";
import type { ProjectMemberRole } from "@/lib/db/schema";

const ROLE_WEIGHT: Record<ProjectMemberRole, number> = {
  owner: 3,
  editor: 2,
  viewer: 1,
};

export async function requireProjectRole(
  projectId: string,
  userId: string,
  minimumRole: ProjectMemberRole
) {
  const access = await getProjectAccess(projectId, userId);

  if (!access) {
    return {
      access: null,
      response: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  if (ROLE_WEIGHT[access.role] < ROLE_WEIGHT[minimumRole]) {
    return {
      access,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { access, response: null };
}

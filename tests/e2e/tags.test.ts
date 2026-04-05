import { expect, test } from "@playwright/test";

test.describe("Tags API", () => {
  test("bloque les endpoints tags sans session", async ({ request }) => {
    const response = await request.get("/api/tags");
    expect([401, 500]).toContain(response.status());
  });
});

test.describe("Filtre global par tag", () => {
  test("filtre les conversations via le préfixe #", async ({ page }) => {
    await page.route("**/api/history?limit=20", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          chats: [
            {
              createdAt: new Date().toISOString(),
              id: "11111111-1111-1111-1111-111111111111",
              tags: [{ color: "#22c55e", id: "a", name: "Work" }],
              title: "Projet alpha",
              userId: "u1",
              visibility: "private",
            },
            {
              createdAt: new Date().toISOString(),
              id: "22222222-2222-2222-2222-222222222222",
              tags: [{ color: "#60a5fa", id: "b", name: "Personal" }],
              title: "Vacances",
              userId: "u1",
              visibility: "private",
            },
          ],
          hasMore: false,
        }),
        contentType: "application/json",
      });
    });

    await page.goto("/");

    const searchInput = page.locator("#global-sidebar-search");
    await searchInput.fill("#work");

    await expect(page.getByText("Projet alpha")).toBeVisible();
    await expect(page.getByText("Vacances")).not.toBeVisible();
    await expect(page.getByText("#Work")).toBeVisible();
  });
});

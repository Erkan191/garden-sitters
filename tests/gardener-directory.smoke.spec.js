const { test, expect } = require("@playwright/test");

const userId = "00000000-0000-4000-8000-000000000001";
const complete = { id: userId, role: "both", full_name: "Complete Gardener", location: "Enfield", bio: "I care for gardens.", country: "GB", currency: "GBP", signup_role_applied: true, age_confirmed_at: "2026-10-01T00:00:00Z" };

test("directory requires a gardener role, name and area, but not a bio", async ({ page }) => {
  await page.route("**/rest/v1/profiles?**", async (route) => {
    expect(new URL(route.request().url()).searchParams.get("role")).toBe("in.(gardener,both)");
    await route.fulfill({ json: [complete,
      { ...complete, id: "blank", full_name: "  ", stripe_account_id: "acct_test" },
      { ...complete, id: "no-bio", full_name: "Needs Bio", bio: null },
      { ...complete, id: "owner", role: "owner", full_name: "Owner With Skills", skill_watering: true },
      { ...complete, id: "legacy", full_name: null, display_name: "Legacy Gardener", location: null, postcode: "N13" },
    ] });
  });
  await page.route("**/rest/v1/reviews?**", (route) => route.fulfill({ json: [] }));
  await page.goto("/sitters");
  await expect(page.getByRole("heading", { name: "Complete Gardener", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Legacy Gardener", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Needs Bio" })).toBeVisible();
  await expect(page.getByText("Showing 3 of 3 sitters")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Owner With Skills" })).toHaveCount(0);
});

async function mockProfile(page, initial) {
  let profile = { ...initial };
  const writes = [];
  const metadataWrites = [];
  const user = { id: userId, email: "regression@example.invalid", aud: "authenticated", role: "authenticated", user_metadata: {}, app_metadata: { provider: "email" } };
  await page.addInitScript(({ user }) => {
    const session = { access_token: "test-access-token", refresh_token: "test-refresh-token", expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: "bearer", user };
    localStorage.setItem("sb-ylhuwkhlafzlkqwglvwq-auth-token", JSON.stringify(session));
  }, { user });
  await page.route("**/auth/v1/user", async (route) => {
    if (route.request().method() === "PUT") {
      const payload = route.request().postDataJSON();
      metadataWrites.push(payload);
      if (!profile.signup_role_applied) profile = { ...profile, role: payload.data.signup_intent, signup_role_applied: true };
    }
    await route.fulfill({ json: user });
  });
  await page.route("**/rest/v1/profiles?**", async (route) => {
    if (route.request().method() === "PATCH") {
      const payload = route.request().postDataJSON();
      writes.push(payload);
      profile = { ...profile, ...payload };
    }
    await route.fulfill({ json: profile });
  });
  return { writes, metadataWrites };
}

test("old welcome links cannot overwrite established role choices", async ({ page }) => {
  const { writes, metadataWrites } = await mockProfile(page, complete);
  await page.goto("/profile?welcome=owner");
  await expect(page.getByLabel("How you use Watch My Plot")).toHaveValue("both");
  await page.getByRole("button", { name: /save (gardener )?profile/i }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).not.toHaveProperty("role");
  expect(metadataWrites).toHaveLength(0);
  await expect(page.getByLabel("How you use Watch My Plot")).toHaveValue("both");
});

test("explicit role choice is saved and directory status explains eligibility", async ({ page }) => {
  const { writes } = await mockProfile(page, complete);
  await page.goto("/profile?welcome=gardener");
  await page.getByLabel("How you use Watch My Plot").selectOption("owner");
  await page.getByRole("button", { name: /save (gardener )?profile/i }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0].role).toBe("owner");
  await expect(page.getByRole("status")).toContainText("Choose Gardener or Both");
});

test("provider-created account consumes delayed gardener intent once", async ({ page }) => {
  const { metadataWrites } = await mockProfile(page, { ...complete, role: "owner", signup_role_applied: false, bio: null });
  await page.goto("/profile?welcome=gardener");
  await expect(page.getByLabel("How you use Watch My Plot")).toHaveValue("gardener");
  expect(metadataWrites).toHaveLength(1);
  await expect(page.getByRole("status")).toContainText("listed in the sitter directory");
  await page.reload();
  await expect(page.getByLabel("How you use Watch My Plot")).toHaveValue("gardener");
  expect(metadataWrites).toHaveLength(1);
});

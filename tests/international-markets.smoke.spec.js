const { test, expect } = require("@playwright/test");

test("country selection persists and updates displayed currency", async ({ page }) => {
  await page.goto("/");

  const selector = page.getByRole("combobox", { name: "Current country" });
  await expect(selector).toHaveValue("GB");
  await expect(page.getByText("£28.00", { exact: true })).toBeVisible();

  await selector.selectOption("AU");
  await expect(selector).toHaveValue("AU");
  await expect(page.getByText("A$28.00", { exact: true })).toBeVisible();

  await page.reload();
  await expect(selector).toHaveValue("AU");
  await expect(page.getByText("A$28.00", { exact: true })).toBeVisible();

  await selector.selectOption("NZ");
  await expect(selector).toHaveValue("NZ");
  await expect(page.getByText("NZ$28.00", { exact: true })).toBeVisible();
});

test("public safeguards and current marketplace terms are visible", async ({ page }) => {
  await page.goto("/signup");

  await expect(
    page.getByRole("checkbox", { name: /I confirm that I am 18 or over/i })
  ).toBeVisible();

  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Adults only" })).toBeVisible();
  await expect(page.getByText(/platform fee equal to 15%/i)).toBeVisible();
  await expect(page.getByText(/does not currently provide an insurance policy/i)).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/\bbeta\b/i);
});

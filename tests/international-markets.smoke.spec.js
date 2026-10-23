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

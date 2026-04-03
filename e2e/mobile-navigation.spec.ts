import { expect, test, devices } from "@playwright/test";

test.use({
  ...devices["Pixel 7"],
});

test("mobile landing menu opens and routes to login", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Menu" }).click();
  const mobileMenu = page.locator("#landing-mobile-menu");

  await expect(
    mobileMenu.getByRole("button", { name: "How it works", exact: true }),
  ).toBeVisible();

  await mobileMenu.getByRole("button", { name: "Log in", exact: true }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("button", { name: /Continue with Google/i }),
  ).toBeVisible();
});

import { expect, test } from "@playwright/test";

test("login requires accepting terms before continuing", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("button", { name: /Continue with Google/i }).click();

  await expect(
    page.getByText(
      "Please accept the Terms of Service and Privacy Policy to continue.",
    ),
  ).toBeVisible();
});

test("signup links to legal pages from the consent copy", async ({ page }) => {
  await page.goto("/signup");

  await page.getByRole("link", { name: "Terms of Service" }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(
    page.getByRole("heading", { name: "Terms of Service" }).first(),
  ).toBeVisible();

  await page.goto("/signup");

  await page.getByRole("link", { name: "Privacy Policy" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(
    page.getByRole("heading", { name: "Privacy Policy" }).first(),
  ).toBeVisible();
});

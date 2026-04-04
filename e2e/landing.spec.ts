import { expect, test } from "@playwright/test";

test("landing routes users into signup from the primary CTA", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /Stop drifting away from the life/i,
    }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Start free" }).first().click();

  await expect(page).toHaveURL(/\/signup$/);
  await expect(
    page.getByRole("button", { name: /Continue with Google/i }),
  ).toBeVisible();
});

test("landing header login takes users to the login page", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("button", { name: /Continue with Google/i }),
  ).toBeVisible();
});

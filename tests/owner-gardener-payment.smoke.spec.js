const { test, expect } = require("@playwright/test");
const process = require("node:process");

const REQUIRED_ENV = [
  "E2E_OWNER_EMAIL",
  "E2E_OWNER_PASSWORD",
  "E2E_GARDENER_EMAIL",
  "E2E_GARDENER_PASSWORD",
];

function readSmokeEnv() {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required smoke test environment variables: ${missing.join(
        ", "
      )}. Set them locally, then run npm.cmd run test:smoke. Do not commit real values.`
    );
  }

  return {
    ownerEmail: process.env.E2E_OWNER_EMAIL,
    ownerPassword: process.env.E2E_OWNER_PASSWORD,
    gardenerEmail: process.env.E2E_GARDENER_EMAIL,
    gardenerPassword: process.env.E2E_GARDENER_PASSWORD,
  };
}

let smokeEnv;

test.beforeAll(() => {
  smokeEnv = readSmokeEnv();
});

function futureDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

async function isVisible(locator, timeout = 1500) {
  try {
    await locator.first().waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

async function loginAs(page, email, password, roleName) {
  await page.goto("/login");

  await expect(
    page.getByRole("heading", { name: /access your account/i }),
    `${roleName} login page should load`
  ).toBeVisible();

  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("Your password").fill(password);
  await page.getByRole("button", { name: /^log in$/i }).click();

  await page.waitForURL(/\/dashboard(?:\?|$)/, {
    timeout: 30000,
  });

  await expect(
    page.getByRole("button", { name: /log out/i }).first(),
    `${roleName} should be logged in and see a logout button`
  ).toBeVisible();
}

async function logout(page) {
  const logoutButton = page.getByRole("button", { name: /log out/i }).first();

  if (await isVisible(logoutButton, 5000)) {
    await logoutButton.click();
  }

  await expect(
    page.getByRole("link", { name: /^log in$/i }).first(),
    "User should be logged out"
  ).toBeVisible({ timeout: 15000 });
}

async function saveProfileIfPossible(page) {
  await page.goto("/profile");

  const saveButton = page.getByRole("button", { name: /save profile/i });

  if (!(await isVisible(saveButton, 20000))) {
    return;
  }

  await saveButton.click();

  await expect(
    page.getByText(/Profile saved/i),
    "Profile save should complete successfully"
  ).toBeVisible({ timeout: 20000 });
}

async function createCareRequest(page, requestTitle) {
  await page.goto("/requests/new");

  const requestForm = page.locator("form").filter({
    has: page.getByRole("button", { name: /^(post|create) request$/i }),
  });

  await expect(
    page.getByRole("heading", { name: /(post.*request|garden care request)/i }),
    "New request page should load"
  ).toBeVisible();

  await expect(requestForm, "New request form should load").toBeVisible();

  await requestForm
    .getByPlaceholder(/Water veg beds and check greenhouse tomatoes/i)
    .fill(requestTitle);
  await requestForm
    .getByPlaceholder(/What needs doing/i)
    .fill("Automated smoke test request. Safe to close after verification.");
  await requestForm.getByPlaceholder(/e\.g\. N13/i).fill("N13");

  const dateInputs = requestForm.locator('input[type="date"]');
  await dateInputs.nth(0).fill(futureDate(7));
  await dateInputs.nth(1).fill(futureDate(10));

  await requestForm.getByPlaceholder(/e\.g\. 30/i).fill("1.00");
  await requestForm
    .getByRole("button", { name: /^(post|create) request$/i })
    .click();

  await page.waitForURL(/\/requests\/[^/]+$/, {
    timeout: 30000,
  });

  await expect(
    page.getByText(requestTitle, { exact: true }),
    "Created request detail page should show the unique title"
  ).toBeVisible();

  return new URL(page.url()).pathname;
}

async function openRequestFromBrowse(page, requestTitle) {
  await page.goto("/requests");

  const requestLink = page.locator("a").filter({ hasText: requestTitle }).first();

  await expect(
    requestLink,
    "Gardener should find the newly created open request"
  ).toBeVisible({ timeout: 30000 });

  await requestLink.click();

  await expect(
    page.getByText(requestTitle, { exact: true }),
    "Request detail should open from browse"
  ).toBeVisible();
}

async function submitOffer(page, requestTitle) {
  const offerPanel = page.locator("section#send-offer").filter({
    has: page.getByRole("heading", { name: /offer to help/i }),
  });
  const offerForm = offerPanel.locator("form").filter({
    has: page.getByRole("button", { name: /^send offer$/i }),
  });

  await expect(
    offerPanel.getByRole("heading", { name: /offer to help/i }),
    "Offer form should be available to the gardener"
  ).toBeVisible({ timeout: 20000 });

  await expect(offerForm, "Offer form should have a send action").toBeVisible();

  await offerForm
    .getByPlaceholder(/briefly explain the visits/i)
    .fill(`Automated smoke offer for ${requestTitle}`);
  await offerForm.locator('input[type="number"]').fill("1.00");
  await offerForm.getByRole("button", { name: /^send offer$/i }).click();

  await expect(
    page.locator("body"),
    "Offer submission should be acknowledged"
  ).toContainText(/Offer sent|Your offer has been sent/i, { timeout: 20000 });
}

async function acceptGardenerOffer(page) {
  const payoutSetupWarning = page.getByText(
    /Gardener needs to connect payouts before this offer can be accepted/i
  );

  if (await isVisible(payoutSetupWarning, 3000)) {
    throw new Error(
      "Cannot accept the smoke-test offer because E2E_GARDENER has not completed Stripe payout onboarding."
    );
  }

  const acceptButton = page.getByRole("button", { name: /accept offer/i });

  await expect(
    acceptButton,
    "Owner should see an enabled Accept offer button"
  ).toBeVisible({ timeout: 20000 });

  await acceptButton.click();

  await expect(
    page.locator("body"),
    "Offer acceptance should update the request"
  ).toContainText(/Offer accepted|Accepted/i, { timeout: 20000 });
}

async function startCheckout(page, requestTitle) {
  const checkoutButtonName = /confirm booking and pay/i;
  const detailPayButton = page
    .getByRole("button", { name: checkoutButtonName })
    .first();

  if (await isVisible(detailPayButton, 10000)) {
    await detailPayButton.click();
  } else {
    await page.goto("/dashboard");

    await expect(
      page.getByText(requestTitle, { exact: true }),
      "Owner dashboard should show the accepted request before checkout"
    ).toBeVisible({ timeout: 30000 });

    const requestCard = page
      .locator("div")
      .filter({ hasText: requestTitle })
      .filter({ has: page.getByRole("button", { name: checkoutButtonName }) })
      .first();

    const dashboardPayButton = requestCard
      .getByRole("button", { name: checkoutButtonName })
      .first();

    await expect(
      dashboardPayButton,
      "Owner should be able to start checkout from the accepted request"
    ).toBeVisible({ timeout: 20000 });

    await dashboardPayButton.click();
  }

  await expect
    .poll(() => page.url(), {
      message: "Starting checkout should redirect to Stripe Checkout",
      timeout: 60000,
    })
    .toMatch(/checkout\.stripe\.com/);
}

function stripeContexts(page) {
  return [page, ...page.frames()];
}

async function fillFirstVisible(page, candidates, value, description, timeout = 30000) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    for (const context of stripeContexts(page)) {
      for (const buildLocator of candidates) {
        try {
          const locator = buildLocator(context).first();
          await locator.waitFor({ state: "visible", timeout: 700 });
          await locator.fill(value, { timeout: 5000 });
          return true;
        } catch {
          // Try the next selector/context. Stripe moves fields between layouts.
        }
      }
    }

    await page.waitForTimeout(500);
  }

  throw new Error(`Could not fill ${description} in Stripe Checkout.`);
}

async function fillFirstVisibleIfPresent(page, candidates, value) {
  try {
    await fillFirstVisible(page, candidates, value, "optional Stripe field", 5000);
    return true;
  } catch {
    return false;
  }
}

async function clickFirstVisible(page, candidates, description, timeout = 30000) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    for (const context of stripeContexts(page)) {
      for (const buildLocator of candidates) {
        try {
          const locator = buildLocator(context).first();
          await locator.waitFor({ state: "visible", timeout: 700 });
          await locator.click({ timeout: 5000 });
          return true;
        } catch {
          // Try the next selector/context.
        }
      }
    }

    await page.waitForTimeout(500);
  }

  throw new Error(`Could not click ${description} in Stripe Checkout.`);
}

async function payStripeCheckout(page, ownerEmail) {
  await page.waitForLoadState("domcontentloaded", { timeout: 60000 });

  await fillFirstVisibleIfPresent(
    page,
    [
      (context) => context.getByLabel(/^email$/i),
      (context) => context.getByPlaceholder(/email/i),
      (context) => context.locator('input[type="email"]'),
    ],
    ownerEmail
  );

  await fillFirstVisible(
    page,
    [
      (context) => context.getByLabel(/card number/i),
      (context) => context.getByPlaceholder(/1234 1234 1234 1234/i),
      (context) => context.locator('input[name="cardnumber"]'),
    ],
    "4242 4242 4242 4242",
    "Stripe card number"
  );

  await fillFirstVisible(
    page,
    [
      (context) => context.getByLabel(/expiration|expiry/i),
      (context) => context.getByPlaceholder(/MM\s*\/\s*YY/i),
      (context) => context.locator('input[name="exp-date"]'),
    ],
    "12 / 34",
    "Stripe expiry"
  );

  await fillFirstVisible(
    page,
    [
      (context) => context.getByLabel(/security code|cvc|cvv/i),
      (context) => context.getByPlaceholder(/CVC|CVV/i),
      (context) => context.locator('input[name="cvc"]'),
    ],
    "123",
    "Stripe CVC"
  );

  await fillFirstVisibleIfPresent(
    page,
    [
      (context) => context.getByLabel(/name on card|cardholder name|full name/i),
      (context) => context.getByPlaceholder(/name/i),
      (context) => context.locator('input[name="billingName"]'),
    ],
    "Smoke Test"
  );

  await fillFirstVisibleIfPresent(
    page,
    [
      (context) => context.getByLabel(/postcode|postal code|zip/i),
      (context) => context.getByPlaceholder(/postcode|postal code|zip/i),
      (context) => context.locator('input[name="postal"]'),
    ],
    "SW1A 1AA"
  );

  await clickFirstVisible(
    page,
    [
      (context) => context.getByRole("button", { name: /pay/i }),
      (context) => context.getByRole("button", { name: /complete/i }),
      (context) => context.getByRole("button", { name: /confirm/i }),
      (context) => context.locator('button[type="submit"]'),
    ],
    "Stripe payment button",
    60000
  );
}

async function completeBookingIfAvailable(page) {
  const completeButton = page.getByRole("button", {
    name: /complete booking and release payout|complete booking and pay gardener|retry gardener payout/i,
  });

  if (await isVisible(completeButton, 5000)) {
    await completeButton.click();

    await expect(
      page.locator("body"),
      "Completing the booking should produce a completed or paid-payout state"
    ).toContainText(/This booking is complete|Booking: Completed|Payout: Paid/i, {
      timeout: 60000,
    });

    return;
  }

  await expect(
    page.locator("body"),
    "If there is no completion button, the booking should already be final"
  ).toContainText(/This booking is complete|Booking: Completed|Payout: Paid/i, {
    timeout: 15000,
  });
}

test("owner, gardener, checkout, and payout smoke flow", async ({ page }) => {
  test.slow();

  const requestTitle = `Smoke test request ${Date.now()}`;

  await loginAs(page, smokeEnv.ownerEmail, smokeEnv.ownerPassword, "owner");
  await saveProfileIfPossible(page);
  const requestPath = await createCareRequest(page, requestTitle);
  await logout(page);

  await loginAs(page, smokeEnv.gardenerEmail, smokeEnv.gardenerPassword, "gardener");
  await openRequestFromBrowse(page, requestTitle);
  await submitOffer(page, requestTitle);
  await logout(page);

  await loginAs(page, smokeEnv.ownerEmail, smokeEnv.ownerPassword, "owner");
  await page.goto(requestPath);

  await expect(
    page.getByText(requestTitle, { exact: true }),
    "Owner should be able to reopen the smoke-test request"
  ).toBeVisible({ timeout: 20000 });

  await acceptGardenerOffer(page);
  await startCheckout(page, requestTitle);
  await payStripeCheckout(page, smokeEnv.ownerEmail);

  await page.waitForURL(/\/bookings\/[^/]+\/success/, {
    timeout: 120000,
  });

  await expect(
    page.locator("body"),
    "The app should return to a successful paid booking page"
  ).toContainText(/Payment confirmed|Booking paid|Booking payment received/i, {
    timeout: 60000,
  });

  await page.getByRole("link", { name: /view booking/i }).click();

  await expect(
    page.locator("body"),
    "Booking page should show the payment was recorded"
  ).toContainText(/Booking: Paid|Booking: Completed|Payout: Paid/i, {
    timeout: 30000,
  });

  await completeBookingIfAvailable(page);
});

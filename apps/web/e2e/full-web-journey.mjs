import { chromium } from "playwright";

const baseUrl = process.env.VSI_E2E_BASE_URL ?? "http://127.0.0.1:3000";

const seedResponse = await fetch(`${baseUrl}/api/e2e/seed-inspection`, { method: "POST" });
if (!seedResponse.ok) throw new Error(`Seed inspection failed: ${seedResponse.status}`);
const seeded = await seedResponse.json();

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.route("**/api/inspect", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(seeded),
    });
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByLabel("Page URL").fill(seeded.pageUrl);
  await page.getByRole("button", { name: "Inspect" }).click();

  await page.getByText("DIRECT").waitFor();
  await page.getByText(seeded.candidates[0].url).waitFor();

  const saveButton = page.getByRole("button", { name: /Save permitted media/i });
  if (await saveButton.isEnabled()) throw new Error("Save button must be disabled before authorization");

  await page.getByLabel(/I confirm/i).check();
  const basisSelect = page.getByLabel(/Authorization basis/i);
  await basisSelect.selectOption("public-domain");

  await saveButton.click();
  await page.getByText(/Saved:/i).waitFor({ timeout: 60000 });

  const savedText = await page.getByText(/Saved:/i).textContent();
  if (!savedText?.includes("flower")) throw new Error(`Unexpected saved result: ${savedText}`);

  console.log("ULTEF-WEB-001 PASS", savedText);
} finally {
  await browser.close();
}

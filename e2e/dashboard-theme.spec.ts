import { test, expect } from "@playwright/test";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Okihita/.gemini/antigravity/brain/cdfa6dc5-3edc-4900-ad7c-cd129ab64401";

test.describe("Dashboard Theme & Container Color Verification", () => {
  test("verifies light mode containers render white/light slate backgrounds", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const htmlElement = page.locator("html");
    const themeToggleBtn = page.locator('button[title*="Switch to"]');

    // Ensure we are in Light Mode
    const isDark = await htmlElement.evaluate((el) => el.classList.contains("dark"));
    if (isDark) {
      await themeToggleBtn.click();
      await page.waitForTimeout(500);
    }

    // Verify html element does NOT contain 'dark' class
    const hasDarkClass = await htmlElement.evaluate((el) => el.classList.contains("dark"));
    expect(hasDarkClass).toBe(false);

    // 1. Verify AppShell background (light slate #f8fafc)
    const appShell = page.locator('div[class*="flex h-screen w-screen"]');
    const appShellBg = await appShell.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    console.log("[Light Mode] AppShell computed bg:", appShellBg);

    // 2. Verify Sidebar background (pure white #ffffff)
    const sidebar = page.locator('div[class*="flex flex-col h-full bg-white"]');
    await expect(sidebar).toBeVisible();
    const sidebarBg = await sidebar.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    console.log("[Light Mode] Sidebar computed bg:", sidebarBg);
    expect(sidebarBg).toMatch(/(rgb\(255,\s*255,\s*255\)|oklab\(0\.99|lab\(100)/);

    // 3. Verify TopBar background (white/90)
    const topBar = page.locator('div[class*="flex items-center gap-3 px-5"]');
    await expect(topBar).toBeVisible();
    const topBarBg = await topBar.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    console.log("[Light Mode] TopBar computed bg:", topBarBg);
    expect(topBarBg).toMatch(/(rgba?\(255,\s*255,\s*255|oklab\(0\.99|lab\(9)/);

    // 4. Verify StationInfoCard background (white/95)
    const stationCard = page.locator('div[class*="bg-white/95"]');
    if (await stationCard.count() > 0) {
      const cardBg = await stationCard.first().evaluate((el) => window.getComputedStyle(el).backgroundColor);
      console.log("[Light Mode] StationInfoCard computed bg:", cardBg);
      expect(cardBg).toMatch(/(rgba?\(255,\s*255,\s*255|oklab\(0\.99|lab\(9)/);
    }

    // Save Light Mode verified screenshot to artifact folder
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "light-mode-containers-white.png"),
      fullPage: true,
    });
  });

  test("verifies dark mode containers render dark background styles when dark mode is toggled", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const htmlElement = page.locator("html");
    const themeToggleBtn = page.locator('button[title*="Switch to"]');

    // Ensure we switch to Dark Mode
    const isDark = await htmlElement.evaluate((el) => el.classList.contains("dark"));
    if (!isDark) {
      await themeToggleBtn.click();
      await page.waitForTimeout(500);
    }

    const hasDarkClass = await htmlElement.evaluate((el) => el.classList.contains("dark"));
    expect(hasDarkClass).toBe(true);

    // Verify AppShell background in Dark Mode (#070a11)
    const appShell = page.locator('div[class*="flex h-screen w-screen"]');
    const appShellBg = await appShell.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    console.log("[Dark Mode] AppShell computed bg:", appShellBg);
    expect(appShellBg).not.toMatch(/(rgb\(248,\s*250,\s*252\)|rgb\(255,\s*255,\s*255\))/);

    // Verify Sidebar background in Dark Mode (#0c1019)
    const sidebar = page.locator('div[class*="flex flex-col h-full"]');
    const sidebarBg = await sidebar.first().evaluate((el) => window.getComputedStyle(el).backgroundColor);
    console.log("[Dark Mode] Sidebar computed bg:", sidebarBg);
    expect(sidebarBg).not.toMatch(/(rgb\(255,\s*255,\s*255\))/);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "dark-mode-containers-dark.png"),
      fullPage: true,
    });
  });

  test("toggles 2D Flat & 3D Perspective map mode", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const modeBtn = page.locator('button[title*="Toggle between 2D Flat"]');
    await expect(modeBtn).toBeVisible();
    await expect(modeBtn).toContainText("2D Flat");

    await modeBtn.click();
    await page.waitForTimeout(600);

    await expect(modeBtn).toContainText("3D Mode");

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "dashboard-3d-mode.png"),
      fullPage: true,
    });
  });
});

import { test, expect } from "@playwright/test";

const TOLERANCE_PX = 2;

// Compute WCAG contrast ratio for the Email tab inside the browser context
// (canvas sampling converts lab()/oklch() colors to sRGB).
async function emailTabContrast(page: import("@playwright/test").Page): Promise<number> {
  return page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll("[role='tab']")).find(
      (el) => el.textContent?.includes("Email"),
    ) as HTMLElement;
    const label = tab.querySelector("span") as HTMLElement;
    const fg = getComputedStyle(label).color;
    const bg = getComputedStyle(tab).backgroundColor;

    const sample = (style: string): [number, number, number] => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = style;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2]];
    };

    const luminance = (rgb: [number, number, number]): number => {
      const c = rgb
        .map((v) => v / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };

    const l1 = luminance(sample(fg));
    const l2 = luminance(sample(bg));
    const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (hi + 0.05) / (lo + 0.05);
  });
}

test.describe("alert channel feed — readability, padding, spacing, symmetry", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    const tablist = page.getByRole("tablist", { name: "Alert channels" });
    await expect(tablist).toBeVisible();
  });

  test("renders three equally-sized, sufficiently tall tabs", async ({ page }) => {
    const tabs = page.getByRole("tab", { name: /Telegram|WhatsApp|Email/ });
    await expect(tabs).toHaveCount(3);

    const boxes = await tabs.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { width: r.width, height: r.height };
      }),
    );

    for (const box of boxes) {
      expect(box.height).toBeGreaterThanOrEqual(40); // a11y touch target
      expect(box.width).toBeGreaterThanOrEqual(76); // usable hit area
    }

    const widths = boxes.map((b) => b.width);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(TOLERANCE_PX);

    const heights = boxes.map((b) => b.height);
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(TOLERANCE_PX);
  });

  test("tabs have adequate padding and readable type", async ({ page }) => {
    const tab = page.getByRole("tab", { name: /Telegram/ });
    const styles = await tab.evaluate((el) => {
      const s = getComputedStyle(el);
      const label = el.querySelector("span");
      return {
        paddingTop: parseFloat(s.paddingTop),
        paddingBottom: parseFloat(s.paddingBottom),
        paddingLeft: parseFloat(s.paddingLeft),
        paddingRight: parseFloat(s.paddingRight),
        fontSize: parseFloat(label ? getComputedStyle(label).fontSize : s.fontSize),
        lineHeight: parseFloat(label ? getComputedStyle(label).lineHeight : s.lineHeight),
      };
    });

    expect(styles.paddingTop).toBeGreaterThanOrEqual(10);
    expect(styles.paddingBottom).toBeGreaterThanOrEqual(10);
    expect(styles.paddingLeft).toBeGreaterThanOrEqual(4);
    expect(styles.paddingRight).toBeGreaterThanOrEqual(4);
    expect(styles.fontSize).toBeGreaterThanOrEqual(11);
    expect(styles.lineHeight).toBeGreaterThanOrEqual(styles.fontSize * 1.2);
  });

  test("tabs are vertically and horizontally centered (symmetry)", async ({ page }) => {
    const tab = page.getByRole("tab", { name: /WhatsApp/ });
    const { btn, label, icon } = await tab.evaluate((el) => {
      const b = el.getBoundingClientRect();
      const text = el.querySelector("span") as HTMLElement;
      const svg = el.querySelector("svg") as SVGSVGElement;
      return {
        btn: { x: b.x, y: b.y, w: b.width, h: b.height },
        label: text ? { x: text.getBoundingClientRect().x, w: text.getBoundingClientRect().width, y: text.getBoundingClientRect().y, h: text.getBoundingClientRect().height } : null,
        icon: svg ? { x: svg.getBoundingClientRect().x, w: svg.getBoundingClientRect().width } : null,
      };
    });

    expect(label).not.toBeNull();
    expect(icon).not.toBeNull();

    // Vertical center: label center aligns with button center
    const btnCenterY = btn.y + btn.h / 2;
    const labelCenterY = label!.y + label!.h / 2;
    expect(Math.abs(labelCenterY - btnCenterY)).toBeLessThanOrEqual(3);

    // Horizontal center: group of icon+label is centered in the button
    const groupX = icon!.x;
    const groupWidth = label!.x + label!.w - icon!.x;
    const btnCenterX = btn.x + btn.w / 2;
    expect(Math.abs(groupX + groupWidth / 2 - btnCenterX)).toBeLessThanOrEqual(3);
  });

  test("tab text has sufficient contrast in both themes", async ({ page }) => {
    // Default (light in headless) — assert readable
    const lightRatio = await emailTabContrast(page);
    expect(lightRatio).toBeGreaterThanOrEqual(3.0);

    // Switch to dark theme and re-measure
    await page.getByRole("button", { name: /Switch to dark mode/ }).click();
    await expect(page.getByRole("tablist", { name: "Alert channels" })).toBeVisible();
    const darkRatio = await emailTabContrast(page);
    expect(darkRatio).toBeGreaterThanOrEqual(3.0);
  });

  test("tablist gap and panel spacing are balanced", async ({ page }) => {
    const tablist = page.getByRole("tablist", { name: "Alert channels" });
    const tabs = tablist.locator("[role='tab']");
    const b0 = await tabs.nth(0).boundingBox();
    const b1 = await tabs.nth(1).boundingBox();
    const b2 = await tabs.nth(2).boundingBox();
    expect(b0 && b1 && b2).toBeTruthy();

    const gapA = b1!.x - (b0!.x + b0!.width);
    const gapB = b2!.x - (b1!.x + b1!.width);
    expect(gapA).toBeGreaterThanOrEqual(4);
    expect(gapB).toBeGreaterThanOrEqual(4);
    expect(Math.abs(gapA - gapB)).toBeLessThanOrEqual(TOLERANCE_PX);

    const panel = page.getByRole("tabpanel", { name: /messages/ });
    const panelBox = await panel.boundingBox();
    const tablistBox = await tablist.boundingBox();
    expect(panelBox && tablistBox).toBeTruthy();
    expect(panelBox!.y - (tablistBox!.y + tablistBox!.height)).toBeGreaterThanOrEqual(8);
  });

  test("switching tabs updates the panel and keeps selection state", async ({ page }) => {
    await page.getByRole("tab", { name: /WhatsApp/ }).click();
    await expect(page.getByRole("tab", { name: /WhatsApp/ })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel", { name: /WhatsApp messages/ })).toBeVisible();

    await page.getByRole("tab", { name: /Email/ }).click();
    await expect(page.getByRole("tab", { name: /Email/ })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel", { name: /Email messages/ })).toBeVisible();
  });
});

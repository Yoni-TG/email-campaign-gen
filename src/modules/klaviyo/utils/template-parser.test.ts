import { describe, it, expect } from "vitest";
import { parseTemplateHtml } from "./template-parser";

const SAMPLE_TEMPLATE = `
<html><body>
  <table>
    <tr><td>
      <table>
        <tr><td bgcolor="#003366" style="padding: 24px;">
          <img src="https://cdn.example.com/logo.png" />
        </td></tr>
        <tr><td>
          <img src="https://cdn.example.com/hero.jpg" width="600" />
        </td></tr>
        <tr><td style="background-color: #ffffff;">
          <h1 style="color: #003366;">Spring is here!</h1>
          <p style="color: #333;">Refresh your look with our newest pieces, made for you.</p>
        </td></tr>
        <tr><td>
          <a href="https://shop.example.com/sale" style="background-color: #003366; color: #fff; padding: 12px;">Shop now</a>
        </td></tr>
        <tr><td>
          <table><tr>
            <td><img src="https://cdn.example.com/product1.jpg" /></td>
            <td><img src="https://cdn.example.com/product2.jpg" /></td>
            <td><img src="https://cdn.example.com/product3.jpg" /></td>
          </tr></table>
        </td></tr>
        <tr><td>
          <p>You're receiving this email because you signed up. Unsubscribe at any time. Theo Grace, 123 Brand St.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
`;

describe("parseTemplateHtml", () => {
  it("identifies the inner content table and walks its rows as sections", () => {
    const { sections } = parseTemplateHtml(SAMPLE_TEMPLATE);
    expect(sections).toHaveLength(6);
  });

  it("classifies sections heuristically", () => {
    const { sections } = parseTemplateHtml(SAMPLE_TEMPLATE);
    const guesses = sections.map((s) => s.guess);
    expect(guesses[0]).toBe("hero"); // single logo image, no text
    expect(guesses[1]).toBe("hero"); // single hero image, no text
    expect(guesses[2]).toBe("text"); // headline + paragraph
    expect(guesses[3]).toBe("button"); // bare CTA
    expect(guesses[4]).toBe("grid"); // 3 product images
    // Section 5 has long text that includes "Unsubscribe" — classifier may mark "text" or "footer"
    expect(["text", "footer"]).toContain(guesses[5]);
  });

  it("extracts image URLs per section", () => {
    const { sections } = parseTemplateHtml(SAMPLE_TEMPLATE);
    expect(sections[1].imageUrls).toEqual(["https://cdn.example.com/hero.jpg"]);
    expect(sections[4].imageUrls).toHaveLength(3);
  });

  it("extracts button label + href", () => {
    const { sections } = parseTemplateHtml(SAMPLE_TEMPLATE);
    expect(sections[3].buttonLabels).toEqual(["Shop now"]);
    expect(sections[3].buttonHrefs).toEqual(["https://shop.example.com/sale"]);
  });

  it("collects all unique colors and ranks by frequency", () => {
    const { colorPalette } = parseTemplateHtml(SAMPLE_TEMPLATE);
    const colors = colorPalette.map((c) => c.color);
    // 3-digit and 6-digit hex collapse together via normaliseColor.
    expect(colors).toContain("#003366");
    expect(colors).toContain("#ffffff");
    expect(colors).toContain("#333333");
    // Sort order: #003366 appears 3 times (logo bg, headline color, button bg)
    expect(colorPalette[0].color).toBe("#003366");
  });

  it("normalises 3-digit hex to 6-digit form", () => {
    const html = `<html><body><table><tr><td style="color: #fff;">x</td></tr><tr><td style="color: #ffffff;">y</td></tr></table></body></html>`;
    const { colorPalette } = parseTemplateHtml(html);
    // Both should normalise to #ffffff and merge.
    const ffff = colorPalette.find((c) => c.color === "#ffffff");
    expect(ffff?.count).toBe(2);
  });
});

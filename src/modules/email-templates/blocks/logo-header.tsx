import * as React from "react";
import { Img, Section } from "@react-email/components";
import { bgColor } from "./theme";
import type { LogoHeaderProps } from "./types";

function asset(path: string): string {
  const base = process.env.NEXT_PUBLIC_EMAIL_ASSETS_BASE_URL ?? "";
  return `${base}${path}`;
}

const DEFAULT_LOGO_IMAGE = asset("/email-assets/tgr-logo.png");

// Brand default is baby-blue per the wireframes — the logo bar is the visual
// anchor that signals Theo Grace before any copy. Pass `background="white"`
// for skeletons that intentionally lead with a typography hero on white.
export function LogoHeader({
  background = "baby_blue",
  editTargets,
}: LogoHeaderProps) {
  const bg = bgColor(background);
  return (
    <Section
      data-edit-target={editTargets?.background}
      style={{
        backgroundColor: bg,
        padding: "16px 0",
        textAlign: "center",
      }}
    >
      <Img
        src={DEFAULT_LOGO_IMAGE}
        alt="Theo Grace"
        height={36}
        style={{ display: "block", margin: "0 auto" }}
      />
    </Section>
  );
}

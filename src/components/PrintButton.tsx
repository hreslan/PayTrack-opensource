"use client";

import PillButton from "./PillButton";

export default function PrintButton() {
  return (
    <PillButton type="button" onClick={() => window.print()}>
      Print / Save as PDF
    </PillButton>
  );
}

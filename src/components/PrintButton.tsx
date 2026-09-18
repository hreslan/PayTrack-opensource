"use client";

import Button from "./Button";

export default function PrintButton() {
  return (
    <Button type="button" onClick={() => window.print()}>
      Print / Save as PDF
    </Button>
  );
}

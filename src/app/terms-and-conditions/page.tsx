import React from "react";
import { Metadata } from "next";
import TermsAndConditionsClient from "./TermsAndConditionsClient";

export const metadata: Metadata = {
  title: "Terms & Conditions | Hum Hai Hindu Foundation",
  description: "Animal rescue and welfare foundation policies.",
};

export default function TermsAndConditionsPage() {
  return <TermsAndConditionsClient />;
}

import React from "react";
import { Metadata } from "next";
import PrivacyPolicyClient from "./PrivacyPolicyClient";

export const metadata: Metadata = {
  title: "Privacy Policy | Hum Hai Hindu Foundation",
  description: "Animal rescue and welfare foundation policies.",
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />;
}

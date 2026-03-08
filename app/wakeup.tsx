"use client";

import { useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function WakeUp() {
  useEffect(() => {
    fetch(`${API_URL}/health`).catch(() => {});
  }, []);
  return null;
}

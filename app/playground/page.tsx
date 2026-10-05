import type { Metadata } from "next";
import { LabClient } from "@/features/lab/LabClient";
export const metadata: Metadata = { title: "Playground · Motion Lab", description: "Tune motion parameters and copy reusable configurations in real time." };
export default function PlaygroundPage() { return <LabClient mode="playground" />; }

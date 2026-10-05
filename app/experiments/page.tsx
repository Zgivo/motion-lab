import type { Metadata } from "next";
import { LabClient } from "@/features/lab/LabClient";
export const metadata: Metadata = { title: "Experiments · Motion Lab", description: "Explore interactive motion experiments in typography, cursor systems, UI physics and WebGL." };
export default function ExperimentsPage() { return <LabClient mode="gallery" />; }

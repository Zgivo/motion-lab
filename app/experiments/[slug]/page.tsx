import type { Metadata } from "next";
import { LabClient } from "@/features/lab/LabClient";
import { experiments, getExperiment } from "@/data/experiments";
export function generateStaticParams() { return experiments.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const item = getExperiment(slug); return { title: item ? `${item.title} · Motion Lab` : "Experiment not found · Motion Lab", description: item?.description }; }
export default async function ExperimentPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const item = getExperiment(slug); return <><title>{item ? `${item.title} · Motion Lab` : "Experiment not found · Motion Lab"}</title><LabClient mode="detail" slug={slug} /></>; }

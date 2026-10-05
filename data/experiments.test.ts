import { describe, expect, it } from "vitest";
import { defaultValues, experiments, getExperiment } from "./experiments";

describe("experiment registry", () => {
  it("contains 15 unique, addressable experiments", () => {
    expect(experiments).toHaveLength(15);
    expect(new Set(experiments.map((item) => item.slug)).size).toBe(15);
    expect(experiments.every((item) => getExperiment(item.slug) === item)).toBe(true);
  });

  it("derives every default control value", () => {
    for (const experiment of experiments) {
      const values = defaultValues(experiment);
      expect(Object.keys(values)).toHaveLength(experiment.controls.length);
      for (const control of experiment.controls) expect(values[control.key]).toBe(control.default);
    }
  });
});

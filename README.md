# Motion Lab

Experimental motion for the modern web.

Motion Lab is a production-minded collection of interactive web experiments exploring motion design, creative coding, realtime graphics, typography and advanced UI interaction. Each study can be opened, tuned, paused, viewed fullscreen and inspected as reusable code.

## Featured experiments

- Magnetic Button — proximity-driven spring interaction
- Liquid Typography — responsive distortion and layered type
- Infinite Gallery — draggable two-dimensional field
- Image Distortion — procedural displacement study
- 3D Tilt Card — perspective, depth and glare
- Particle Logo — repulsion and spring-return system
- Shader Gradient — animated chromatic noise field
- Page Transition — accessible branded route mask

## Stack

Next.js, React, TypeScript, Tailwind CSS, Framer Motion, GSAP, Three.js, React Three Fiber, Zustand, Vitest and Playwright.

## Architecture

Experiments use one typed registry in `data/experiments.ts`. Controls are declarative, so the same control panel can render sliders, presets, reset and serialization for every study. The shared stage owns pointer normalization, pause state and reduced-motion behavior. Routes are rendered from the same experiment metadata.

## Getting started

```bash
pnpm install
pnpm dev
```

Quality checks: `pnpm typecheck`, `pnpm test`, then `pnpm build`.

## Performance and accessibility

- Transform/opacity-first animation and pausable continuous effects
- Device-quality setting and reduced-motion policy
- Keyboard-operable controls and focus-managed dialogs
- CSS/static fallbacks for realtime scenes

## Adding an experiment

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the registry, controls, fallbacks and QA checklist.

## Roadmap

Advanced Three.js scenes, flow fields, a cubic-bezier editor, spring visualizer and an experiment composer.

## License

MIT

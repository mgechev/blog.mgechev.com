---
author: minko_gechev
categories:
- AI
- LLMs
- Agents
- Evals
date: 2026-03-14T00:00:00Z
draft: false
tags:
- AI
- LLMs
- Agents
- Evals
title: "skill grade"
og_image: /images/skill-eval/dashboard.png
url: /2026/03/14/skillgrade
---

<div style="padding: 15px; border-radius: 5px; background-color:rgb(241 255 240); border: 1px solid #e9e9e9;">
⭐ Find <a href="https://github.com/mgechev/skillgrade">Skillgrade on GitHub</a>
</div>

# skill grade

A few weeks ago I wrote about [Skill Eval](https://blog.mgechev.com/2026/02/26/skill-eval/), a framework for testing AI agent skills. The idea resonated — skills are becoming a critical part of how teams work with agents, and without a way to measure whether they work, you're guessing.

The problem was that Skill Eval required too much setup. You had to clone a repo, understand a specific directory structure, write TypeScript config, and wire everything together before you could run your first eval. The barrier to entry was high for something that should be simple.

I rewrote it from scratch as **[Skillgrade](https://github.com/mgechev/skillgrade)** — a CLI tool you install globally and run from your skill directory. The workflow is now three commands:

```bash
npm i -g skillgrade

cd my-skill/
GEMINI_API_KEY=your-key skillgrade init
GEMINI_API_KEY=your-key skillgrade --smoke
```

That's it. `skillgrade init` reads your `SKILL.md`, generates an `eval.yaml` with AI-powered tasks and graders, and you're ready to run. No cloning, no boilerplate, no project structure to learn.

## What Changed

The biggest shift is moving from a framework you build on top of to a tool you point at your skill. Everything lives in a single `eval.yaml` file:

```yaml
version: "1"

defaults:
  agent: gemini
  provider: docker
  trials: 5
  timeout: 300
  threshold: 0.8

tasks:
  - name: fix-linting-errors
    instruction: |
      Use the superlint tool to fix coding standard violations in app.js.
    workspace:
      - src: fixtures/broken-app.js
        dest: app.js
    graders:
      - type: deterministic
        run: bash graders/check.sh
        weight: 0.7
      - type: llm_rubric
        rubric: |
          Did the agent follow the check → fix → verify workflow?
        weight: 0.3
```

Tasks, graders, Docker config, agent selection — all in one place. String values like `instruction` and `rubric` support file references, so you can point to external markdown files when things get complex.

The agent is auto-detected from your API key. Set `GEMINI_API_KEY` and it uses Gemini. Set `ANTHROPIC_API_KEY` and it uses Claude. Set `OPENAI_API_KEY` and it uses Codex. Override with `--agent=claude` if you need to.

## Presets

One thing I noticed when using Skill Eval was that I kept running the same configurations over and over. Quick smoke test during development. Thorough regression suite before merging. Skillgrade bakes these into presets:

- `--smoke` — fast feedback, fewer trials
- `--reliable` — balanced run for development
- `--regression` — thorough evaluation before shipping

Instead of remembering the right combination of `--trials` and thresholds, you pick the preset that matches your intent.

## CI Mode

Running evals in CI was possible before but required more work than it should. Now it's a flag:

```yaml
# .github/workflows/skillgrade.yml
- run: |
    npm i -g skillgrade
    cd skills/superlint
    GEMINI_API_KEY=${{ secrets.GEMINI_API_KEY }} skillgrade --regression --ci --provider=local
```

`--ci` exits with code 1 if the pass rate falls below `--threshold` (default: 0.8). Use `--provider=local` in CI — the runner is already an ephemeral sandbox, so Docker adds overhead without benefit.

## Preview

After a run, you can review results in two ways:

```bash
skillgrade preview           # CLI report
skillgrade preview browser   # web UI → http://localhost:3847
```

Reports are saved to `$TMPDIR/skillgrade/<skill-name>/results/` by default. Override with `--output=DIR`.

## Getting Started

```bash
npm i -g skillgrade

# Go to your skill directory (must have SKILL.md)
cd my-skill/
GEMINI_API_KEY=your-key skillgrade init

# Run a smoke test
GEMINI_API_KEY=your-key skillgrade --smoke
```

Check out the [examples](https://github.com/mgechev/skillgrade/tree/main/examples) in the repo — [superlint](https://github.com/mgechev/skillgrade/blob/main/examples/superlint) for a simple setup and [angular-modern](https://github.com/mgechev/skillgrade/blob/main/examples/angular-modern) for a TypeScript grader.

If you were using Skill Eval, the migration is straightforward: move your task config into `eval.yaml` and drop the framework dependency. The grading model is the same — deterministic and LLM rubric graders with configurable weights.

The core idea hasn't changed. Skills are instructions for agents, and instructions need tests. Skillgrade just makes it easier to write and run those tests. Don't ship skills without evals.

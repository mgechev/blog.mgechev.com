---
author: minko_gechev
categories:
- AI
- LLMs
- Agents
- Evals
date: 2026-02-26T00:00:00Z
draft: false
tags:
- AI
- LLMs
- Agents
- Evals
title: Skill Eval
url: /2026/02/26/skill-eval
---

# Testing Your AI Agent Skills

I've been working with AI coding agents daily — Gemini CLI, Claude Code, and others. One pattern I keep seeing is teams building *skills* for these agents: procedural instructions that teach the model how to use internal tools, follow specific workflows, or comply with team conventions.

The problem? No one tests them.

## Why Skills Need Tests

When you write a skill, you're essentially writing documentation that an agent will follow autonomously. A small change — rewording a step, reordering instructions, removing a "verify" command — can silently break the agent's behavior. You won't notice until someone complains that the agent stopped following the deployment checklist, or worse, that it's making changes it shouldn't.

This is the same problem we solved decades ago with unit tests for code. Skills are code for agents. They deserve the same rigor.

## Skill Eval

I built [Skill Eval](https://github.com/mgechev/skill-eval) to close this gap. It's a TypeScript framework that benchmarks how well an agent uses your skills. You define a task, point it at your skill, and the framework runs the agent in a Docker container, then grades the result.

Here's what a run looks like:

```
🚀 superlint_demo | agent=gemini provider=docker trials=5

  Trial 1/5 ▸ ✓ reward=1.00 (85.2s, ~354 tokens)
  Trial 2/5 ▸ ✓ reward=1.00 (91.4s, ~372 tokens)
  Trial 3/5 ▸ ✗ reward=0.30 (78.1s, ~298 tokens)
  Trial 4/5 ▸ ✓ reward=1.00 (88.7s, ~361 tokens)
  Trial 5/5 ▸ ✓ reward=1.00 (92.3s, ~380 tokens)

  Pass Rate   86.0%
  pass@5      100.0%
  pass^5      65.6%
  Total Tokens ~1765 (estimated)
```

The agent gets only the task assignment as its prompt. Skills are placed in the standard discovery paths (`.agents/skills/` for Gemini, `.claude/skills/` for Claude) so the agent finds them naturally, exactly like it would in production.

## How It Works

Each task is a self-contained directory:

```
tasks/my_task/
├── task.toml           # Timeouts, graders, resource limits
├── instruction.md      # What the agent should do
├── environment/Dockerfile
├── tests/test.sh       # Deterministic grader
├── prompts/quality.md  # LLM rubric grader
├── solution/solve.sh   # Reference solution
└── skills/my_skill/    # The skill being tested
    └── SKILL.md
```

You can use two types of graders. **Deterministic graders** run a shell script and check outcomes — did the file get fixed? Is the metadata file present? **LLM rubric graders** evaluate qualitative aspects — did the agent follow the correct workflow? Did it use the right tool instead of a general-purpose alternative?

Each grader returns a score between 0.0 and 1.0 with configurable weights, so you can combine "did it work?" with "did it work the right way?"

## Using It in CI

This is where it gets practical. Add a GitHub Action that runs your skill evals on every PR that touches a skill:

```yaml
name: Skill Eval
on:
  pull_request:
    paths: ['skills/**', 'tasks/**']

jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run eval my_task -- --trials=5 --provider=docker
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

A few recommendations from [Anthropic's research on agent evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents):

- **Run at least 5 trials.** Agent behavior is non-deterministic. A single run means nothing.
- **Use pass@k for capabilities.** "Can the agent solve this at least once in 5 tries?" tells you if the skill works.
- **Use pass^k for regressions.** "Does the agent solve this every time?" tells you if the skill is reliable enough for production.
- **Grade outcomes, not steps.** Check that the file was fixed, not that the agent ran a specific command. Agents find creative solutions — that's the point.

If your skill has pass@5 = 100% but pass^5 = 30%, the agent *can* do it but is flaky. Investigate the transcript.

## Getting Started

```bash
git clone https://github.com/mgechev/skill-eval
cd skill-eval && npm install

# Validate graders with the reference solution (no API key needed)
npm run eval superlint -- --validate --provider=local

# Run a real eval
GEMINI_API_KEY=your-key npm run eval superlint -- --provider=docker --trials=5
```

Check out the [Skills Best Practices](https://github.com/mgechev/skills-best-practices) for guidelines on writing skills that agents can actually follow.

Skills are becoming a first-class part of how we work with AI agents. As they get more complex and more teams depend on them, testing them stops being optional. Don't ship skills without evals.

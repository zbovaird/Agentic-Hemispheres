# Agentic Hemispheres

A bi-hemispheric AI orchestration framework for Cursor, modeled after Iain McGilchrist's Master-Emissary paradigm.

## Overview

This project implements a dual-agent architecture that pairs a high-reasoning "Master" model (Right Hemisphere) with a task-focused "Emissary" model (Left Hemisphere) to optimize for both architectural integrity and execution speed.

- **Master (RH):** Claude 3.6 Opus — holistic planning, code review, architectural oversight
- **Emissary (LH):** Gemini 1.5 Flash — rapid implementation, TDD, sequential task execution
- **Corpus Callosum:** A 2% selective signaling protocol that limits inter-agent communication to high-signal metadata

## Repository Structure

```
├── Dual Agent AI/
│   └── Dual-Agent AI_ McGilchrist's Model.md   # Research document (theory + design)
├── High-level plan/
│   └── high-level plan.md                        # Implementation guide
├── .cursor/
│   ├── rules/
│   │   ├── 01_master_rh.mdc                     # Master agent rules
│   │   ├── 02_emissary_lh.mdc                   # Emissary agent rules
│   │   └── 03_callosum.mdc                      # Communication protocol
│   ├── hooks/
│   │   └── grind.ts                              # Inhibitory feedback loop
│   └── plans/                                    # Architectural Gestalt storage
└── README.md
```

## Quick Start

1. Clone this repo and open in Cursor.
2. The `.cursor/rules/` files will automatically configure agent behavior.
3. Follow the workflow in `High-level plan/high-level plan.md` (Plan -> Implement -> Review).

## Key Concepts

- **2% Connectivity Constraint:** Mirrors the sparse, primarily inhibitory signaling of the corpus callosum.
- **Clarification Threshold:** The Emissary self-corrects for up to 5 iterations before escalating to the Master.
- **JSON Handshake:** Structured hand-off protocol between agents with intent, constraints, and proof of work.
- **Spiral Formulation:** Right (plan) -> Left (implement) -> Right (review) iterative progression.

## References

See the full research document in `Dual Agent AI/` for 52 cited sources spanning neuroscience, AI architecture, and Cursor-specific implementation details.

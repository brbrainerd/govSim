"""AgentTorch sidecar — Phase 2 entrypoint stub.

Will host an Arrow Flight server exposing one differentiable substep per
ECS-side macro mutation. For now, just prints a banner so xtask bootstrap
can verify the venv is wired up.
"""

from __future__ import annotations


def main() -> None:
    print("ugs:agenttorch sidecar stub — Phase 2 will start Arrow Flight here")


if __name__ == "__main__":
    main()

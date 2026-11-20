"""Minimal Solidity anti-pattern linter used as an orchestrator skill.

Not a substitute for Slither/audits; it catches a few concrete defects that
were found in earlier phases of this repo.
    python -m agents.phase18.solidity_lint contracts/phase17
"""
from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Finding:
    file: str
    line: int
    rule: str
    message: str


RULES = [
    ("SOL001", re.compile(r'"[^"\n]*[^\x00-\x7f][^"\n]*"'), "non-ASCII character in string literal (solc rejects it)"),
    ("SOL002", re.compile(r"keccak256\([^;]*block\.(timestamp|number|difficulty|prevrandao)[^;]*\)\s*\)?\s*%"),
     "pseudo-randomness from block data is validator-manipulable"),
    ("SOL003", re.compile(r"\btx\.origin\b"), "tx.origin used for authorization"),
    ("SOL004", re.compile(r"\bselfdestruct\b"), "selfdestruct"),
    ("SOL005", re.compile(r"\|\|\s*true\b"), "tautological '|| true' condition"),
]


def lint_source(name: str, source: str) -> list[Finding]:
    out = []
    for i, line in enumerate(source.splitlines(), 1):
        code = line.split("//", 1)[0]
        for rule, rx, msg in RULES:
            if rx.search(code):
                out.append(Finding(name, i, rule, msg))
    return out


def lint_path(path: Path) -> list[Finding]:
    files = sorted(path.rglob("*.sol")) if path.is_dir() else [path]
    return [f for p in files for f in lint_source(str(p), p.read_text(encoding="utf-8"))]


if __name__ == "__main__":
    found = lint_path(Path(sys.argv[1] if len(sys.argv) > 1 else "contracts"))
    for f in found:
        print(f"{f.file}:{f.line} {f.rule} {f.message}")
    print(f"{len(found)} finding(s)")
    sys.exit(1 if found else 0)

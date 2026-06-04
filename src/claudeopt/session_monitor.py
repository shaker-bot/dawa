"""Parse ~/.claude/projects/ JSONL files for live session usage stats."""
from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

PROJECTS_DIR = Path.home() / ".claude" / "projects"

# Costs per 1M tokens: (input, output, cache_write, cache_read)
_MODEL_COSTS: dict[str, tuple[float, float, float, float]] = {
    "claude-haiku-4-5-20251001": (0.80, 4.00, 1.00, 0.08),
    "claude-sonnet-4-6": (3.00, 15.00, 3.75, 0.30),
    "claude-opus-4-8": (15.00, 75.00, 18.75, 1.50),
}
_FALLBACK_COSTS = _MODEL_COSTS["claude-sonnet-4-6"]


@dataclass
class SessionStats:
    session_file: Path | None = None
    project: str = ""
    model: str = ""
    turns: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    cache_write_tokens: int = 0
    cache_read_tokens: int = 0
    estimated_cost: float = 0.0
    started_at: datetime | None = None
    last_activity: datetime | None = None

    @property
    def is_active(self) -> bool:
        if self.last_activity is None:
            return False
        return (datetime.now(timezone.utc) - self.last_activity).total_seconds() < 90

    @property
    def duration_str(self) -> str:
        if self.started_at is None:
            return "—"
        secs = int((datetime.now(timezone.utc) - self.started_at).total_seconds())
        m, s = divmod(secs, 60)
        if m < 60:
            return f"{m}m {s:02d}s"
        h, m = divmod(m, 60)
        return f"{h}h {m:02d}m"

    @property
    def cache_hit_pct(self) -> int:
        total_in = self.input_tokens + self.cache_read_tokens + self.cache_write_tokens
        if total_in == 0:
            return 0
        return int(100 * self.cache_read_tokens / total_in)

    @property
    def cost_str(self) -> str:
        c = self.estimated_cost
        if c < 0.001:
            return f"<$0.001"
        return f"~${c:.3f}"

    def fmt_tokens(self, n: int) -> str:
        return f"{n / 1000:.1f}k" if n >= 1000 else str(n)


def load_latest_session() -> SessionStats | None:
    if not PROJECTS_DIR.exists():
        return None
    candidates = [
        p for p in PROJECTS_DIR.rglob("*.jsonl")
        if "subagents" not in p.parts
    ]
    if not candidates:
        return None
    latest = max(candidates, key=lambda p: p.stat().st_mtime)
    return _parse_session(latest)


def _parse_session(path: Path) -> SessionStats:
    stats = SessionStats(session_file=path, project=path.parent.name)
    model_buckets: dict[str, list[int]] = {}  # model -> [inp, out, cw, cr]

    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except Exception:
        return stats

    for raw in lines:
        try:
            entry = json.loads(raw)
        except Exception:
            continue

        ts_str = entry.get("timestamp")
        if ts_str:
            try:
                ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                if stats.started_at is None or ts < stats.started_at:
                    stats.started_at = ts
                if stats.last_activity is None or ts > stats.last_activity:
                    stats.last_activity = ts
            except Exception:
                pass

        msg = entry.get("message", {})
        if not isinstance(msg, dict):
            continue
        usage = msg.get("usage")
        if usage and msg.get("role") == "assistant":
            model = msg.get("model", "claude-sonnet-4-6")
            inp = usage.get("input_tokens", 0)
            out = usage.get("output_tokens", 0)
            cw = usage.get("cache_creation_input_tokens", 0)
            cr = usage.get("cache_read_input_tokens", 0)
            bucket = model_buckets.setdefault(model, [0, 0, 0, 0])
            bucket[0] += inp
            bucket[1] += out
            bucket[2] += cw
            bucket[3] += cr
            stats.turns += 1

    if model_buckets:
        stats.model = max(model_buckets, key=lambda m: model_buckets[m][1])
        for model, (inp, out, cw, cr) in model_buckets.items():
            stats.input_tokens += inp
            stats.output_tokens += out
            stats.cache_write_tokens += cw
            stats.cache_read_tokens += cr
            costs = _MODEL_COSTS.get(model, _FALLBACK_COSTS)
            stats.estimated_cost += (
                inp * costs[0] + out * costs[1] + cw * costs[2] + cr * costs[3]
            ) / 1_000_000

    return stats

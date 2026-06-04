from dataclasses import dataclass, field


@dataclass
class ClaudeSettings:
    model: str = "claude-sonnet-4-6"
    verbose: bool = False
    includeCoAuthoredBy: bool = False
    cleanupPeriodDays: int = 30
    theme: str = "dark"
    env: dict = field(default_factory=dict)


@dataclass
class Profile:
    id: str
    emoji: str
    name: str
    tagline: str
    description: str
    settings: ClaudeSettings
    cost_tier: int  # 1=cheapest → 4=most expensive


PROFILES: list[Profile] = [
    Profile(
        id="max_efficiency",
        emoji="🚀",
        name="Max Efficiency",
        tagline="Lowest cost, fastest response",
        description=(
            "Haiku model with all verbosity off. ~20x cheaper than Opus. "
            "Ideal for bulk edits, repetitive tasks, and quick file changes where speed and cost matter most."
        ),
        settings=ClaudeSettings(
            model="claude-haiku-4-5-20251001",
            verbose=False,
            includeCoAuthoredBy=False,
            cleanupPeriodDays=7,
            theme="dark",
        ),
        cost_tier=1,
    ),
    Profile(
        id="smart_default",
        emoji="⚡",
        name="Smart Default",
        tagline="Balanced intelligence and cost",
        description=(
            "Sonnet model with concise output. The recommended daily driver "
            "for coding, planning, and general engineering tasks."
        ),
        settings=ClaudeSettings(
            model="claude-sonnet-4-6",
            verbose=False,
            includeCoAuthoredBy=False,
            cleanupPeriodDays=30,
            theme="dark",
        ),
        cost_tier=2,
    ),
    Profile(
        id="developer",
        emoji="🔧",
        name="Developer Mode",
        tagline="Full visibility, verbose tool output",
        description=(
            "Sonnet with verbose tool output and commit attribution. "
            "Best when debugging, auditing tool calls, or reviewing exactly what Claude does."
        ),
        settings=ClaudeSettings(
            model="claude-sonnet-4-6",
            verbose=True,
            includeCoAuthoredBy=True,
            cleanupPeriodDays=90,
            theme="dark",
        ),
        cost_tier=3,
    ),
    Profile(
        id="full_power",
        emoji="💎",
        name="Full Power",
        tagline="Maximum capability, no compromises",
        description=(
            "Opus model for architecture decisions, complex reasoning, and tasks "
            "where answer quality outweighs cost."
        ),
        settings=ClaudeSettings(
            model="claude-opus-4-8",
            verbose=True,
            includeCoAuthoredBy=True,
            cleanupPeriodDays=90,
            theme="dark",
        ),
        cost_tier=4,
    ),
]

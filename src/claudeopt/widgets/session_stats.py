from textual.app import ComposeResult
from textual.widget import Widget
from textual.widgets import Label

from claudeopt.session_monitor import SessionStats


class SessionStatsWidget(Widget):
    """Two-line live panel showing active Claude Code session metrics."""

    DEFAULT_CSS = """
    SessionStatsWidget {
        height: 5;
        padding: 0 1;
        background: $panel;
        border: tall $surface;
    }
    SessionStatsWidget Label {
        height: 1;
    }
    #stats-status {
        margin-top: 1;
        color: $text-muted;
    }
    #stats-tokens {
        color: $text-muted;
        margin-top: 0;
    }
    """

    def compose(self) -> ComposeResult:
        yield Label("No active session  —  press [bold]r[/bold] to run Claude", id="stats-status")
        yield Label("", id="stats-tokens")

    def refresh_stats(self, stats: SessionStats | None) -> None:
        status_lbl = self.query_one("#stats-status", Label)
        tokens_lbl = self.query_one("#stats-tokens", Label)

        if stats is None or stats.turns == 0:
            status_lbl.update(
                "No active session  —  press [bold]r[/bold] to run Claude"
            )
            tokens_lbl.update("")
            return

        dot = "[green]●[/green] [bold]LIVE[/bold]" if stats.is_active else "[dim]○ idle[/dim]"
        model_short = (
            stats.model
            .replace("claude-", "")
            .replace("-20251001", "")
        )
        status_lbl.update(
            f"{dot}  [bold]{model_short}[/bold]  "
            f"[dim]{stats.turns} turns · {stats.duration_str}[/dim]"
        )

        tokens_lbl.update(
            f"[dim]↑[/dim] {stats.fmt_tokens(stats.input_tokens)} in  "
            f"[dim]↓[/dim] {stats.fmt_tokens(stats.output_tokens)} out  "
            f"[dim]⚡[/dim] {stats.cache_hit_pct}% cache  "
            f"[dim]{stats.cost_str}[/dim]"
        )

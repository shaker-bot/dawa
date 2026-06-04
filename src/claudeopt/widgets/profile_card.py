from textual.app import ComposeResult
from textual.message import Message
from textual.reactive import reactive
from textual.widget import Widget
from textual.widgets import Label, Rule

from claudeopt.models import Profile


class ProfileCard(Widget):
    """Clickable card representing one optimization profile."""

    DEFAULT_CSS = """
    ProfileCard {
        border: tall $surface;
        background: $surface;
        padding: 1 2;
        margin: 0 0 1 0;
        height: auto;
    }
    ProfileCard:hover {
        border: tall $primary;
        background: $panel;
    }
    ProfileCard.-selected {
        border: tall $primary;
        background: $panel;
    }
    ProfileCard .card-header {
        text-style: bold;
        color: $foreground;
    }
    ProfileCard.-selected .card-header {
        color: $primary;
    }
    ProfileCard .card-tagline {
        color: $text-muted;
    }
    ProfileCard .card-model {
        color: $accent;
        margin-top: 1;
    }
    ProfileCard .cost-bar {
        color: $success;
    }
    ProfileCard.-selected .cost-bar {
        color: $primary;
    }
    """

    class Selected(Message):
        def __init__(self, card: "ProfileCard") -> None:
            self.card = card
            super().__init__()

    is_selected: reactive[bool] = reactive(False, toggle_class="-selected")

    def __init__(self, profile: Profile, **kwargs) -> None:
        super().__init__(**kwargs)
        self.profile = profile

    def compose(self) -> ComposeResult:
        p = self.profile
        model_short = p.settings.model.split("-")[1].title()
        filled = "█" * p.cost_tier
        empty = "░" * (4 - p.cost_tier)
        yield Label(f"{p.emoji}  {p.name}", classes="card-header")
        yield Label(p.tagline, classes="card-tagline")
        yield Label(f"  {model_short}   Cost: {filled}{empty}", classes="card-model")

    def on_click(self) -> None:
        self.post_message(self.Selected(self))

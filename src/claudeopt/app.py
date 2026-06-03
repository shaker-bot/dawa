from textual.app import App, ComposeResult
from textual.binding import Binding

from claudeopt.screens.main_screen import MainScreen
from claudeopt.theme import TEAL_THEME


class ClaudeOptApp(App):
    """claudeopt — Claude Code Settings Optimizer."""

    TITLE = "claudeopt"
    SUB_TITLE = "Claude Code Settings Optimizer"

    BINDINGS = [
        Binding("ctrl+q", "quit", "Quit"),
        Binding("q", "quit", "Quit", show=False),
    ]

    def __init__(self) -> None:
        super().__init__()
        self.register_theme(TEAL_THEME)
        self.theme = "teal-efficiency"

    def on_mount(self) -> None:
        self.push_screen(MainScreen())


def main() -> None:
    ClaudeOptApp().run()


if __name__ == "__main__":
    main()

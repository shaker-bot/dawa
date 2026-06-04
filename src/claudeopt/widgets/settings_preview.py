import json

from rich.syntax import Syntax
from textual.app import ComposeResult
from textual.widget import Widget
from textual.widgets import Static


class SettingsPreview(Widget):
    """Syntax-highlighted JSON preview of settings."""

    DEFAULT_CSS = """
    SettingsPreview {
        height: 100%;
        overflow-y: auto;
    }
    SettingsPreview Static {
        padding: 0 1;
    }
    """

    def __init__(self, settings_dict: dict, **kwargs) -> None:
        super().__init__(**kwargs)
        self._settings = settings_dict

    def compose(self) -> ComposeResult:
        yield Static(self._build_syntax(), id="preview-static")

    def _build_syntax(self) -> Syntax:
        text = json.dumps(self._settings, indent=4)
        return Syntax(text, "json", theme="github-dark", line_numbers=False)

    def update_settings(self, settings_dict: dict) -> None:
        self._settings = settings_dict
        self.query_one("#preview-static", Static).update(self._build_syntax())

import json

from rich.syntax import Syntax
from textual.app import ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, Vertical
from textual.screen import ModalScreen
from textual.widgets import Button, Label, Static


class ConfirmModal(ModalScreen[bool]):
    """Confirmation dialog before writing settings. Returns True on confirm."""

    DEFAULT_CSS = """
    ConfirmModal {
        align: center middle;
    }
    ConfirmModal > Vertical {
        background: $surface;
        border: thick $primary;
        padding: 1 2;
        width: 64;
        height: auto;
        max-height: 80%;
    }
    ConfirmModal .modal-title {
        text-style: bold;
        color: $primary;
        margin-bottom: 1;
    }
    ConfirmModal .modal-meta {
        color: $text-muted;
    }
    ConfirmModal Rule {
        margin: 1 0;
        color: $panel;
    }
    ConfirmModal .button-row {
        margin-top: 1;
        height: auto;
        align-horizontal: right;
    }
    ConfirmModal Button {
        margin-left: 1;
    }
    """

    BINDINGS = [Binding("escape", "dismiss(False)", "Cancel")]

    def __init__(self, settings_dict: dict, backup_note: str, **kwargs) -> None:
        super().__init__(**kwargs)
        self._settings = settings_dict
        self._backup_note = backup_note

    def compose(self) -> ComposeResult:
        text = json.dumps(self._settings, indent=4)
        syntax = Syntax(text, "json", theme="github-dark", line_numbers=True)
        with Vertical():
            yield Label("⚙  Apply Settings", classes="modal-title")
            yield Label("Writing to: ~/.claude/settings.json", classes="modal-meta")
            yield Label(self._backup_note, classes="modal-meta")
            yield Static(syntax)
            with Horizontal(classes="button-row"):
                yield Button("Cancel", variant="default", id="cancel")
                yield Button("Apply  ✓", variant="success", id="apply")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        self.dismiss(event.button.id == "apply")

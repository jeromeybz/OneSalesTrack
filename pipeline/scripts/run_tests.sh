#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ -n "${PYTHON:-}" ]]; then
  :
elif command -v python >/dev/null 2>&1; then
  PYTHON="python"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON="python3"
else
  echo "Error: Python not found. Install python3 or set PYTHON=/path/to/python." >&2
  exit 127
fi
INSTALL="${INSTALL:-0}"
VENV_DIR="${VENV_DIR:-pipeline/.venv}"

cd "$ROOT_DIR"

ensure_pip() {
  if "$PYTHON" -m pip --version >/dev/null 2>&1; then
    return 0
  fi

  if "$PYTHON" -m ensurepip --version >/dev/null 2>&1; then
    "$PYTHON" -m ensurepip --upgrade >/dev/null
  fi

  if "$PYTHON" -m pip --version >/dev/null 2>&1; then
    return 0
  fi

  echo "Error: pip is not available for $PYTHON." >&2
  echo "Install it (Debian/Ubuntu): sudo apt-get update && sudo apt-get install -y python3-pip" >&2
  echo "Or, if available: $PYTHON -m ensurepip --upgrade" >&2
  return 1
}

ensure_venv() {
  if [[ -x "$VENV_DIR/bin/python" ]]; then
    return 0
  fi

  if "$PYTHON" -m venv "$VENV_DIR" >/dev/null 2>&1; then
    return 0
  fi

  echo "Error: unable to create a virtualenv via '$PYTHON -m venv'." >&2
  echo "Install venv support (Debian/Ubuntu): sudo apt-get update && sudo apt-get install -y python3-venv" >&2
  return 1
}

pick_python_for_run() {
  if [[ -x "$VENV_DIR/bin/python" ]]; then
    echo "$VENV_DIR/bin/python"
  else
    echo "$PYTHON"
  fi
}

if [[ "$INSTALL" == "1" ]]; then
  # Avoid PEP 668 "externally-managed-environment" by installing into a venv.
  ensure_venv
  VPY="$(pick_python_for_run)"
  ensure_pip() { "$VPY" -m pip --version >/dev/null 2>&1 || "$VPY" -m ensurepip --upgrade >/dev/null 2>&1; }
  ensure_pip
  "$VPY" -m pip install -r pipeline/requirements.txt
  "$VPY" -m pip install -r pipeline/requirements-dev.txt
fi

RPY="$(pick_python_for_run)"
"$RPY" -m pytest -s -p no:terminalreporter -c pipeline/pytest.ini pipeline/tests

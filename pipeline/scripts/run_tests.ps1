param(
	[switch]$Install,
	[string]$Python = "python"
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\\..")
Push-Location $RepoRoot
try {
	if ($Install) {
		& $Python -m pip install -r pipeline/requirements.txt
		& $Python -m pip install -r pipeline/requirements-dev.txt
	}

	& $Python -m pytest -s -p no:terminalreporter -c pipeline/pytest.ini pipeline/tests
	exit $LASTEXITCODE
}
finally {
	Pop-Location
}

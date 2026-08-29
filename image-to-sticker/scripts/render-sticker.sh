#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 ]]; then
	printf 'Usage: %s <source-image> <source-card.json> <output-directory>\n' "$0" >&2
	exit 2
fi

root_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
entrypoint="$root_dir/dist/src/render-cli.js"

[[ -f "$entrypoint" ]] || {
	printf 'Error: run npm run build in %s before rendering.\n' "$root_dir" >&2
	exit 127
}

node "$entrypoint" "$1" "$2" "$3"

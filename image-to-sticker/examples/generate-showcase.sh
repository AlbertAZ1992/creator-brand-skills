#!/usr/bin/env bash
set -euo pipefail

root_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
example_dir="$root_dir/examples/generated/open-source-tech"
source_dir="$example_dir/sources"

for slug in vite-bolt react typescript astro vue deno; do
	output_dir="$example_dir/$slug"
	bash "$root_dir/scripts/render-sticker.sh" \
		"$source_dir/$slug.svg" \
		"$output_dir/source-card.input.json" \
		"$output_dir" >/dev/null
done

node "$root_dir/examples/build-showcase.mjs"
printf 'Regenerated six source-to-sticker style examples.\n'

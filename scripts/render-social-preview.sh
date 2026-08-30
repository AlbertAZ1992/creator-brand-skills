#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
layout="$repo_root/.github/social-preview.svg"
output="$repo_root/.github/social-preview.png"
work_dir="$(mktemp -d)"

cleanup() {
	local file

	for file in "$work_dir"/*.png; do
		if [[ -f "$file" ]]; then
			rm "$file"
		fi
	done
	rmdir "$work_dir"
}

require_command() {
	local command_name="$1"

	if ! command -v "$command_name" >/dev/null 2>&1; then
		echo "Missing required command: $command_name" >&2
		exit 1
	fi
}

render_card() {
	local source="$1"
	local background="$2"
	local name="$3"
	local card="$work_dir/$name-card.png"
	local mask="$work_dir/$name-mask.png"

	magick "$source" -resize '281x232' -gravity center \
		-background "$background" -extent '313x264' "$card"
	magick -size '313x264' xc:none -fill white \
		-draw 'roundrectangle 0,0 312,263 22,22' "$mask"
	magick "$card" "$mask" -alpha off -compose CopyOpacity -composite "$card"
}

composite_card() {
	local base="$1"
	local card="$2"
	local geometry="$3"
	local next="$work_dir/composite-$4.png"

	magick "$base" "$card" -geometry "$geometry" -compose Over -composite "$next"
	cp "$next" "$base"
}

trap cleanup EXIT

require_command magick
require_command sips

sips -s format png "$layout" --out "$work_dir/base.png" >/dev/null

render_card "$repo_root/logo-to-clay/examples/generated/clay-render.png" '#eee7dc' clay
render_card \
	"$repo_root/image-to-sticker/examples/generated/recommended-preview.png" \
	'#f3efe9' sticker
render_card \
	"$repo_root/feature-to-icons/examples/social-publishing-outline/icon-family-preview.png" \
	'#ffffff' icons
render_card \
	"$repo_root/product-to-mascot/examples/generated/threads-mascot-preview.png" \
	'#f3efe9' mascot

composite_card "$work_dir/base.png" "$work_dir/clay-card.png" '+574+46' 1
composite_card "$work_dir/base.png" "$work_dir/sticker-card.png" '+907+46' 2
composite_card "$work_dir/base.png" "$work_dir/icons-card.png" '+574+330' 3
composite_card "$work_dir/base.png" "$work_dir/mascot-card.png" '+907+330' 4

magick "$work_dir/base.png" -strip "$output"
echo "Rendered $output"

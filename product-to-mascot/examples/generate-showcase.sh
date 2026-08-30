#!/usr/bin/env bash
set -euo pipefail

root_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
temp_dir=$(mktemp -d "${TMPDIR:-/tmp}/creator-brand-mascot.XXXXXX")

cleanup() {
	rm -f "$temp_dir/source-brief.png"
	rmdir "$temp_dir"
}

trap cleanup EXIT HUP INT TERM

node "$root_dir/examples/build-source-briefs.mjs"

rasterize_source_brief() {
	local source_file=$1
	local output_file=$2

	if command -v sips >/dev/null 2>&1; then
		sips -s format png "$source_file" --out "$output_file" >/dev/null
	elif command -v rsvg-convert >/dev/null 2>&1; then
		rsvg-convert "$source_file" --output "$output_file"
	else
		magick -background none "$source_file" "$output_file"
	fi
}

build_source_to_mascot() {
	local example_dir=$1
	local output_file="$example_dir/source-to-mascot.png"
	local brief_png="$temp_dir/source-brief.png"

	rasterize_source_brief "$example_dir/source-brief.svg" "$brief_png"

	magick \
		-size 1600x640 'xc:#F3EFE7' \
		-fill '#D8D0C5' \
		-draw 'roundrectangle 31,103 583,537 24,24' \
		-draw 'roundrectangle 649,103 1569,537 24,24' \
		-fill '#FFFDF8' \
		-draw 'roundrectangle 33,105 581,535 23,23' \
		-draw 'roundrectangle 651,105 1567,535 23,23' \
		-fill '#20A7C9' \
		-draw 'line 597,320 630,320 polygon 630,320 617,310 617,330' \
		\( "$brief_png" -resize 500x300 \) \
		-geometry +57+170 -composite \
		\( "$example_dir/mascot-contact-sheet.png" -resize 860x172 \) \
		-geometry +678+234 -composite \
		"$output_file"
}

for slug in openpatch-pip albertaz-azi mora-mori; do
	sh "$root_dir/scripts/verify-mascot-reference-set.sh" \
		"$root_dir/examples/generated/$slug"
	build_source_to_mascot "$root_dir/examples/generated/$slug"
done

printf 'Regenerated the approved source-to-mascot boards for Pip, Azi, and Mori.\n'

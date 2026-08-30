#!/usr/bin/env bash
set -euo pipefail

root_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
reference_dir="$root_dir/examples/generated/mora-mori"
output_path="$root_dir/examples/generated/mori-mascot-showcase.png"
work_dir=$(mktemp -d "${TMPDIR:-/tmp}/mascot-showcase.XXXXXX")
font_path=${MASCOT_SHOWCASE_FONT:-}

if [[ -z "$font_path" ]]; then
	for candidate in \
		'/System/Library/Fonts/Helvetica.ttc' \
		'/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; do
		if [[ -f "$candidate" ]]; then
			font_path=$candidate
			break
		fi
	done
fi

if [[ -z "$font_path" ]]; then
	printf 'Set MASCOT_SHOWCASE_FONT to a readable TTF or TTC font.\n' >&2
	exit 1
fi

cleanup() {
	find "$work_dir" -type f -delete
	find "$work_dir" -depth -type d -empty -delete
}
trap cleanup EXIT HUP INT TERM

command -v magick >/dev/null

make_card() {
	local source=$1
	local label=$2
	local size=$3
	local image_size=$4
	local output=$5
	magick -size "$size" xc:none \
		-fill '#fffaf4' -draw "roundrectangle 0,0 %[fx:w-1],%[fx:h-1] 30,30" \
		\( "$source" -resize "$image_size" \) \
		-gravity north -geometry +0+22 -composite \
		-gravity south -font "$font_path" -fill '#173a42' -pointsize 18 \
		-annotate +0+18 "$label" "$output"
}

make_card "$reference_dir/mascot-primary.png" 'PRIMARY' 420x640 '380x530>' \
	"$work_dir/primary.png"
make_card "$reference_dir/mascot-welcome.png" 'WELCOME' 320x300 '270x230>' \
	"$work_dir/welcome.png"
make_card "$reference_dir/mascot-working.png" 'WORKING' 320x300 '270x230>' \
	"$work_dir/working.png"
make_card "$reference_dir/mascot-thinking.png" 'THINKING' 320x300 '270x230>' \
	"$work_dir/thinking.png"
make_card "$reference_dir/mascot-celebrate.png" 'CELEBRATE' 320x300 '270x230>' \
	"$work_dir/celebrate.png"

magick -size 1200x720 gradient:'#0d2933-#245866' \
	-fill '#b9d75d' -draw 'circle 90,680 210,680' \
	-fill '#ff7665' -draw 'circle 1130,70 1260,70' \
	"$work_dir/primary.png" -geometry +40+40 -composite \
	"$work_dir/welcome.png" -geometry +500+40 -composite \
	"$work_dir/working.png" -geometry +840+40 -composite \
	"$work_dir/thinking.png" -geometry +500+380 -composite \
	"$work_dir/celebrate.png" -geometry +840+380 -composite \
	"$output_path"

printf 'Generated Product to Mascot showcase at %s\n' "$output_path"

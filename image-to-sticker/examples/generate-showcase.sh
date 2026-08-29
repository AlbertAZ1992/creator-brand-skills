#!/usr/bin/env bash
set -euo pipefail

root_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
source_path="$root_dir/examples/assets/threads-wordmark.png"
generated_dir="$root_dir/examples/generated"
work_dir=$(mktemp -d "${TMPDIR:-/tmp}/image-to-sticker-showcase.XXXXXX")
font_path=${STICKER_SHOWCASE_FONT:-}

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
	printf 'Set STICKER_SHOWCASE_FONT to a readable TTF or TTC font.\n' >&2
	exit 1
fi

cleanup() {
	find "$work_dir" -type f -delete
	find "$work_dir" -depth -type d -empty -delete
}
trap cleanup EXIT HUP INT TERM

command -v jq >/dev/null
command -v magick >/dev/null
mkdir -p "$generated_dir/recommended"

render_variant() {
	local name=$1
	local width=$2
	local color=$3
	local tilt=$4
	local material=${5:-original}
	render_asset_variant "$name" "$source_path" alpha "$width" "$color" "$tilt" "$material"
}

render_asset_variant() {
	local name=$1
	local asset_path=$2
	local background_mode=$3
	local width=$4
	local color=$5
	local tilt=$6
	local material=${7:-original}
	local variant_dir="$work_dir/$name"
	local card_path="$variant_dir/source-card.input.json"
	mkdir -p "$variant_dir"
	jq -n \
		--arg source "examples/assets/$(basename "$asset_path")" \
		--arg backgroundMode "$background_mode" \
		--arg color "$color" \
		--arg material "$material" \
		--argjson width "$width" \
		--argjson tilt "$tilt" \
		'{
		  version: 4,
		  sourceImage: $source,
		  backgroundMode: $backgroundMode,
		  outlineWidth: $width,
		  outlineColor: $color,
		  material: $material,
		  tilt: $tilt,
		  size: 1024
		}' >"$card_path"
	bash "$root_dir/scripts/render-sticker.sh" \
		"$asset_path" "$card_path" "$variant_dir" >/dev/null
}

make_cell() {
	local source=$1
	local label=$2
	local output=$3
	magick "$work_dir/cell-background.png" \
		\( "$source" -trim +repage -resize '400x150>' \) \
		-gravity north -geometry +0+42 -composite \
		-gravity south -font "$font_path" -fill '#24211d' -pointsize 22 \
		-annotate +0+16 "$label" "$output"
}

make_alpha_cell() {
	local source=$1
	local label=$2
	local output=$3
	magick -size 480x300 xc:'#101114' \
		\( "$source" -trim +repage -resize '420x180>' \) \
		-gravity north -geometry +0+35 -composite \
		-gravity south -font "$font_path" -fill '#ffffff' -pointsize 24 \
		-annotate +0+10 "$label" "$output"
}

magick -size 480x300 gradient:'#f7f3ec-#e9e2d8' \
	"$work_dir/cell-background.png"

for width in 1 4 8 18; do
	name=$(printf 'width-%02d' "$width")
	render_variant "$name" "$width" '#ffffff' 0
	make_cell "$work_dir/$name/sticker.png" "$width px" "$work_dir/$name-cell.png"
	make_alpha_cell "$work_dir/$name/sticker-alpha-proof.png" \
		"$width px alpha" "$work_dir/$name-alpha.png"
done

magick montage -font "$font_path" +label "$work_dir"/width-??-cell.png \
	-tile 4x1 -geometry +16+16 \
	-background '#ded7cc' "$generated_dir/outline-widths.png"
magick montage -font "$font_path" +label "$work_dir"/width-??-alpha.png \
	-tile 4x1 -geometry +16+16 \
	-background '#606166' "$generated_dir/outline-alpha.png"

for tilt in -12 0 12; do
	name=$(printf 'tilt-%+03d' "$tilt")
	render_variant "$name" 4 '#ffffff' "$tilt"
	make_cell "$work_dir/$name/sticker.png" "$tilt degrees" "$work_dir/$name-cell.png"
done
magick montage \
	-font "$font_path" \
	+label \
	"$work_dir/tilt--12-cell.png" \
	"$work_dir/tilt-+00-cell.png" \
	"$work_dir/tilt-+12-cell.png" \
	-tile 3x1 -geometry +16+16 \
	-background '#ded7cc' "$generated_dir/tilts.png"

for entry in white:#ffffff yellow:#ffe04b cyan:#00d4ff pink:#ff4db8; do
	name="color-${entry%%:*}"
	color="${entry#*:}"
	render_variant "$name" 4 "$color" 0
	make_cell "$work_dir/$name/sticker.png" "${entry%%:*}" "$work_dir/$name-cell.png"
done
magick montage \
	-font "$font_path" \
	+label \
	"$work_dir/color-white-cell.png" \
	"$work_dir/color-yellow-cell.png" \
	"$work_dir/color-cyan-cell.png" \
	"$work_dir/color-pink-cell.png" \
	-tile 4x1 -geometry +16+16 \
	-background '#ded7cc' "$generated_dir/colors.png"

for material in original holographic glitter reflective; do
	name="material-$material"
	render_variant "$name" 4 '#ffffff' 0 "$material"
	make_cell "$work_dir/$name/sticker.png" "$material" "$work_dir/$name-cell.png"
done
magick montage \
	-font "$font_path" \
	+label \
	"$work_dir/material-original-cell.png" \
	"$work_dir/material-holographic-cell.png" \
	"$work_dir/material-glitter-cell.png" \
	"$work_dir/material-reflective-cell.png" \
	-tile 4x1 -geometry +16+16 -background '#ded7cc' \
	"$generated_dir/materials.png"

render_variant style-borderless 0 '#ffffff' 0 original
make_cell "$work_dir/style-borderless/sticker.png" 'borderless' \
	"$work_dir/style-borderless-cell.png"
render_variant style-thin 1 '#ffffff' 0 original
make_cell "$work_dir/style-thin/sticker.png" 'thin contour' \
	"$work_dir/style-thin-cell.png"
render_variant style-classic 18 '#ffffff' 0 original
make_cell "$work_dir/style-classic/sticker.png" 'classic contour' \
	"$work_dir/style-classic-cell.png"
render_variant style-color 8 '#ff4db8' 0 original
make_cell "$work_dir/style-color/sticker.png" 'color contour' \
	"$work_dir/style-color-cell.png"
magick montage \
	-font "$font_path" \
	+label \
	"$work_dir/style-borderless-cell.png" \
	"$work_dir/style-thin-cell.png" \
	"$work_dir/style-classic-cell.png" \
	"$work_dir/style-color-cell.png" \
	"$work_dir/material-original-cell.png" \
	"$work_dir/material-holographic-cell.png" \
	"$work_dir/material-glitter-cell.png" \
	"$work_dir/material-reflective-cell.png" \
	-tile 4x2 -geometry +16+16 -background '#ded7cc' \
	"$generated_dir/style-overview.png"

render_variant recommended 4 '#ffffff' -3
cp "$work_dir/recommended/sticker.png" "$generated_dir/recommended/sticker.png"
cp "$work_dir/recommended/sticker-alpha-proof.png" \
	"$generated_dir/recommended/sticker-alpha-proof.png"
cp "$work_dir/recommended/source-card.json" "$generated_dir/recommended/source-card.json"
cp "$work_dir/recommended/sticker-manifest.json" \
	"$generated_dir/recommended/sticker-manifest.json"
make_cell "$work_dir/recommended/sticker.png" \
	'classic white contour · -3 degrees' "$generated_dir/recommended-preview.png"

mkdir -p "$generated_dir/source-types"
render_asset_variant transparent-symbol \
	"$root_dir/examples/assets/transparent-symbol.svg" alpha 6 '#ffffff' 0 original
render_asset_variant flat-badge \
	"$root_dir/examples/assets/flat-badge.svg" flat 6 '#ffffff' 0 original
make_cell "$work_dir/transparent-symbol/sticker.png" \
	'transparent artwork' "$work_dir/transparent-symbol-cell.png"
make_cell "$work_dir/flat-badge/sticker.png" \
	'flat background' "$work_dir/flat-badge-cell.png"
magick montage \
	-font "$font_path" \
	+label \
	"$work_dir/transparent-symbol-cell.png" \
	"$work_dir/flat-badge-cell.png" \
	-tile 2x1 -geometry +16+16 -background '#b8b8b8' \
	"$generated_dir/source-types.png"

for name in transparent-symbol flat-badge; do
	mkdir -p "$generated_dir/source-types/$name"
	for artifact in sticker.png sticker-alpha-proof.png source-card.json \
		sticker-manifest.json; do
		cp "$work_dir/$name/$artifact" \
			"$generated_dir/source-types/$name/$artifact"
	done
done

jq -e '.verification.passed == true' \
	"$generated_dir/recommended/sticker-manifest.json" >/dev/null
jq -e '.verification.passed == true' \
	"$generated_dir/source-types/transparent-symbol/sticker-manifest.json" >/dev/null
jq -e '.verification.passed == true' \
	"$generated_dir/source-types/flat-badge/sticker-manifest.json" >/dev/null
printf 'Generated Image to Sticker showcase in %s\n' "$generated_dir"

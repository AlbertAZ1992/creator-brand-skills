#!/usr/bin/env bash
set -euo pipefail

root_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
work_dir=$(mktemp -d "${TMPDIR:-/tmp}/image-to-sticker-eval.XXXXXX")
input_path="$work_dir/ring.png"
narrow_card="$work_dir/narrow-source-card.json"
wide_card="$work_dir/wide-source-card.json"
clarity_input="$work_dir/clarity.png"
clarity_card="$work_dir/clarity-source-card.json"
narrow_dir="$work_dir/narrow"
wide_dir="$work_dir/wide"
clarity_dir="$work_dir/clarity"
wrong_card="$work_dir/wrong-source-card.json"

cleanup() {
	find "$work_dir" -type f -delete
	find "$work_dir" -depth -type d -empty -delete
}
trap cleanup EXIT HUP INT TERM

mkdir "$narrow_dir" "$wide_dir" "$clarity_dir"
magick -size 240x160 xc:'#FAFAF8' \
	-fill '#111827' -draw 'roundrectangle 20,35 220,125 28,28' \
	-fill '#FAFAF8' -draw 'circle 65,80 65,60' \
	-fill '#2F80ED' -draw 'roundrectangle 95,58 200,102 12,12' \
	"$input_path"

jq -n '{
  version: 4,
  sourceImage: "ring.png",
  backgroundMode: "flat",
  outlineWidth: 1,
  outlineColor: "#ffffff",
  material: "original",
  tilt: -10.5,
  size: 1024
}' >"$narrow_card"

jq '.sourceImage = "different.png"' "$narrow_card" >"$wrong_card"
if bash "$root_dir/scripts/render-sticker.sh" \
	"$input_path" "$wrong_card" "$work_dir/wrong" >/dev/null 2>&1; then
	printf 'Mismatched source provenance unexpectedly passed.\n' >&2
	exit 1
fi

bash "$root_dir/scripts/render-sticker.sh" "$input_path" "$narrow_card" "$narrow_dir"

image_info=$(magick identify -format '%wx%h:%[channels]' "$narrow_dir/sticker.png")
[[ "$image_info" == 1024x1024:*a* ]] || exit 1
proof_colorspace=$(magick identify -format '%[colorspace]' \
	"$narrow_dir/sticker-alpha-proof.png")
[[ "$proof_colorspace" == Gray ]] || exit 1

jq -e '
  .version == 4 and
  .sourceCard == "source-card.json" and
  .asset.file == "sticker.png" and
  .asset.width == 1024 and
  .asset.height == 1024 and
  .asset.rgba == true and
  .pipeline.backgroundMask == "flat" and
  .pipeline.outlineWidth == 1 and
  .pipeline.outlineRadius == 2.35 and
  .pipeline.material == "original" and
  .pipeline.tilt == -10.5 and
  .pipeline.rgbOperation == "source-over-outline-then-material" and
  (.verification.interiorTransparentPixels > 0) and
  .verification.cornerAlpha == 0 and
  (.verification.visibleCoverage > 0.01) and
  (.verification.visibleCoverage < 0.95) and
  .verification.passed == true
' "$narrow_dir/sticker-manifest.json" >/dev/null

for material in holographic glitter reflective; do
	material_card="$work_dir/$material-source-card.json"
	material_dir="$work_dir/$material"
	mkdir "$material_dir"
	jq -n --arg material "$material" '{
      version: 4,
      sourceImage: "ring.png",
      backgroundMode: "flat",
      outlineWidth: 1,
      outlineColor: "#ffffff",
      material: $material,
      tilt: -10.5,
      size: 1024
    }' >"$material_card"
	bash "$root_dir/scripts/render-sticker.sh" \
		"$input_path" "$material_card" "$material_dir"
	cmp "$narrow_dir/sticker-alpha-proof.png" \
		"$material_dir/sticker-alpha-proof.png"
	if cmp -s "$narrow_dir/sticker.png" "$material_dir/sticker.png"; then
		exit 1
	fi
	jq -e --arg material "$material" '
      .pipeline.material == $material and
      .verification.passed == true
    ' "$material_dir/sticker-manifest.json" >/dev/null
done

jq -n '{
  version: 4,
  sourceImage: "ring.png",
  backgroundMode: "flat",
  outlineWidth: 12,
  outlineColor: "#ffffff",
  material: "original",
  tilt: 0,
  size: 1024
}' >"$wide_card"
bash "$root_dir/scripts/render-sticker.sh" "$input_path" "$wide_card" "$wide_dir"

narrow_holes=$(jq -r '.verification.interiorTransparentPixels' \
	"$narrow_dir/sticker-manifest.json")
wide_holes=$(jq -r '.verification.interiorTransparentPixels' \
	"$wide_dir/sticker-manifest.json")
((narrow_holes > wide_holes))

magick -size 960x320 xc:'#ffffff' \
	-fill '#000000' -draw 'circle 170,160 170,45' \
	-fill '#ffffff' -draw 'circle 170,160 170,95' \
	-fill '#000000' -draw 'roundrectangle 340,70 890,250 58,58' \
	-fill '#ffffff' -draw 'circle 500,160 500,112' \
	"$clarity_input"
jq -n '{
  version: 4,
  sourceImage: "clarity.png",
  backgroundMode: "flat",
  outlineWidth: 0,
  outlineColor: "#ffffff",
  material: "original",
  tilt: 0,
  size: 512
}' >"$clarity_card"
bash "$root_dir/scripts/render-sticker.sh" \
	"$clarity_input" "$clarity_card" "$clarity_dir"

max_rgb=$(magick "$clarity_dir/sticker.png" -background '#000000' -alpha remove \
	-format '%[fx:maxima]' info:)
awk -v value="$max_rgb" 'BEGIN { exit !(value <= 0.03) }'
jq -e '
  .pipeline.outlineWidth == 0 and
  .pipeline.outlineRadius == 0 and
  (.verification.softAlphaCoverage > 0) and
  (.verification.interiorTransparentPixels > 0) and
  .verification.passed == true
' "$clarity_dir/sticker-manifest.json" >/dev/null

printf 'Image to Sticker topology and clarity deliverable eval passed.\n'

#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
	echo "Usage: $0 <mascot-reference-directory>" >&2
	exit 2
fi

reference_dir=$1
files='mascot-primary mascot-welcome mascot-working mascot-thinking mascot-celebrate'

if ! command -v magick >/dev/null 2>&1; then
	echo "Error: ImageMagick 'magick' is required." >&2
	exit 127
fi

if [ ! -d "$reference_dir" ]; then
	echo "Error: reference directory does not exist: $reference_dir" >&2
	exit 2
fi

if [ ! -f "$reference_dir/character-bible.json" ]; then
	echo "Error: missing character-bible.json." >&2
	exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
	echo "Error: jq is required to validate character-bible.json." >&2
	exit 127
fi

if ! jq -e '
  .version == 2 and
  (.productName | type == "string" and length > 0) and
  (.mascotName | type == "string" and length > 0) and
  (.brandEssence | type == "array" and length >= 3 and length <= 5) and
  (.productConnection | type == "string" and length > 0) and
  (.silhouette | type == "string" and length > 0) and
  (.proportions | type == "string" and length > 0) and
  (.faceRule | type == "string" and length > 0) and
  (.palette | type == "array" and length >= 3 and length <= 5) and
  (.signatureFeature | type == "string" and length > 0) and
  (.appealHook | type == "string" and length > 0) and
  (.renderingRule | type == "string" and length > 0) and
  (.minimumSize | type == "number" and . >= 24 and . <= 128) and
  (.clearSpace | type == "string" and length > 0) and
  (.avoids | type == "array" and length == 3)
' \
	"$reference_dir/character-bible.json" >/dev/null; then
	echo "Error: character-bible.json is not a valid V2 character bible." >&2
	exit 1
fi

for name in $files; do
	image_path="$reference_dir/$name.png"

	if [ ! -f "$image_path" ]; then
		echo "Error: missing required reference: $image_path" >&2
		exit 2
	fi

	width=$(magick identify -format '%w' "$image_path")
	height=$(magick identify -format '%h' "$image_path")

	if [ "$width" -lt 512 ] || [ "$height" -lt 512 ]; then
		echo "Error: $name must be at least 512 px in both dimensions." >&2
		exit 1
	fi
done

magick \
	\( "$reference_dir/mascot-primary.png" -thumbnail 240x240 -background white \
	-gravity center -extent 256x256 \) \
	\( "$reference_dir/mascot-welcome.png" -thumbnail 240x240 -background white \
	-gravity center -extent 256x256 \) \
	\( "$reference_dir/mascot-working.png" -thumbnail 240x240 -background white \
	-gravity center -extent 256x256 \) \
	\( "$reference_dir/mascot-thinking.png" -thumbnail 240x240 -background white \
	-gravity center -extent 256x256 \) \
	\( "$reference_dir/mascot-celebrate.png" -thumbnail 240x240 -background white \
	-gravity center -extent 256x256 \) \
	+append "PNG24:$reference_dir/mascot-contact-sheet.png"

printf '%s\n' \
	'{' \
	'  "version": 2,' \
	'  "characterBible": "character-bible.json",' \
	'  "references": [' \
	'    "mascot-primary.png",' \
	'    "mascot-welcome.png",' \
	'    "mascot-working.png",' \
	'    "mascot-thinking.png",' \
	'    "mascot-celebrate.png"' \
	'  ],' \
	'  "contactSheet": "mascot-contact-sheet.png",' \
	'  "passed": true' \
	'}' >"$reference_dir/mascot-manifest.json"

echo "Verified 5 mascot reference images in $reference_dir"

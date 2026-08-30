#!/bin/sh
set -eu

root_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
work_dir=$(mktemp -d "${TMPDIR:-/tmp}/product-to-mascot-eval.XXXXXX")
names='primary welcome working thinking celebrate'

cleanup() {
	find "$work_dir" -type f -delete
	rmdir "$work_dir"
}
trap cleanup EXIT HUP INT TERM

printf '%s\n' \
	'{"version":2,"productName":"Seedling","mascotName":"Sprig",' \
	'"brandEssence":["growth","care","clarity"],"personality":"friendly",' \
	'"mascotType":"animal","productConnection":"sprout growth mirrors plant care",' \
	'"silhouette":"round sprout","proportions":"60% head, tiny body and short limbs",' \
	'"faceRule":"dewdrop eyes and two cheek dots",' \
	'"palette":["#7CB342","#FFD54F","#FFF8E1"],"signatureFeature":"watering can",' \
	'"appealHook":"one leaf always leans toward the viewer","renderingRule":"flat vector",' \
	'"minimumSize":32,"clearSpace":"one eye width",' \
	'"avoids":["text","gradients","realism"]}' \
	>"$work_dir/character-bible.json"

for name in $names; do
	magick -size 1024x1024 xc:'#FFF8E1' \
		-fill '#7CB342' -draw 'circle 512,512 512,256' \
		"$work_dir/mascot-$name.png"
done

"$root_dir/scripts/verify-mascot-reference-set.sh" "$work_dir"

test -f "$work_dir/mascot-contact-sheet.png"
test "$(magick identify -format '%wx%h' "$work_dir/mascot-contact-sheet.png")" = '1280x256'
jq -e '
  .version == 2 and
  .characterBible == "character-bible.json" and
  (.references | length == 5) and
  .contactSheet == "mascot-contact-sheet.png" and
  .passed == true
' "$work_dir/mascot-manifest.json" >/dev/null
echo 'Mascot deliverable eval passed.'

#!/usr/bin/env bash
set -euo pipefail

root_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)

for slug in openpatch-pip albertaz-azi mora-mori; do
	sh "$root_dir/scripts/verify-mascot-reference-set.sh" \
		"$root_dir/examples/generated/$slug"
done

printf 'Regenerated the approved Pip, Azi, and Mori contact sheets.\n'

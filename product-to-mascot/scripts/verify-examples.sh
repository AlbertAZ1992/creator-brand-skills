#!/bin/sh
set -eu

root_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)

for slug in albertaz-azi openpatch-pip mora-mori; do
	example_dir="$root_dir/examples/generated/$slug"
	if [ ! -s "$example_dir/source-brief.svg" ]; then
		echo "Error: missing example source brief: $example_dir/source-brief.svg" >&2
		exit 2
	fi
	sh "$root_dir/scripts/verify-mascot-reference-set.sh" "$example_dir"
done

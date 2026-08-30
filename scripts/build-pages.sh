#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_dir="$repo_root/feature-to-icons/examples/creator-doodle-animated"
output_dir="$repo_root/.pages"

if [[ -d "$output_dir" ]]; then
	find "$output_dir" -mindepth 1 -delete
else
	mkdir -p "$output_dir"
fi

cp -R "$repo_root/site/." "$output_dir/"
mkdir -p "$output_dir/icons"

while IFS= read -r icon_path; do
	cp "$icon_path" "$output_dir/icons/"
done < <(find "$source_dir" -maxdepth 1 -type f -name '*.svg' \
	! -name 'showcase-*' ! -name 'icon-family-*' | sort)

icon_count="$(find "$output_dir/icons" -maxdepth 1 -type f -name '*.svg' | wc -l | tr -d ' ')"
if [[ "$icon_count" != "20" ]]; then
	echo "Expected 20 playground icons, found $icon_count" >&2
	exit 1
fi

(
	cd "$output_dir/icons"
	zip -q albertaz-doodle-icons.zip ./*.svg
)

touch "$output_dir/.nojekyll"
echo "Built the icons playground in $output_dir with $icon_count SVGs."

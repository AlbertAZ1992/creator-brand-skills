#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
expected_skills=(feature-to-icons image-to-sticker logo-to-clay product-to-mascot)
skills_output="$(mktemp)"
trap 'rm -f "$skills_output"' EXIT

cd "$repo_root"

skill_count="$(find . -mindepth 2 -maxdepth 2 -name SKILL.md -print | wc -l | tr -d ' ')"
if [[ "$skill_count" != "${#expected_skills[@]}" ]]; then
	printf 'Expected %s top-level Skills, found %s.\n' \
		"${#expected_skills[@]}" "$skill_count" >&2
	exit 1
fi

npx --yes skills add . --list | tee "$skills_output"
for skill in "${expected_skills[@]}"; do
	if ! grep -q "$skill" "$skills_output"; then
		printf 'Skills CLI did not discover %s.\n' "$skill" >&2
		exit 1
	fi
done

node scripts/verify-readme-links.mjs
./scripts/build-pages.sh

while IFS= read -r shell_file; do
	shellcheck "$shell_file"
	shfmt -d "$shell_file"
done < <(git ls-files '*.sh')

printf 'PASS repository install discovery, docs, site build, and shell checks.\n'

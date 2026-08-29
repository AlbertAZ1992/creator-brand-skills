#!/usr/bin/env bash
set -euo pipefail

REPO_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
readonly REPO_DIR
readonly CREATOR_BRAND_SKILLS=(
	feature-to-icons
	image-to-sticker
	logo-to-clay
	product-to-mascot
)

usage() {
	cat <<'USAGE'
Run reproducible verification for Creator Brand Skills.

Usage:
  ./scripts/verify.sh [skill ...]

With no names, all Creator Brand Skills are verified. Each selected package runs
npm ci followed by npm run verify.
USAGE
}

is_known_skill() {
	local candidate=$1
	local skill
	for skill in "${CREATOR_BRAND_SKILLS[@]}"; do
		if [[ $candidate == "$skill" ]]; then
			return 0
		fi
	done
	return 1
}

targets=()
while (($# > 0)); do
	case $1 in
	-h | --help)
		usage
		exit 0
		;;
	--*)
		printf 'Unknown option: %s\n' "$1" >&2
		usage >&2
		exit 2
		;;
	*)
		targets+=("$1")
		;;
	esac
	shift
done

if ((${#targets[@]} == 0)); then
	targets=("${CREATOR_BRAND_SKILLS[@]}")
fi

for skill in "${targets[@]}"; do
	if ! is_known_skill "$skill"; then
		printf 'Unknown Creator Brand Skill: %s\n' "$skill" >&2
		exit 2
	fi
	printf '\nVerifying %s...\n' "$skill"
	(
		cd "$REPO_DIR/$skill"
		npm ci
		npm run verify
	)
done

printf '\nAll selected Creator Brand Skills passed.\n'

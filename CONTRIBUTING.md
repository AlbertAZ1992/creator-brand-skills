# Contributing

Thanks for helping improve Creator Brand Skills. Changes should preserve the
repository's central contract: lock the user's source truth, create the asset,
finish it deterministically where possible, and verify the real deliverable.

## Development setup

Requirements: Node.js 22, npm, ImageMagick, `jq`, ShellCheck, and `shfmt`.

```bash
git clone https://github.com/AlbertAZ1992/creator-brand-skills.git
cd creator-brand-skills
./scripts/verify.sh
./scripts/verify-repository.sh
```

Each Skill is an independent package. Work inside the affected directory and
run its `npm run verify` command before running the root checks.

## Pull requests

- Keep one user-visible change per pull request.
- Update the Skill contract, schemas, tests, examples, and README together when
  output behavior changes.
- Show the original input beside any new public example output.
- Do not replace accepted visual fixtures without explaining the quality gain
  and retaining machine-verifiable deliverables.
- Do not commit local review files, exported source bundles, API keys, or
  third-party assets without clear permission and attribution.

By contributing, you agree that your contribution is licensed under the MIT
License in this repository.

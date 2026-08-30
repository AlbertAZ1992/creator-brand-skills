# Logo to Clay evals

The eval suite checks how natural-language choices map into the clay render
prompt. It runs offline and does not call an image model.

## Request matrix

| Case | Input route | Must express | Must avoid |
| --- | --- | --- | --- |
| `default-object` | Minimal logo input | Refined clay, standalone object, matte material | Relief and cartoon language |
| `image-output` | Image only | Shared clay image style | Removed texture modes |
| `object-shape` | Object | Slim standalone form | Relief language |
| `relief-shape` | Relief | Raised logo and backing surface | Standalone-object language |
| `transparent-background` | Transparent render | Alpha and isolated object | Studio background |
| `studio-background` | Studio render | Deliberate editorial composition and thumbnail contrast | Alpha background |
| `all-params` | Relief + color + depth + background | Every supplied choice | Removed modes |

## Run

```bash
npm run eval
```

Each case defines normalized input plus required and forbidden prompt content.
Failures identify the missing or conflicting behavior.

## Deliverable eval

```bash
npm run verify:deliverables
```

This builds a real mesh from a disposable fixture and verifies OBJ vertices and
faces, MTL linkage, the 1024 px PNG preview, and the manifest. It does not claim
to measure subjective image aesthetics.

Run `npm run verify` for lint, formatting, types, unit tests, request
evals, and the real deliverable eval together.

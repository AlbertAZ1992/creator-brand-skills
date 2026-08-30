# Feature to Icons forward tests

For committed SVG and PNG outputs across nine visual systems, see the
[`feature-to-icons/examples/`](../feature-to-icons/examples/) gallery.

No source file is required. Save outputs outside the repository.

## 1. Default route

```text
Use $feature-to-icons to make duotone icons for Capture Ideas, Shape Story,
Build Palette, Brand Library, Publish Kit, and Measure Reach. Use #5B4BDB and
#FF7665. Save the family under
/absolute/path/to/brand-tests/icons-default.
```

Expected: six distinct Phosphor duotone icons using one shared 32 px viewBox and
the supplied colour hierarchy.

Accept when:

- all six feature names appear exactly once in metadata;
- every SVG shares the same design contract;
- metadata identifies Phosphor 2.1.1, MIT, and one native weight;
- the SVG and PNG family previews exist; and
- the manifest passes with one optical metric per icon.

## 2. Product-aware route

```text
Use $feature-to-icons for Dashboard, Analytics, Reports, Users, Teams, Billing,
Invoice, Settings, Integrations, and API. The product is a cloud analytics
platform for enterprise data teams. Use a 32 px outline family.
```

Expected: product-aware metaphors without changing the shared Phosphor weight.

## 3. Filled route

```text
Use $feature-to-icons for Team Chat, File Sharing, Video Calls, Task Board, and
Calendar. Use filled icons, a 32 px grid, round corners, and #6366F1.
```

Expected: native Phosphor fill silhouettes using the supplied brand color.

## 4. Duotone route

```text
Use $feature-to-icons for Shopping Cart, Wishlist, Orders, Profile, and
Payment. Use duotone icons with #FF6B35 primary and #004E89 secondary. Save the
family under /absolute/path/to/brand-tests/icons-duotone.
```

Expected: both colors appear with a consistent primary/secondary hierarchy.

## 5. Bold alert family

```text
Use $feature-to-icons for Notifications, Alerts, Warnings, and Errors. Use a
bold outline family in #E5484D.
```

Expected: one Phosphor bold family and distinct silhouettes for all four
concepts.

## 6. Ambiguous semantic match

```text
Use $feature-to-icons for Discovery, Exploration, and Research. Show me the
source choices before delivery if any match is ambiguous.
```

Expected: the Skill exposes candidate icon names instead of silently inventing
or selecting a low-confidence metaphor.

## Boundary and failure tests

- Request exactly 3 unique features: accepted.
- Request exactly 20 unique features: accepted.
- Request 2 or 21 features: rejected with a clear count error.
- Repeat the same feature with different capitalization: rejected as a
  duplicate.
- Include text inside an SVG: delivery validation rejects it.
- Return one missing feature or an extra feature: exact-coverage validation
  rejects the family.

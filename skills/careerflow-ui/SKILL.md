---
name: careerflow-ui
description: Build or update CareerFlow React UI using its Figma component definitions, shared components, and Tailwind tokens. Use for frontend screens, forms, cards, dialogs, and visual changes in this repository.
---

# CareerFlow UI

## Source of truth

Use the [CareerFlow Figma file](https://www.figma.com/design/UfLyaQqXPdEpkWeRdCU5um/Careerflow?node-id=46-3538). The component definitions (`46:3538`) define variants; the UI kit (`46:3044`) shows composition. Inspect the relevant node with design context and a screenshot before changing its visual specification. Do not infer new colors or states from older app screens.

## Implementation

- Reuse exports from `frontend/src/components` before writing new markup. Keep presentation independent of API requests; pass data and event handlers as props. `JobCard` is the kit card; `ApplicationCard`, `InterviewCard`, and `SummaryCard` are existing domain views, not additional Figma definitions.
- Use React, TypeScript, and Tailwind utility classes. Shared tokens live in `frontend/src/global.css`. Use complete literal class names, including variant maps, so Tailwind can detect them.
- Use locally bundled Roboto with weights 400, 500, 600, and 700. Normal line-height is intentional for most headings, badges, and buttons. Match Figma’s rounded text boxes with 14px/16px labels, 21px/25px card titles, and 12px/17px helpers; field text is 15px/1.4 and dialog body 16px/1.5.
- Use semantic tokens: page `#222831`, surface `#393e46`, heading `#dfd0b8`, body `#948979`, secondary `#b8ac99`, border `#50535a`, disabled `#777675`, neutral badge `#494b4d`, success background `#414c46`, success text `#bdd0b5`, danger background `#543f40`, danger text `#e1a59c`.
- Primary actions are charcoal with beige text. Secondary actions have slate fill and taupe border. Reserve muted red for destructive actions and errors. Disabled styling uses explicit tokens, not opacity.
- Surface corners are 24px; control corners 10px; controls/buttons are 48px tall. Preserve measured exceptions: field gaps 9px, card gaps 22px, badge gaps 7px. Do not round them to a generic spacing scale. Figma strokes sit inside layout bounds: bordered card details use 15px top padding plus a 1px border; modal footers use 23px plus a 1px border to preserve the 16px/24px visual offsets.
- Use the exported SVGs in `frontend/public/ui` at their intrinsic sizes. Do not substitute icon libraries, redraw icons, recolor them, or retain temporary Figma URLs. Company initials are text; actual company imagery must come from caller data.

## Component map

| Component | Figma node | Rules |
| --- | --- | --- |
| JobCard | 46:3568 | Saved, Applied, Interview, Offer. 410×335 reference size; 24px padding; 22px gaps; 44px company mark; 21px bold title. Allow content to grow. |
| Input | 46:3677 | Default, filled, focus, error, disabled. 48px control, 16px horizontal padding, 14px medium label. Focus border 2px beige; error border 1px danger plus 17px alert icon. |
| Select | 46:3705 | Default, selected, open, disabled. Menu 8px below trigger, 6px padding, 2px gaps, 36px rows, selected slate fill and 16px check. |
| Textarea | 46:3747 | Default and error. 108px control height, 16px horizontal/14px vertical padding; helper below. |
| Button | 46:3760 | Primary, secondary, destructive, disabled. 48px height, 10px corners, 14px bold label. Width belongs to composition. |
| Badge | 46:3769 | Saved, Applied, Interview, Offer, Rejected. 28px height, 12px horizontal padding, 14px icon, 12px semibold label. |
| Checkbox | 46:3790 | Native unchecked/checked behavior. 20px square, 4px radius, 14px check, 10px label gap, 6px vertical padding. |
| AddApplicationModal | 46:3566 | 680px wide, 32px padding, 24px section gaps, 20px field gaps; role/company row; URL, status, notes; bordered footer. |
| DeleteApplicationModal | 46:3567 | 568px wide, 32px padding, 24px gaps; 52px warning mark; application summary; equal-width cancel/delete actions. |

## Behavior and verification

Filled/focus/disabled states should follow real values, focus, and native disabled semantics. Connect labels and helper/error IDs. Selects need keyboard navigation, Escape, outside dismissal, and a selected value. Dialogs need focus containment, Escape dismissal, and focus restoration. Do not hardcode specimen data into production components.

Keep the Figma desktop dimensions at the reference viewport; constrain surfaces to the available width and stack form columns on small screens. Responsive behavior beyond the supplied desktop designs is an implementation adaptation.

Use `/ui-kit` for the interactive variant gallery. After changes run `npm run build` and `npm run lint` in `frontend`, then compare affected components against Figma at the reference dimensions. Check local assets, their rendered sizes, long text, disabled/error states, keyboard interaction, and mobile overflow. Report any unverified visual differences honestly.

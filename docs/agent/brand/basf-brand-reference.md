# BASF digital product design reference

Repository note: This document and [suggested tokens](basf-brand-tokens.css) were extracted from a research archive. The archive's `assets/` folder and its downloads described below are not included here. The application logo is kept separately with the web app.

Compact, implementation-oriented notes for a customer-facing software product that is authorized to represent BASF. Prepared 3 November 2026 from a traversal of BASF's public Brand Portal. This is a secondary working reference, not a substitute for the current official guidelines or brand approval.

## Use and approval

BASF's Terms of Use say that third-party use of the BASF logo for advertising or sales promotion, and use of BASF templates, is generally not permitted without approval. Confirm that the product has permission to use BASF branding and the correct logo files before applying the identity. Do not recreate, recolor, animate, distort, or generate the logo. If brand architecture or co-branding is involved, confirm the correct treatment with the BASF brand contact.

The public guidelines are primarily communication guidance, not a complete software design system. In particular, they do not prescribe UI corner radii, spacing scales, component dimensions, motion, or responsive breakpoints. Suggested interface tokens below are clearly separated from official brand values.

## Included BASF downloads

The `assets/` folder contains two original public BASF downloads, included unchanged:

- `BASF-logo.zip` contains six JPG logo variants intended for white backgrounds, downloaded from BASF Spain's public logo page. They are raster images, not web-optimized SVGs. The public download page itself reiterates that third-party commercial/promotional logo use needs express approval. Use only the correct authorized lockup for the takehome and avoid enlarging these raster files beyond their useful resolution.
- `BASF-Guiding-Principles-template.zip` contains a 16:9 PowerPoint template (`.pptx`) linked from the Brand Portal's public “The Brand BASF” page. It is a presentation template, not an application UI template or component library; treat it as a visual reference.

The Brand Portal's dedicated logo download center redirected to BASF sign-in during this research. I did not access or bypass that restricted area. The public assets here are the available official downloads from BASF-owned sites; confirm with your BASF contact if the takehome requires a different, current master logo or digital file format.

## Core identity

### Corporate colors (official digital hex values)

The portal says to use one corporate color prominently per communication material where possible; use other colors sparingly to distinguish content, avoid a randomly colorful result, and use solid gradations rather than gradients. Color pairs are available where a second brand color is needed. Hex values are the portal's digital values.

| Name | Hex | Suggested UI role (adapt to contrast) |
|---|---:|---|
| BASF light blue | `#21A0D2` | Brand accent, selected states, data series |
| BASF dark blue | `#004A96` | Stronger links/actions, navigation accent |
| BASF light green | `#65AC1E` | Secondary accent, positive/data states |
| BASF dark green | `#00793A` | Stronger green accent |
| BASF orange | `#F39500` | Accent or data series; pair with dark text |
| BASF red | `#C50022` | Accent or data series; pair with white where appropriate |

The roles in the last column are implementation suggestions, not BASF-prescribed semantic meanings. The portal says the corporate colors have no designated meaning or order. Do not imply that a color is the official success/error/warning mapping; define accessible product semantics separately.

### Typography

- **Primary brand face:** New Helvetica, in the eight permitted styles shown by the portal. Font files are licensed; third-party designers/agencies creating BASF work must procure a license. Do not distribute font files without authorization.
- **Digital option:** Roboto is allowed for digital applications to ensure correct display. Use the static font version. The portal says variable Roboto requires contacting BASF; Roboto Condensed is impermissible.
- **Not a market-communication substitute:** Arial is for office communication and must not be used for market communication or outside the Microsoft environment.
- Use a restrained number of weights and sizes. Keep body copy legible, with adequate leading. Do not tighten or loosen tracking. The portal recommends black body text on white and white text reversed out of a corporate color.
- Product suggestion: when an authorized New Helvetica webfont is unavailable, use locally hosted static Roboto for the digital UI. Do not silently bundle licensed fonts. Keep fallback metrics sensible, e.g. `Roboto, Arial, sans-serif`.

### Logo and logo bar

- The BASF logo is the complete lockup: BASF lettering, square mark, and “We create chemistry” claim. The claim is not translated; the lockup is not animated or modified.
- Logo itself is black or white, not a corporate color. Put it on a uniform monochrome background, never on photography, gradients, or patterns. In most media it is white on a corporate-color background.
- Maintain clear space of at least one sixth of logo width on every side, including to the format edge. The minimum logo width is 15 mm in the source guideline so the claim remains legible; this is print-oriented and does not define a web pixel size.
- In market and corporate communication, BASF specifies a logo bar, with only the BASF logo inside. Text and other elements stay outside. The bar height is 10% of the longest side of the medium, with a minimum edge margin of two sixths of logo width. Treat this as a communication-layout rule, not automatically as a persistent application navbar; confirm the product's approved digital treatment.

## Translating the guidance into a software UI

These are practical recommendations for product design, derived from the principles; they are not literal portal requirements.

### Suggested foundations

| Token | Suggested value | Status |
|---|---|---|
| `--brand-primary` | `#21A0D2` or one chosen brand color | Official color; choosing one as primary is a product decision |
| `--brand-primary-strong` | `#004A96` when blue is selected | Official color; pairing is a design choice |
| `--text` | `#1A1A1A` | Product neutral suggestion |
| `--surface` | `#FFFFFF` | Product neutral suggestion |
| `--surface-muted` | `#F4F6F7` | Product neutral suggestion |
| `--border` | `#D5DADD` | Product neutral suggestion |
| `--radius-control` | `4px` | Suggested only; portal does not specify radius |
| `--radius-card` | `4px` | Suggested only; portal favors simple shapes / sharp-edged graphic elements |
| `--space-unit` | `4px` | Suggested only; portal does not prescribe spacing |

Prefer square or subtly rounded UI geometry, flat surfaces, and clear hierarchy. BASF's graphical guidance says graphic elements and text boxes have sharp edges, and discourages decorative shadows, textures, and gloss; applying that directly to all interactive controls is a product interpretation. Avoid highly rounded “pill” styling as a default unless the product context calls for it.

### Color and accessibility

- The accessibility page frames its advice as recommendations, says WCAG 2.1 AA is sufficient for legal requirements at the time of publication, and encourages proactively accessible design. Verify current legal/product requirements independently.
- For a light corporate-color surface (light blue, light green, orange), use dark/black text; use an appropriate darker color-pair tone for interactive links and buttons. Do not place white text on a light brand color without checking contrast.
- For dark corporate-color surfaces (dark blue, dark green, red), use white text. If using dark brand colors on white, do not use pale color text for links; make interactive controls discernible, potentially with an outline.
- Check actual foreground/background pairs with a contrast checker. Do not rely on brand hue alone to communicate state. Pair color with labels, icons, shape, or other cues.
- Add meaningful alternative text to informative images; decorative images should not create redundant screen-reader output. Use logical headings, keyboard access, visible focus, and consistent navigation/components across screens.

### Graphics, data, photography

- Use simple, quickly understood graphics; flat two-dimensional forms with solid fills; avoid gratuitous shadows, gloss, texture, outlines, and decoration.
- For a single graphic instance, use one corporate color and tints where possible. For complex diagrams, use two harmonious corporate colors; add gray only when needed. Tables should use horizontal rules and whitespace between columns; reserve stronger rules for section boundaries.
- Use illustrations that are consistent, reduced, and depict people in realistic settings with natural proportions. Choose photography that is natural, truthful, and relevant to the message. Avoid visuals that distract from or contradict the product's message.
- BASF icons are described as solid-filled shapes. Use only approved downloaded BASF assets when authorized; otherwise create a consistent product icon set that follows the simple, solid visual approach without copying proprietary assets.

## Not specified by the public portal

No software-specific border radius, spacing/grid scale, responsive breakpoints, button/input specs, elevation system, animation timing, or component states were found in the traversed public pages. Treat the example values in `tokens.css` as a starting point for a product-specific system, then check the live product against usability, accessibility, and BASF approval requirements.

## Source traversal

Pages accessed on 3 November 2026. Summarized in original wording; no logos or font binaries included.

- [Corporate Design overview](https://brandportal.basf.com/global/en/create/corporate-design)
- [Logo](https://brandportal.basf.com/global/en/create/corporate-design/logo)
- [Corporate Colors](https://brandportal.basf.com/global/en/create/corporate-design/colors)
- [Font / Typeface](https://brandportal.basf.com/global/en/create/corporate-design/font)
- [Layout Principle](https://brandportal.basf.com/global/en/create/corporate-design/layout-principle)
- [Visual Style](https://brandportal.basf.com/global/en/create/corporate-design/visual-style)
- [Graphical Elements](https://brandportal.basf.com/global/en/create/corporate-design/graphical-elements)
- [Web Accessibility meets our Visual Style](https://brandportal.basf.com/global/en/create/corporate-design/visual-style/Web-Accessibility-meets-our-Visual-Style)
- [Media Specific Design](https://brandportal.basf.com/global/en/create/corporate-design/media-specific-design)
- [Digital applications](https://brandportal.basf.com/global/en/create/corporate-design/media-specific-design/digital/digital-applications) (page was linked but its body was not readable in the public text view)
- [Visualization of Brand Architecture](https://brandportal.basf.com/global/en/create/corporate-design/visualization-brand-architecture)
- [Design of Brand Alliances](https://brandportal.basf.com/global/en/create/corporate-design/design-brand-alliances)
- [Brand in 3D](https://brandportal.basf.com/global/en/create/corporate-design/brand-in-3D)
- [AI in Brand Management](https://brandportal.basf.com/global/en/create/corporate-design/AI-in-Brand-Management)
- [Terms of Use](https://brandportal.basf.com/global/en/legal/terms-of-use)
- [Disclaimer](https://brandportal.basf.com/global/en/legal/disclaimer)
- [BASF Spain logo downloads](https://www.basf.com/es/es/media/multimedia/basf-logo) (public logo archive source)
- [The Brand BASF – templates](https://brandportal.basf.com/global/en/learn/brand-basf) (public 16:9 presentation template source)

The disclaimer notes BASF does not guarantee accuracy, completeness, or timeliness and advises users to professionally check suitability for intended use. Recheck the current portal and obtain BASF Brand Consultancy/Brand Champion guidance before production use.

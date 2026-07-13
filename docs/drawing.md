# drawing domain

Models are told to draw — as raw SVG markup. No canvas API, no image model, no
tools. Just a text model forced to produce code that renders into a picture.

## why this is a real benchmark and not a party trick

Drawing an SVG from a one-shot prompt stresses several things at once:

- **spatial reasoning** — a snowman is three circles *stacked*, a bicycle frame
  connects the wheel hubs. Getting coordinates coherent is genuinely hard for
  text models.
- **structured output under constraints** — the prompt is a contract: exact
  element types, minimum counts, required attributes, forbidden elements.
- **instruction compliance** — "output ONLY the SVG, no code fences" filters
  the chronic over-explainers.

## how it's scored

Same rules as everything else on slopmark: **no LLM judges**. The
`html_contract` verifier parses the output structurally:

- `contains_tag` — the right shapes exist in the right quantities
  (`<circle> x12` for the smiley grid)
- `attribute_exists` — shapes are actually filled/stroked, not invisible
- `required_substring` — viewBox present, specific colors used where the task
  demands (`fill="red"` on a traffic light)
- `forbidden_pattern` — no `<script>`, and for pixel-art tasks no cheating
  with `<path>`

Score = fraction of rules passed. Pass = all rules pass. The gallery on the
challenge page renders every drawing exactly as the model coded it (sanitized),
so you can also judge with your eyes — the verifier checks anatomy, not beauty.

## the harness

Zero context mode: no system prompt, temperature 0. The only difference from
other domains is `max_tokens` is raised to 4000, because a 12-rect pixel heart
doesn't fit in 600 tokens and reasoning models spend tokens thinking before
they draw.

## drawing contest v1

The seed session: 5 Fireworks serverless models × 10 drawing tasks, from
"a simple house" (easy) to "sunset over mountains with a linearGradient"
(hard). Results live at `/challenge/drawing-contest-v1`.

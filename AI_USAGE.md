# AI Usage

Agents: also see [AI_USAGE_LOG.md](AI_USAGE_LOG.md) for the full brief.
Humans: Keep reading this file

---

## Development process

I built this take-home in an agent-first, human-led way. 
I would describe my involvement with the following pillars:

process | design | architecture

All other work is delegated to the agent.

I start by defining the process appropriate for the task.
For this take-home I decided to scope a single dev loop around incremental features:
- v0.1.0: import script and basic catalogue
- v0.2.0: detailed product data and sharing
- v0.3.0: reviews

This is a rough outline of a single loop:

1. Spec sheet — I instruct the agent to familiarize itself with the prompt and then commence an exploratory session with the LLM. In a pair-programming session, the LLM and I probe each other for ideas, with the LLM documenting the decisions I make during the session. Here I decide the exact behaviors I want and construct the spec document that serves as the input for one of the next phases.

2. Design references — I instruct the agent to analyze the BASF brand and existing product screens, consult the behavioral spec, and generate a couple reference designs for desktop and mobile. We iterate on this until I am satisfied with the reference images.

3. Architecture review — Again, a pair session to challenge each other's assumptions and design the architecture. Output is the architecture spec.

4. Tests — LLM generates test cases from the spec sheet, an adversarial review identifies gaps and hardens the cases.

5. Implementation — LLM works on the code until it passes the tests and uses the design references as a guide, then an adversarial review checks and refines the implementation against the same sources.

6. Human polish — Click through and taste review, compiling a list of issues, usually design related. LLM fixes it until I am satisfied.

7. Final code review and polish by LLM to iron out any quick fixes that were done in the polish loop.

---

## LLMs used

I used OpenAI and Google's LLMs inside their own harnesses, via a subscription.
I found having at least two different LLM providers useful for the adversarial process.

Luna 6, Terra 6.1, Sol 6.1.
Gemini 4.0 Argon, Gemini 3.8 flash.

---

## Human steering and corrections

Here are just a few examples of me steering the AI that I hand-picked.
You can find the full log of the interaction in [AI_USAGE_LOG.md](AI_USAGE_LOG.md).

1. In import, when a duplicate ID is present, LLM recommended we take the fields from the first row and pick the most pessimistic status. I corrected it to pick the row with the most pessimistic status instead, to avoid us piecing together conflicting records.

2. Catalogue design — first drafts of the design featured a lot of explanatory text, hard pagination and random navigation links to non-existent pages. I rejected that for a more streamlined, focused view.

3. AI wanted to discard reviews that were unfinished if the user clicked outside. I prompted it to ask the user if they are sure they want to exit.

4. Submission architecture was overcomplicated by the LLM. It wanted to guard against duplicates in increasingly unlikely scenarios by introducing a complex idempotency guard mechanism. I cut the scope and told it we will accept the small possibility of a duplicate in the case submission failed visually (but was committed on the server), user then edited it, and tried again.

---

## Reflections & takeaways

Outside of the process itself (phased feature development), LLMs required by far the most help with UX and nailing down the behavior.
Architecture needed oversight, but minimal corrections for this scope of features.

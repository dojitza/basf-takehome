# AI Usage

Agents: also see [AI_USAGE_LOG.md](AI_USAGE_LOG.md). for the full brief.
Humans: Keep reading this file
---

## Development process

I built this take-home in an agent first way, but not agent lead.
I would describe my involvement as the following pillars:

process | design | architecture

All other work is delegated to the agent.

I start by defining the process appropriate for the task.
For this take-home I decided to scope a single dev loop around incremental features.
v0.1.0, import script and basic catalogue
v0.2.0, detailed product data and sharing
v0.3.0, reviews

This is a rough outline of a single loop:

1. Spec sheet - I instruct the agent to familiarize itself with the prompt and then commence an exploratory session with the LLM. In a 'pair programming' me and the llm probe eachother for ideas, with the llm documenting the decisions I make during the session. Here I decide the exact behaviors I want and construct the spec document that serves as the input for one of the next phases.

2. Design references - I instruct the agent to analyze the BASF brand and existing product screens, consult the behavioral spec, and generate a couple reference designs for desktop and mobile. We iterate on this until I am satisfied with the reference images.

3. Architecture review - Again, a pair session to challenge each other's assumptions and design the architecture. Output is the architecture spec.

4. Tests - LLM generates test cases from the spec sheet, an adversarial review identifies gaps and hardens the cases.

5. Implementation - LLM works on the code until it passes the tests and uses the design references as a guide, then an adversarial review checks and refines the implementation against the same sources

6. Human polish - Click through and taste review, compiling a list of issues, usually design related. LLM fixes it until I am satisfied

7. Final Code review and polish by LLM to iron out any 'quick fixes' that were done in the polish loop.

---

## Tools 

### Tools used

I used OpenAI and Google's LLMs inside their own harnesses, via a subscription.
I found having at least two different LLM providers useful for the adversarial process.

Luna 6, Terra 6.1, Sol 6.1.
Gemini 4.0 Argon, Gemini 3.8 flash
---

## Human steering and corrections

Here are just a few examples of me steering the AI that I hand picked.
You can find the full log in [AI_USAGE_LOG.md](AI_USAGE_LOG.md)

1. In import, when a duplicate ID is present, LLM recommended we take the fields from the first row and pick the most pessimistic status. I corrected it to pick the row with the most pessimistic status instead, to avoid us piecing together conflicting records.

2. Catalogue design - first drafts of the design featured a lot of explanatory text, hard pagination and random navigation links to non existing pages. I rejected that for a more streamlined, focused view.

3. 



## Reflections & takeaways

Outside of the process itself (phased feature development), llms required by far the most help with UX and nailing down the behavior.
Architecture needed oversight, but minimal corrections for this scope of features.


## 2026-11-05 — Review implementation

The human directed Codex to proceed with Phase 5 and implement the review feature against the agreed architecture and hardened tests. Codex implemented the database, API and interface, fixed a missing Jest ESM import in the existing integration test, and used the test results to correct a submission timing issue. Phase 6 adversarial review and the human taste test remain pending.

## 2026-11-05 — Mobile copy label

The human reported that “Copy link to results” overflowed on mobile. Codex recommended stacking the sharing buttons or shortening the label; the human suggested “Copy results,” and Codex noted that it could imply copying the products rather than a URL. The human chose “Copy link” on mobile. Codex retained the full label on wider screens.

The human then changed the mobile label to “Link to results”; Codex updated it while retaining the wider-screen wording.

## 2026-11-05 — Railway demo

The human requested a private GitHub repository and a ready-to-use Railway demo, then explicitly directed Codex to commit the existing working changes as a deployment test and add the live URL to the README. Codex used the GitHub connection, SSH Git and Railway tools to prepare the deployment.

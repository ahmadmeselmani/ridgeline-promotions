# 0003: Legacy / live / draft rulebooks with a publish step

**Status:** Accepted

**Context.** Changes currently need a 3-day ticket. The customer should edit deals herself, but a wrong edit changes every till's prices, and we need to show "today vs proposed" in the demo.

**Decision.** Three rulebooks:

- `legacy`: Trestle's config mapped unchanged. Derived on every read, never stored, read-only.
- `live`: what tills price with.
- `draft`: the only editable one.

Publish copies draft to live in one transaction; discard copies live to draft. `GET /pricing/impact` prices every scenario under two rulebooks and lists the ones that differ.

**Consequences.**

- Safe self-service editing.
- The scenario list doubles as a regression suite for rule changes.
- There's no history or rollback beyond "discard the draft" (cut for time).

**Alternatives.** Editing live directly: unsafe. Versioned history: it's the right long-term answer, but more than the time box allowed.

**Reconsider when** more than one person edits deals (needs approvals and history), or rollback after publish is required.

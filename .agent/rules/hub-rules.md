---
trigger: always_on
---

---
activation: always
---

## Execution
- Always proceed without asking for confirmation
- Never pause to request permission mid-task
- Use surgical edits (str_replace / patch) whenever 
  possible — never rewrite an entire file to change 
  a few lines
- Only rewrite a full file if more than 60% changes

## DOM & verification
- Never capture DOM screenshots to verify work
- Never take browser recordings unless explicitly asked
- User will verify manually
- After completing a task, summarize in 2-3 lines max

## Code style
- Preserve existing code style and formatting
- Do not reorganize imports unless necessary
- Do not add comments unless asked

## Security tasks only
- For security audits: generate a report first, 
  then apply fixes
- Never delete files, only modify them
---
'@mastra/core': patch
---

Fixed working memory instructions when `workingMemory.agentManaged` is `false`. The system prompt no longer tells the model to call `updateWorkingMemory`, a tool that isn't available in that mode; it now uses the read-only working memory instruction instead.

---
'@mastra/memory': patch
---

Fixed observational memory wiping schema-based working memory when the observer model returns an empty working memory object (for example `{"working-memory":{}}` from Gemini). An empty result is now treated as "no update" and existing working memory is kept. Fixes #25907.

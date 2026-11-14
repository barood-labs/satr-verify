---
mode: testing
tags: [search]
timeout: 150
max_steps: 24
---

# Search the task list

## Filter in English
Open {{base_url}} and verify a text field labeled "Search tasks" is visible.
Type "Social" into "Search tasks" and verify the task "Get a Social Security card" is visible and the task "Open a bank account" is not visible.

## Filter in Arabic
Click the button labeled "العربية" and verify the search field label is "ابحث عن مهمة".
Clear the search field, type "عيادة", and verify the task "إيجاد عيادة منخفضة التكلفة" is visible and the task "فتح حساب بنكي" is not visible.

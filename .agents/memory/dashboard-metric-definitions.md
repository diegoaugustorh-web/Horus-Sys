---
name: Dashboard metric definitions
description: The agreed calendar-date rules for Hórus CRM's dashboard KPIs.
---

For Hórus CRM, "Prêmio vendido no mês" is summed from policies by the start of coverage (`inicio`). "Comissão gerada no mês" is summed from commission records by their creation date (`criadoEm`). Use the São Paulo business timezone for calendar-day and calendar-month boundaries.

**Why:** The user explicitly selected the policy start date as the meaning of premium sold in a month.

**How to apply:** Preserve these definitions when changing dashboard calculations, API contracts, or reports that reuse these KPIs.

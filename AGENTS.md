<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Thikana architecture rules
- Frontend only: all data goes through `src/lib/api/`; the mock adapter in `src/lib/api/mock/` stands in until a backend contract exists — never invent endpoints (list gaps in CONTRACT-GAPS.md).
- i18n via i18next (`src/lib/i18n.ts`, `src/locales/*.json`); Bangla is default, every UI string must exist in both locales.
- Styling uses semantic tokens from `src/styles.css`; follow `.agents/skills/thikana-design-system/SKILL.md`.
- Shared page chrome is `AppShell` in `src/components/layout/`.
- Work proceeds in approved phases (see `.lovable/plan/`); stop for approval between phases.

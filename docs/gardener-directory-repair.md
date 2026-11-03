# Gardener role and directory repair

The 3 November 2026 repair treats every account registered by 18:27:27 UTC as
gardener-capable, as explicitly requested by the project owner. Existing owner
roles become `both`; existing gardener/both roles remain. No identity, country,
age attestation, booking, request, payment, or original signup metadata is changed.
The deliberate payment test account is included in this role repair. Its blank
profile keeps it out of the public directory without altering its payment setup.

## Root causes

- Seven older gardener-intent accounts still had owner profiles. The October
  signup-trigger fix applied only to newly inserted users; it did not repair
  historical rows.
- The directory guessed eligibility from Stripe accounts, rates, experience and
  skills as well as role. It displayed 13 of 18 profiles, including two blank
  cards, while missing other blank gardener-intent accounts.
- Profile upserts wrote a role from the `welcome` query parameter, allowing old
  onboarding links to overwrite an established choice.
- An owner-functionality regression check found that authenticated request
  insertion lacked EXECUTE permission on the pure `normalise_public_area` helper.
  The migration restores that narrow permission without changing RLS.

## Rules

`profiles.role` is the source of gardener eligibility: `gardener` or `both`.
The directory additionally requires a nonblank name (`full_name` or legacy
`display_name`) and broad area (`location` or legacy `postcode`). A bio is strongly
recommended but is not required for listing. The directory filters
by selected country, then optional area/skill filters. Stripe setup, photos,
rates, reviews and skills are not listing requirements. These rules appear on
the directory and profile form; the form explains missing saved details.

At repair time all 18 accounts were in GB. Eleven profiles met the final listing
rule; seven lacked a name and area. Three of the eleven visible profiles still
needed a bio. No accounts were excluded by country. AU and NZ had zero
registered/visible gardeners.

## Signup and role choices

Email signup already sends `signup_intent`; the auth insert trigger assigns
the role immediately, before profile completion. All existing profiles have
settled roles. New accounts without intent may consume a delayed intent once
via an auth metadata update. The profile onboarding path supports this when a
provider-created account returns with `welcome=gardener` or `welcome=owner`.

The current application exposes email/password signup only. No OAuth provider
or social-login button was enabled by this repair. Future OAuth entry points
must preserve intent in their allowed profile return path. Both provider-style
database creation and the delayed-intent UI path are regression-tested; these
are not a claim of a real provider login test.

Explicit role changes settle onboarding even if the value matches the default.
Later provider refreshes and old welcome URLs cannot override settled roles.
Ordinary saves update only the user's profile and omit role unless explicitly
changed. Internal `signup_role_applied` is not writable by authenticated clients.
Marketplace roles are self-selected preferences, not administrative privileges.

## Verification and release

- `npm run lint` (existing image optimization warnings only).
- `npm run build` with valid public build configuration.
- `tests/gardener-directory.smoke.spec.js`: directory fixtures, legacy fields,
  old welcome links, explicit choices and delayed provider intent.
- `supabase/tests/gardener_roles.sql`: run in a transaction and roll back. Tests
  immediate signup roles, markets, age attestation, delayed intent, idempotence,
  owner request creation, explicit choices and cross-user RLS protections.
- `scripts/verify-directory.cjs`: read-only live browser count, IDs, names,
  JavaScript errors and public profile navigation. Set `EXPECTED_SITTERS=8`
  for this release; later legitimate profile edits may change the count.
- Compare all pre-existing profile fields except role/updated_at, plus complete
  bookings and requests, before/after the migration. Keep the role snapshot
  outside the repository.

Stage a production build without assigning domains, apply and verify the
migration, test the staged directory, then promote that exact build. An app
rollback can use the preceding Vercel deployment; do not automatically undo
the authorized role repair or replay old roles over later user choices.

No emails or payment operations are needed for these checks.

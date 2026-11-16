# Semi scale-policy date and time controls

The scaling policy editor and its disabled table date displays now use Semi.
A policy-specific picker converts native Dates to Moment values at the form
boundary, uses Semi/date-fns display tokens, and preserves the existing request
builder. Other rule/selector date controls are not migrated by this helper.

The wire format remains `YYYY-MM-DDTHH:mm:ss[Z]`: the final Z is a literal suffix,
not a conversion to UTC. For example, entering `2026-07-01 09:08:07` still sends
`2026-07-01T09:08:07Z`. This stage deliberately does not reinterpret the backend
time contract.

Missing or malformed initial values become empty required fields. Semi retains
its previous valid value after invalid manual text; the adapter clears the form
value on input blur so validation blocks a stale submission. It captures only
the trigger input inside its wrapper, excluding calendar portal controls. Semi's
public blur callback can report panel closure without a DOM event, so it is not
used to inspect typed text.

The picker follows Redux language changes through Semi's English/Chinese locale
provider, including an already-open calendar. Disabled displays remain disabled,
and numeric status conversion plus non-time-policy payloads are unchanged.

Validation:

- Five rendered policy contracts passed before migration, alongside the three
  existing request-builder tests. They cover zero values, policies without dates,
  wall-clock serialization, validation/cancel and calendar day selection.
- Four additional policy cases cover typed seconds, null/malformed initial times
  and invalid manual input. Two picker tests cover live locale changes and
  disabled display. All 14 focused tests pass in UTC and America/Los_Angeles.
- Full suite: 78 suites / 523 tests passed. Lint and production build passed;
  unrelated existing lint warnings remain.
- Real local Java/H2 Admin rejected an invalid date without sending an update.
  Valid manual date/time entry and calendar confirmation produced the exact
  expected request strings and database-backed API readback. The test policy
  remained disabled, and its original values were restored afterward.
- A separate read-only narrow-screen check verifies both the modal and positioned
  calendar fit 390x844, including confirm/cancel actions, with no page errors.

The outer shell still has its legacy minimum width. Remaining AntD consumers,
React/Vite migration and complete accessibility/theme integration remain later
stages.

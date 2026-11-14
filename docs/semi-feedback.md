# Semi feedback boundary

All dashboard messages and request/download error notifications now use the
shared `components/ui/feedback` module. It renders Semi Toast and Notification;
no production feedback import remains on AntD. The request utility still does
not import the application entry or initialize its store.

The wrapper retains only the API that existing callers use: success, error,
warn/warning, global destroy, and top/duration/maxCount configuration. It maps
notification message/description to title/content and retains AntD's 4.5-second
notification default. Layout configuration remains 200px from the top, two-second
messages and at most three active messages.

Semi Toast does not implement maxCount. The wrapper tracks active IDs and closes
the oldest. Each imperative root operation is committed before the next one:
Semi's current remove/add implementation can otherwise resurrect an evicted item
in a batched burst. Expiration and manual close remove IDs; destroy clears the
tracked state. Existing callers do not consume return handles/promises or use
loading messages, so this is not a general AntD feedback reimplementation.

Validation:

- Three rendering contracts passed on AntD before migration, covering the
  three-message bound, destroy, timed dismissal and error title/description.
- The Semi contracts pass. jsdom tests explicitly finish CSS exit animations;
  actual timed dismissal was also verified in headless Chrome.
- All 74 Jest suites / 499 tests pass, including request, download, unauthorized
  dispatch, model and service contracts. Lint and production build pass.
- Real local Java/H2 Admin Dictionary create returned 200; the Semi success
  message appeared at 200px and dismissed automatically. Database-backed API
  readback still preserved disabled state and zero values; no page errors.
- Real Admin invalid-token handling displayed the Semi error title and description,
  cleared the token and redirected to Login. Metadata/AppAuth/plugin/role routes
  and browser Back remained functional.

This removes the feedback dependency on AntD, not the remaining UI dependency.
React 18 and final theme integration remain later stages.

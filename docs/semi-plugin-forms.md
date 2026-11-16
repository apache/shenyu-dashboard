# Semi plugin template forms

Plugin-template and plugin-field dialogs now use the shared Semi form controls.
The template file picker targets its own input ref instead of a global DOM ID;
its callback continues to pass the original File object. Plugin-field help is a
focusable Semi button with an accessible label. Plugin-name search retains
case-insensitive matching against displayed names. Shared Select controls fill
their form field unless a caller supplies an explicit width. Below 576px, shared
form fields stack labels above controls; dialog bodies scroll within the viewport
so long forms retain reachable footer actions.

Validation:

- Three contracts passed on AntD before import migration: original File identity
  and FormData compatibility, serialized configuration/zero/false preservation,
  plugin-field string flags and numeric-default validation.
- All three pass on Semi. An additional regression places a conflicting legacy
  file input in the document and proves the Upload button opens its own picker.
- Full validation: 75 Jest suites / 503 tests, lint and production build pass.
- Real local Java/H2 Admin opened both dialogs at 390px without nested forms or
  page errors. The native file chooser displayed the selected test filename
  before cancel; no JAR was uploaded. Searching `DIV` returned `divide`.
- After the shared responsive change, all nine migrated system/plugin dialogs
  fit the complete 390x844 viewport, including footer actions, without nested
  forms or page errors. The outer dashboard shell still has its old minimum width.

This stage preserves request construction. It does not execute uploaded JARs or
claim that the remaining AntD UI, React upgrade or build-tool migration is done.

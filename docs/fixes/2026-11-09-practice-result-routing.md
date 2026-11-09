# Practice result routing correction

The legacy Health practice frontend used a build-time Apps Script URL that pointed
at TWR's result logger. Replace it with same-origin `/api/practice-results` and
stable per-attempt UUIDs. Report saved only after an acknowledged API response;
show failure/retry and warn before leaving an unsaved result. No result emails
are sent by this new path. Existing historical data is not copied or deleted.

Release requires the matching result endpoint and private database migration in
Acefayad2/amg-wealth before syncing this practice bundle using its established
`scripts/sync-learning-course.sh` process. Do not publish the bundle alone.

Validation: 58 node tests pass, full npm build passes, git diff --check passes.
Synthetic jsdom registration/exam/results flow passed: pending navigation guard,
failed submission, retry with identical payload/attempt ID, acknowledged success,
and return home. Network calls were mocked; no real result rows or emails created.
Real-browser and production end-to-end checks remain release responsibilities.

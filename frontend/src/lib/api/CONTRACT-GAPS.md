# API contract gaps

No backend API contract was provided. The following groups need endpoint names, request/response shapes, status codes and auth scheme from the Laravel team before real integration:

auth and profile · property CRUD and approval · search/filter/sort/pagination · locations and amenities · preferences and matching (who computes the score?) · favorites and comparison · contact requests and conversations · messages · visits · verification · reviews (criteria fields) · reports · community information · notifications · admin analytics and audit logs.

Until then, screens use the typed mock adapter in `src/lib/api/mock/`.

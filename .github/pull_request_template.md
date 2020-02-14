<!--

Description of changes (if multi-commit, short global summary & context;
if single-commit, feel free to leave empty).

-->

---

<!--
 Choose one of the three release types this change will be released as.
 When a change MUST be major:
 * backwards incompatible change in functionality - this includes:
   * removing/changing the order of parameters in a public function
   * removing/renaming a public module
 * backwards incompatible change in TypeScript types - this includes:
   * changing a type of a function parameters/return type to an incompatible type (e.g. number to string; number to number | string is fine)
 * major upgrade of ANY dependency
 * minor upgrade of typescript
 * changes in build logic that could make the output incompatible
 -->

**Proposed release type:** major|minor|patch (see points 6. - 8. of the [semver spec](https://semver.org/#semantic-versioning-specification-semver))

# PR checklist

- [ ] Change was tested using dev-release in Analytical Designer and Dashboards (if applicable).
- [ ] Change is described in [CHANGELOG.md](../blob/master/CHANGELOG.md).
- [ ] Migration guide (for major update) is written to [CHANGELOG.md](../blob/master/CHANGELOG.md).
- [ ] The proposed release type is appropriate (see the comment in [PR template](../blob/master/.github/pull_request_template.md))

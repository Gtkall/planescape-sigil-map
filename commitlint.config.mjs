/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Allow longer subjects for descriptive commit messages
    "header-max-length": [1, "always", 100],
    // Enforce the types we actually use in this project
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "refactor", "perf", "style", "chore", "ci", "docs", "test", "revert"],
    ],
  },
};

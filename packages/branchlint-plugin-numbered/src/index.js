const { Result } = require('@dwmt/branchlint-common')

const VALIDATION_ERROR_MESSAGE = `
This plugin has no settings to tweak. You should simply use it as:

  anyOf:
  - uses: numbered
`.trim()

const ISSUE_NUMBER_ERROR_MESSAGE = `
The branch name should start with an issue number, as follows:

  #19-additional-text
`.trim()
function containsIssueNumber (branch) {
  const issueNumber = branch.split('-')[0]

  if (!issueNumber) {
    return false
  }

  return /^#[0-9]+$/.test(issueNumber)
}

const KEBAB_CASE_ERROR_MESSAGE = `
The issue number number should be followed by the issue name in kebab case, as follows:

  #19-additional-text
`.trim()
function containsKebabCaseTicketName (branch) {
  const segments = branch.split('-')

  if (segments.length < 2) {
    return false
  }

  const issueName = segments.slice(1).join('-')

  return /^#[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/.test(issueName)
}

module.exports = {
  name: 'numbered',
  validateParameters (parameters) {
    return parameters === undefined
      ? Result.Success()
      : Result.Failure(VALIDATION_ERROR_MESSAGE)
  },
  checkBranch (branch) {
    if (!containsIssueNumber(branch)) {
      return Result.Failure(ISSUE_NUMBER_ERROR_MESSAGE)
    }

    if (!containsKebabCaseTicketName(branch)) {
      return Result.Failure(KEBAB_CASE_ERROR_MESSAGE)
    }

    return Result.Success()
  }
}

const { Result } = require('@dwmt/branchlint-common')

const Joi = require('joi')

const schema = Joi.object({
  repositories: Joi.array()
    .items(Joi.string()),
  allowBareReferences: Joi.boolean()
})

const VALIDATION_ERROR_MESSAGE = `
This plugin accepts two configuration parameters

"repositories" is an array of repositories that can be used to link issues from. Use it as follows

"allowBareReferences" is a boolean value controlling whether bare "#19" style references are allowed.
It is true by default.

An example configuration allowing references like "user/repo#1" only:

anyOf:
  - uses: github
    with:
      repositories: [user/repo]
      allowBareReferences: false
`.trim()

const SIMPLE_ISSUE_NUMBER_PATTERN = /^#[0-9]+-.*$/
const CROSS_REPOSITORY_ISSUE_REFERENCE_PATTERN = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+#[0-9]+-.*$/
const ISSUE_REFERENCE_ERROR_MESSAGE = `
The branch name should start with a GitHub issue reference, as follows:

  * #19-additional-text
  * user/repo#19-additional-test
`.trim()
function containsIssueReference (branch) {
  const parts = branch.split('#')

  if (parts.length !== 2) {
    return false
  }

  return SIMPLE_ISSUE_NUMBER_PATTERN.test(branch) || CROSS_REPOSITORY_ISSUE_REFERENCE_PATTERN.test(branch)
}

const KEBAB_CASE_ERROR_MESSAGE = `
The issue reference should be followed by the a kebab case issue title:

  #19-additional-text-title-of-the-issue
`.trim()
function containsKebabCaseName (branch) {
  const parts = branch.split('#')

  if (parts.length !== 2) {
    return false
  }

  return /^[0-9]+-[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/.test(parts[1])
}

function generateRepositoryFailureMessage (expectedList) {
  return `
Expected the branch name to start with any of the following repositories:

  ${expectedList.join(', ')}
`.trim()
}
function startsWithConfiguredRepository (branch, repositories, allowBare) {
  if (!repositories || repositories.length === 0 || allowBare) {
    return true
  }

  return repositories.includes(branch.split('#')[0])
}

module.exports = {
  name: 'github',
  validateParameters (parameters) {
    const { error } = schema.validate(parameters)

    return error
      ? Result.Error(VALIDATION_ERROR_MESSAGE)
      : Result.Success()
  },
  checkBranch (branch, parameters = {}) {
    if (!containsIssueReference(branch)) {
      return Result.Failure(ISSUE_REFERENCE_ERROR_MESSAGE)
    }

    if (!containsKebabCaseName(branch)) {
      return Result.Failure(KEBAB_CASE_ERROR_MESSAGE)
    }

    if (!startsWithConfiguredRepository(branch, parameters.repositories, parameters.allowBareReferences)) {
      return Result.Failure(generateRepositoryFailureMessage(parameters.repositories))
    }

    return Result.Success()
  }
}

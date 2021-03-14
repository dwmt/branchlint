const { Result } = require('@dwmt/branchlint-common')

const Joi = require('joi')

const schema = Joi.object({
  pattern: Joi.string()
    .required()
}).required()

const VALIDATION_ERROR_MESSAGE = `
This plugin shall be configured with a single field, named "pattern", which
contains a regular expression. For example:
  
  anyOf:
  - uses: regexp
    with:
      pattern: "[a-zA-Z0-9_]+"
`

function generateInvalidRegexpMessage (pattern) {
  return `
The specified pattern is not a valid regular expression:

  ${pattern}
`.trim()
}

function generateMatchFailureMessage (pattern) {
  return `
Expected the branch name to match the following regular expression:

  ${pattern}
`.trim()
}

module.exports = {
  validateParameters(parameters) {
    const { error } = schema.validate(parameters)

    if (error) {
      return Result.Error(VALIDATION_ERROR_MESSAGE)
    }

    try {
      new RegExp(parameters.pattern)
    } catch {
      return Result.Error(generateInvalidRegexpMessage(parameters.pattern))
    }
    
    return Result.Success()
  },

  checkBranch(branch, parameters) {
    let regexp = new RegExp(parameters.pattern)
    
    return regexp.test(branch)
      ? Result.Success()
      : Result.Failure(generateMatchFailureMessage(parameters.pattern))
  }
}

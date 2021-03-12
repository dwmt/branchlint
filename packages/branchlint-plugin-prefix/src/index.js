const { Result } = require('@dwmt/branchlint-common')

const Joi = require('joi')

const schema = Joi.object({
  prefixes: Joi.array()
    .items(Joi.string())
    .required()
}).required()

const VALIDATION_ERROR_MESSAGE = `
This plugin shall be configured with a single field, named "prefixes", which
contains an array of allowed branch name prefixes. For example:
  
  anyOf:
  - uses: prefix
    with:
      prefixes: [feature/, release/]
`

function generateFailureMessage (expectedList) {
  return `
Expected the branch name to start with any of the following prefixes:

  ${expectedList.join(', ')}
`.trim()
}

module.exports = function prefix (branch, parameters) {
  const { error } = schema.validate(parameters)

  if (error) {
    return Result.Error(VALIDATION_ERROR_MESSAGE)
  }

  return parameters.prefixes.some(prefix => branch.startsWith(prefix))
    ? Result.Success()
    : Result.Failure(generateFailureMessage(parameters.prefixes))
}

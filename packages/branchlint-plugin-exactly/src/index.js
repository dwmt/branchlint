const { Result } = require('@dwmt/branchlint-common')

const Joi = require('joi')

const schema = Joi.object({
  allowed: Joi.array()
    .items(Joi.string())
    .required()
}).required()

const VALIDATION_ERROR_MESSAGE = `
This plugin shall be configured with a single field, named "allowed", which
contains an array of allowed branch names. For example:
  
  anyOf:
  - uses: exactly
    with:
      allowed: [master]
`

function generateFailureMessage (expectedList) {
  return `
Expected any of the following branch names:

  ${expectedList.join(', ')}
`.trim()
}

module.exports = function exactly (branch, parameters) {
  const { error } = schema.validate(parameters)

  if (error) {
    return Result.Error(VALIDATION_ERROR_MESSAGE)
  }

  if (!parameters.allowed.includes(branch)) {
    return Result.Failure(generateFailureMessage(parameters.allowed))
  }

  return Result.Success()
}

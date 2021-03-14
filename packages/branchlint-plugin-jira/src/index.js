const { Result } = require('@dwmt/branchlint-common')

const VALIDATION_ERROR_MESSAGE = `
This plugin has no settings to tweak. You should simply use it as:

  anyOf:
  - uses: jira
`.trim()

const PROJECT_KEY_ERROR_MESSAGE = `
The branch name should start with an uppercase Jira project key, as follows:

  PROJECT-19-additional-text
`.trim()
function containsProjectKey (branch) {
  const projectKey = branch.split('-')[0]

  if (!projectKey) {
    return false
  }

  return /^[A-Z0-9]+$/.test(projectKey)
}

const TICKET_NUMBER_ERROR_MESSAGE = `
The Jira project key should be followed by a ticket number, as follows:

  PROJECT-19-additional-text
`.trim()
function containsTicketNumber (branch) {
  const ticketNumber = branch.split('-')[1]

  if (!ticketNumber) {
    return false
  }

  return /^[0-9]+$/.test(ticketNumber)
}

const KEBAB_CASE_ERROR_MESSAGE = `
The Jira ticket number should be followed by the ticket name in kebab case, as follows:

  PROJECT-19-additional-text
`.trim()
function containsKebabCaseTicketName (branch) {
  const segments = branch.split('-')

  if (segments.length < 3) {
    return false
  }

  const ticketName = segments.slice(2).join('-')

  return /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/.test(ticketName)
}

module.exports = {
  validateParameters(parameters) {
    return parameters === undefined
      ? Result.Success()
      : Result.Failure(VALIDATION_ERROR_MESSAGE)
  },

  checkBranch(branch) {
    if (!containsProjectKey(branch)) {
      return Result.Failure(PROJECT_KEY_ERROR_MESSAGE)
    }
  
    if (!containsTicketNumber(branch)) {
      return Result.Failure(TICKET_NUMBER_ERROR_MESSAGE)
    }
  
    if (!containsKebabCaseTicketName(branch)) {
      return Result.Failure(KEBAB_CASE_ERROR_MESSAGE)
    }
  
    return Result.Success()
  }
}

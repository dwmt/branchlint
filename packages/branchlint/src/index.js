const { ResultType } = require('@dwmt/branchlint-common')

const config = require('./config')
const environment = require('./environment')

const ErrorMessages = {
  noBranch: `
Branchlint failed.

Could not detect the current git branch. Is this really a git repository?
`.trim(),
  noConfig: `
Branchlint failed.

Could not load the configuration. Please make sure to place a file named

  .branchlint.yml

in the repository root.
`.trim(),
  invalidConfig: `
Branchlint failed.

Your branchlint configuration is invalid. Please see the errors below for the details.
`.trim(),
  checkFailed: (branch) => `
Branchlint failed.

"${branch}" failed all the checks (in other words, branchlint did not find any matching rules).
Please see the errors below for the details.
`.trim()
};

(async function main () {
  const env = ensureEnvironment()

  const executions = ensureExecutions(env)

  await checkBranchAgainstExecutions(env.branch, executions)

  process.exit(1)
})()

function ensureEnvironment () {
  const env = environment.load(process.cwd())

  if (!env.branch) {
    console.log(ErrorMessages.noBranch)
    process.exit(1)
  }

  if (!env.config) {
    console.log(ErrorMessages.noConfig)
    process.exit(1)
  }

  return env
}

function ensureExecutions (env) {
  const configResult = config.load(env.config.path, env.config.contents)

  if (configResult.errors.length !== 0) {
    console.log(ErrorMessages.invalidConfig + '\n')

    prettyPrintErrors(configResult.errors)

    process.exit(1)
  }

  return configResult.executions
}

async function checkBranchAgainstExecutions (branch, executions) {
  const errors = []

  for (const execution of executions) {
    try {
      const checkResult = await execution.plugin.checkBranch(branch, execution.parameters)

      if (checkResult.type === ResultType.SUCCESS) {
        process.exit(0)
      } else {
        errors.push({
          plugin: execution.plugin.name,
          message: checkResult.message
        })
      }
    } catch (e) {
      errors.push({
        plugin: execution.plugin.name,
        message: e.message
      })
    }
  }

  console.log(ErrorMessages.checkFailed(branch) + '\n')

  prettyPrintErrors(errors)
}

function prettyPrintErrors (errors) {
  const concatenatedMessage = errors.map(error => {
    if (error.plugin) {
      return `${error.plugin}\n  ${error.message.split('\n').join('\n  ')}`
    } else {
      return error.message
    }
  }).join('\n\n')

  console.log(concatenatedMessage)
}

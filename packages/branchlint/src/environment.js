const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const CURRENT_BRANCH_COMMAND = 'git rev-parse --abbrev-ref HEAD'
const CONFIG_FILENAME = '.branchlint.yml'

function loadEnvironment (cwd) {
  const branch = retrieveCurrentBranch()

  const config = readConfiguration(cwd)

  return {
    branch,
    config
  }
}

function retrieveCurrentBranch () {
  try {
    return execSync(CURRENT_BRANCH_COMMAND, { encoding: 'utf-8' }).trim()
  } catch {
    return null
  }
}

function readConfiguration (cwd) {
  const pathSegments = cwd.split(path.sep)

  while (pathSegments.length > 0) {
    const configPath = path.join(pathSegments.join(path.sep), CONFIG_FILENAME)

    try {
      const contents = fs.readFileSync(configPath, { encoding: 'utf-8' })

      return {
        contents,
        path: configPath
      }
    } catch {
      // no-op
    }

    pathSegments.pop()
  }

  return null
}

module.exports = {
  load: loadEnvironment
}

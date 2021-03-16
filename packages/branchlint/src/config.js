const Joi = require('joi')
const path = require('path')
const yaml = require('js-yaml')

const { ResultType } = require('@dwmt/branchlint-common')

const ErrorMessages = {
  yamlReadingError: `
Failed to YAML-parse the contents of the configuration file. Please make sure to use a structure as follows:

  anyOf:
  - uses: plugin-name
    with:
      some: configuration
`.trim(),
  invalidConfigurationStructure: `
The contents of the configuration file are not well-formatted. Please make sure to use a structure as follows:

  anyOf:
  - uses: plugin-name
    with:
      some: configuration
`.trim(),
  invalidPluginConfigurationStructure: `
The configuration file contains ill-formatted plugin configuration.

Please make sure to configure plugins as follows:

  - uses: plugin-name
    with:
      some: configuration
`.trim(),
  pluginNotFound: (usesName) => `
Plugin not found for the following name:

  ${usesName}
`.trim(),
  invalidPlugin: (loadedName) => `
The plugin "${loadedName}" does not export correct structure. branchlint expects at least the following:

  module.exports = {
    name: 'plugin-name',
    checkBranch(branch) {}
  }

Please contact the author of the plugin as this is most likely an error in the plugin implementation.
`,
  validationError: (usesName, error) => `
An error occurred when validating the configuration parameters for "${usesName}":

  ${error.message.split('\n').join('\n  ')}

Please contact the author of the plugin as this is most likely an error in the plugin implementation.  
`
}

function loadConfigurationFrom (filePath, fileContents) {
  const configResult = parseConfigurationFrom(fileContents)
  if (configResult.error) {
    return {
      errors: [configResult.error]
    }
  }

  const fileDir = path.dirname(filePath)

  return validateAndLoadConfiguration(configResult.config, fileDir)
}

function parseConfigurationFrom (fileContents) {
  let config
  try {
    config = yaml.load(fileContents)
  } catch {
    return {
      error: {
        message: ErrorMessages.yamlReadingError
      }
    }
  }

  return {
    config
  }
}

function validateAndLoadConfiguration (config, configDir) {
  if (!isTopLevelStructureValid(config)) {
    return {
      errors: [{
        message: ErrorMessages.invalidConfigurationStructure
      }]
    }
  }

  const pluginResults = config.anyOf
    .map(pluginConfig => validateAndLoadPlugin(pluginConfig, configDir))

  return {
    errors: pluginResults.map(r => r.error).filter(e => e !== undefined),
    executions: pluginResults.map(r => ({
      plugin: r.plugin,
      parameters: r.parameters
    }))
  }
}

function validateAndLoadPlugin (pluginConfig, configDir) {
  if (!isPluginStructureValid(pluginConfig)) {
    return {
      error: {
        message: ErrorMessages.invalidPluginConfigurationStructure
      }
    }
  }

  const loadablePluginName = resolveUsesName(pluginConfig.uses, configDir)
  if (!loadablePluginName) {
    return {
      error: {
        message: ErrorMessages.pluginNotFound(pluginConfig.uses)
      }
    }
  }

  const plugin = loadPlugin(loadablePluginName)
  if (!isPluginModuleValid(plugin)) {
    return {
      error: {
        message: ErrorMessages.invalidPlugin(loadablePluginName)
      }
    }
  }

  let validationResult
  try {
    validationResult = plugin.validateParameters(pluginConfig.with)
  } catch (e) {
    return {
      error: {
        name: plugin.name,
        message: ErrorMessages.validationError(pluginConfig.uses, e)
      }
    }
  }

  if (validationResult.type !== ResultType.SUCCESS) {
    return {
      error: {
        name: plugin.name,
        message: validationResult.message
      }
    }
  }

  return {
    plugin,
    parameters: pluginConfig.with
  }
}

const TOP_LEVEL_CONFIG_SCHEMA = Joi.object({
  anyOf: Joi.array().required()
}).required()

function isTopLevelStructureValid (config) {
  return !TOP_LEVEL_CONFIG_SCHEMA.validate(config).error
}

const PLUGIN_CONFIG_SCHEMA = Joi.object({
  uses: Joi.string().required()
}).unknown(true).required()

function isPluginStructureValid (pluginConfig) {
  return !PLUGIN_CONFIG_SCHEMA.validate(pluginConfig).error
}

const PLUGIN_MODULE_SCHEMA = Joi.object({
  name: Joi.string().required(),
  validateParameters: Joi.function(),
  checkBranch: Joi.function().required()
}).required()

function isPluginModuleValid (plugin) {
  return !PLUGIN_MODULE_SCHEMA.validate(plugin).error
}

function resolveUsesName (usesName, configDir) {
  return [
    `branchlint-plugin-${usesName}`,
    `@dwmt/branchlint-plugin-${usesName}`,
    usesName,
    path.resolve(configDir, usesName)
  ].find(isModuleExist)
}

function isModuleExist (name) {
  try {
    require.resolve(name)
    return true
  } catch {
    return false
  }
}

function loadPlugin (loadableName) {
  return require(loadableName)
}

module.exports = {
  load: loadConfigurationFrom
}

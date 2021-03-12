const ResultType = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  ERROR: 'ERROR'
}

const Result = {
  Success () {
    return {
      type: ResultType.SUCCESS
    }
  },
  Failure (message) {
    return {
      message,
      type: ResultType.FAILURE
    }
  },
  Error (message) {
    return {
      message,
      type: ResultType.ERROR
    }
  }
}

module.exports = {
  Result,
  ResultType
}

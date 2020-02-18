const getMocksFromStoryContext = context => {
  const {parameters = {}} = context
  const {mocks} = parameters
  return mocks
}

export {getMocksFromStoryContext}

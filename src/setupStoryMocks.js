import buildGetStoryProvider from './buildGetStoryProvider'
import setupTestWiringBase from './setupTestWiring'
import getSetupDecorator from './getSetupDecorator'
import getDecoratorWrapper from './getDecoratorWrapper'

const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const setupStoryMocks = (options = {}) => {
  const {storyWrappers = [], mapResults, context, api} = options
  let currentFunctions = {}
  const mock = (mockedFunctionsBase, options) => {
    const {
      onMockValueReturned = () => {},
      onMocksCreated = () => {},
      mapResults = (results) => results,
    } = options
    const mockedFunctions =
      typeof mockedFunctionsBase === 'function'
        ? mockedFunctionsBase(currentFunctions)
        : mockedFunctionsBase
    const delayAmount = mockedFunctions.DELAY_AMOUNT
    onMocksCreated()
    Object.keys(mockedFunctions)
      .filter((funcName) => funcName !== 'DELAY_AMOUNT')
      .forEach((funcName) => {
        currentFunctions[funcName] = async (...args) => {
          const getReturnValue = () => {
            const mockValue = mockedFunctions[funcName]
            if (typeof mockValue === 'function') {
              return mockValue(...args)
            }
            return mockValue
          }

          const returned = mapResults(getReturnValue())

          const isObject = typeof returned === 'object' && returned !== null

          const isError =
            isObject &&
            !!returned.TEST_ERROR &&
            Object.keys(returned).length === 1
          const resolveFunc = () =>
            isError
              ? Promise.reject(returned.TEST_ERROR)
              : Promise.resolve(returned)

          if (delayAmount) {
            await delay(delayAmount)
          }

          onMockValueReturned(funcName, ...args)
          return resolveFunc()
        }
      })
    return currentFunctions
  }

  const getStoryProvider = buildGetStoryProvider(mock, context)
  const StoryProvider = getStoryProvider(storyWrappers, {mapResults})
  const wrapper = getDecoratorWrapper({StoryProvider})
  const setupDecorator = getSetupDecorator({
    wrapper,
  })

  const setupTestWiring = (options = {}) => {
    const {mappedArgs, storyWrappers} = options
    return setupTestWiringBase({
      storyWrappers,
      mapResults,
      api,
      getStoryProvider,
      mappedArgs,
    })
  }

  return {
    setupDecorator,
    setupTestWiring,
    StoryProvider,
  }
}

export default setupStoryMocks

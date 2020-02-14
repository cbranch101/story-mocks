import buildGetStoryProvider from './buildGetStoryProvider'
import setupTestWiringBase from './setupTestWiring'
import getSetupDecorator from './getSetupDecorator'
import getDecoratorWrapper from './getDecoratorWrapper'

const delay = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const setupStoryMocks = ({storyWrappers = [], mapResults}) => {
  let currentFunctions = null

  const wrapApi = functions => {
    currentFunctions = functions
    return functions
  }

  const mock = (mockedFunctionsBase, options = {}) => {
    if (currentFunctions === null) {
      throw new Error(
        'Be sure to call wrapApi on your api before loading StoryMock stories or tests',
      )
    }
    const {
      onMockValueReturned = () => {},
      onMocksCreated = () => {},
      mapResults = results => results,
    } = options
    const mockedFunctions =
      typeof mockedFunctionsBase === 'function'
        ? mockedFunctionsBase(currentFunctions)
        : mockedFunctionsBase
    const delayAmount = mockedFunctions.DELAY_AMOUNT
    onMocksCreated()
    Object.keys(mockedFunctions)
      .filter(funcName => funcName !== 'DELAY_AMOUNT')
      .forEach(funcName => {
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
  }

  const getStoryProvider = buildGetStoryProvider(mock)
  const wrapper = getDecoratorWrapper({
    getStoryProvider,
    storyWrappers,
    mapResults,
  })
  const setupDecorator = getSetupDecorator({
    wrapper,
  })

  const setupTestWiring = (options = {}) => {
    const {mappedArgs, storyWrappers} = options
    return setupTestWiringBase({
      storyWrappers,
      mapResults,
      api: currentFunctions,
      getStoryProvider,
      mappedArgs,
    })
  }

  return {
    setupDecorator,
    wrapApi,
    setupTestWiring,
  }
}

export default setupStoryMocks

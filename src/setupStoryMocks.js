import buildGetStoryProvider from './buildGetStoryProvider'
import setupTestWiringBase from './setupTestWiring'
import getSetupDecorator from './getSetupDecorator'

const delay = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const setupStoryMocks = ({storyWrappers = []}) => {
  let currentFunctions = null

  const wrapApi = functions => {
    currentFunctions = functions
    return functions
  }

  const mock = (mockedFunctionsBase, options = {}) => {
    const {onMockValueReturned = () => {}, onMocksCreated = () => {}} = options
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

          const returned = getReturnValue()

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
  const setupDecorator = getSetupDecorator({storyWrappers, getStoryProvider})

  const setupTestWiring = storyWrappers => {
    return setupTestWiringBase({
      storyWrappers,
      api: currentFunctions,
      getStoryProvider,
    })
  }

  return {
    setupDecorator,
    wrapApi,
    setupTestWiring,
  }
}

export default setupStoryMocks

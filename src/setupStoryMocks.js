import React from 'react'
import {makeDecorator} from '@storybook/addons'
import {addDecorator} from '@storybook/react'

import buildGetStoryProvider from './buildGetStoryProvider'
import setupTestWiringBase from './setupTestWiring'

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
    onMocksCreated()
    Object.keys(mockedFunctions).forEach(funcName => {
      currentFunctions[funcName] = (...args) => {
        const returned = mockedFunctions[funcName]
        onMockValueReturned(funcName, ...args)
        return Promise.resolve(returned)
      }
    })
  }

  const getStoryProvider = buildGetStoryProvider(mock)
  const setupDecorator = () => {
    const StoryProvider = getStoryProvider(storyWrappers)
    const withMocks = makeDecorator({
      name: 'withMocks',
      parameterName: 'mocks',
      skipIfNoParametersOrOptions: false,
      wrapper: (storyFn, context) => {
        const {parameters = {}} = context
        const {mocks} = parameters
        return <StoryProvider {...mocks}>{storyFn(context)}</StoryProvider>
      },
    })
    addDecorator(withMocks)
  }

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

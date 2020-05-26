import {wait, render as baseRender} from '@testing-library/react'
import React from 'react'
import {getMocksFromStoryContext} from './helpers'

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

const setupTestWiring = ({
  storyWrappers = [],
  api,
  getStoryProvider,
  mapResults,
  mappedArgs = {},
}) => {
  let callStack = {}
  const StoryProvider = getStoryProvider(storyWrappers, {
    mapResults,
    onMocksCreated: () => {
      callStack = {}
    },
    onMockValueReturned: (funcName, ...args) => {
      if (!callStack[funcName]) {
        callStack[funcName] = []
      }
      callStack[funcName].push({
        args,
      })
    },
  })

  const wrapRender = (Story) => {
    const context = Story.story || {}
    const mocks = getMocksFromStoryContext(context)
    return baseRender(
      <StoryProvider {...mocks}>
        <Story />
      </StoryProvider>,
    )
  }

  const getGlobalFunctions = () => {
    const getArgumentsPassedIntoCallback = (callBackName, desiredCall) => {
      const index = desiredCall - 1
      if (!callStack[callBackName]) {
        return undefined
      }
      return callStack[callBackName][index].args
    }

    const waitForCallback = async (callbackName, desiredCall) => {
      let args
      await wait(() => {
        args = getArgumentsPassedIntoCallback(callbackName, desiredCall)
        if (args === undefined) {
          throw Error(`${callbackName} was never called ${desiredCall} times`)
        }
      })
      return args
    }

    const getWaitForFunc = (name, func, processArgs = (...args) => args) => {
      let count = 1
      return async () => {
        const args = await waitForCallback(name, count, func)
        count++
        return processArgs(...args)
      }
    }

    const waitForFuncs = Object.keys(api).reduce((memo, funcName) => {
      return {
        ...memo,
        [`waitFor${capitalize(funcName)}`]: getWaitForFunc(
          funcName,
          undefined,
          mappedArgs[funcName],
        ),
      }
    }, {})
    return {
      ...waitForFuncs,
    }
  }

  return {wrapRender, getGlobalFunctions}
}

export default setupTestWiring

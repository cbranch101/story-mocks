import React, {useEffect, useState} from 'react'
import {render as baseRender} from '@testing-library/react'

import {getRender} from 'react-wiring-library'
import setupStoryMocks from '../setupStoryMocks'
import getDecoratorWrapper from '../getDecoratorWrapper'

const renderStoryMocks = async ({
  storyWrappers,
  api: baseApi = {
    getResponse: () => Promise.resolve('real-response'),
  },
  mocks = {getResponse: 'mocked-response'},
  callWrap = true,
  simulateStorybook,
  mapResults,
  mappedArgs,
}) => {
  const {wrapApi, setupTestWiring} = setupStoryMocks({
    storyWrappers,
    mapResults,
  })

  const api = callWrap ? wrapApi(baseApi) : baseApi

  const {
    wrapRender: wrapRenderBase,
    getGlobalFunctions,
    StoryProvider,
  } = setupTestWiring({
    storyWrappers,
    mappedArgs,
  })

  const DataFetcher = () => {
    const [response, setResponse] = useState([])
    useEffect(() => {
      const getResponse = async () => {
        try {
          const response = await api.getResponse('passed-into-response')
          setResponse(response)
        } catch (e) {
          setResponse(`Error: ${e}`)
        }
      }
      getResponse()
    }, [])

    const renderedResponse =
      typeof response === 'string' ? response : JSON.stringify(response)
    return <div data-testid="response">{renderedResponse}</div>
  }

  const wiring = {
    children: {
      response: {
        findValue: 'response',
        serialize: val => val.textContent,
      },
    },
  }

  const Story = () => <DataFetcher />

  const setApiInStory = api => {
    Story.story = {
      parameters: {
        mocks: {
          api,
        },
      },
    }
  }

  setApiInStory(mocks)

  const decoratorWrapper = getDecoratorWrapper({
    StoryProvider,
  })

  // Because of the way storybook runs itself, there doesn't actually
  // seem to be any way to run the the decorator added when calling addDecorator in preview.js in tests
  // this is the closest I could get to actually testing that code
  // Instead of running setupDecorator, we just wrap the same function
  // that setupDecorator is eventually going to wrap
  const simulatedStorybookRender = Story =>
    baseRender(decoratorWrapper(Story, Story.story))

  const wrapRender = simulateStorybook
    ? simulatedStorybookRender
    : wrapRenderBase

  const render = getRender(wiring, {
    render: wrapRender,
    customFunctions: {
      global: getGlobalFunctions,
    },
  })

  const returnedFromRender = render(Story)
  const {findResponse} = returnedFromRender
  const returnedFromFindResponse = await findResponse()
  return {
    ...returnedFromRender,
    ...returnedFromFindResponse,
  }
}

describe('setupStoryMocks helper', () => {
  describe('when loading stories in the storybook environment', () => {
    test('mocks should behave the same as in tests', async () => {
      const {response} = await renderStoryMocks({
        simulateStorybook: true,
      })
      expect(response).toMatchSnapshot('initial render')
    })
  })
  describe('when running a test without calling wrapApi', () => {
    test('should throw an error', async () => {
      jest.spyOn(console, 'error')
      console.error.mockImplementation(() => {}) // eslint-disable-line
      await expect(
        renderStoryMocks({
          callWrap: false,
        }),
      ).rejects.toThrow(
        'Be sure to call wrapApi on your api before loading StoryMock stories or tests',
      )
      console.error.mockRestore() // eslint-disable-line
    })
  })
  describe('when mapResults is passed', () => {
    test('should call map results to update all returned mock results', async () => {
      const {response} = await renderStoryMocks({
        mapResults: results => ({
          data: results,
        }),
      })
      expect(response).toMatchSnapshot('initial render')
    })
  })
  describe('when mappedArgs is passed', () => {
    test(
      'should call the provided function on the correct api ' +
        'call to process its arguments before returning them from waitFor function',
      async () => {
        const {waitForGetResponse} = await renderStoryMocks({
          mappedArgs: {
            getResponse: passedIn => `${passedIn}-cleaned`,
          },
        })
        const args = await waitForGetResponse()
        expect(args).toMatchSnapshot('processed args')
      },
    )
  })
  describe('when mapResults is not passed', () => {
    describe('when the value of mocked api function is', () => {
      describe('a standard object', () => {
        test('that mocked object should be returned', async () => {
          const {response, waitForGetResponse} = await renderStoryMocks({
            mocks: {getResponse: 'mocked-response'},
          })
          expect(response).toMatchSnapshot('initial render')
          const args = await waitForGetResponse()
          expect(args).toMatchSnapshot('args passed into getResponse')
        })
      })
      describe('a function', () => {
        test('the result of calling that function should be returned', async () => {
          const {response} = await renderStoryMocks({
            mocks: {
              getResponse: passedIn => `${passedIn}-extra-stuff`,
            },
          })
          expect(response).toMatchSnapshot('initial render')
        })
      })
      describe('an object with a single key of TEST_ERROR', () => {
        test('should cause the promise to reject with the provided error message', async () => {
          const {response} = await renderStoryMocks({
            mocks: {getResponse: {TEST_ERROR: 'error-message'}},
          })
          expect(response).toMatchSnapshot('initial render')
        })
      })
      describe('an object with a key of TEST_ERROR and other keys', () => {
        test('should return the response like normal', async () => {
          const {response} = await renderStoryMocks({
            mocks: {
              getResponse: {TEST_ERROR: 'error-message', otherKey: true},
            },
          })
          expect(response).toMatchSnapshot('initial render')
        })
      })
    })
    describe('when the entire passed in api is a function', () => {
      test('the return value of the function should behave like a normal api', async () => {
        const {response} = await renderStoryMocks({
          mocks: () => ({getResponse: 'result-of-a-func-call'}),
        })
        expect(response).toMatchSnapshot('initial render')
      })
    })
    describe('when DELAY_AMOUNT is passed as a key to the api', () => {
      test('all api requests should be delayed by that amount', async () => {
        const {waitForGetResponse} = await renderStoryMocks({
          mocks: {
            getResponse: 'mocked-response',
            DELAY_AMOUNT: 100,
          },
        })
        const time = Date.now()
        await waitForGetResponse()
        const elapsed = Date.now() - time
        expect(elapsed).toBeGreaterThan(100)
      })
    })
  })
})

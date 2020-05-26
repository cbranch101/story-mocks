import React, {useEffect, useState, useContext} from 'react'
import {render as baseRender} from '@testing-library/react'

import {getRender} from 'react-wiring-library'
import setupStoryMocks from '../setupStoryMocks'
import getDecoratorWrapper from '../getDecoratorWrapper'

const renderStoryMocks = async ({
  storyWrappers,
  mocks = {getResponse: 'mocked-response'},
  updateStory,
  submitRequestsTwice = false,
  simulateStorybook,
  mapResults,
  mappedArgs,
}) => {
  const context = React.createContext(null)
  const {setupTestWiring, StoryProvider} =
    storyWrappers || mapResults
      ? setupStoryMocks({
          storyWrappers,
          api: {
            getResponse: () => Promise.resolve('real-response'),
          },
          context,
          mapResults,
        })
      : setupStoryMocks({
          context,
          api: {
            getResponse: () => Promise.resolve('real-response'),
          },
        })

  const callSetup = () =>
    storyWrappers || mappedArgs
      ? setupTestWiring({
          storyWrappers,
          mappedArgs,
        })
      : setupTestWiring()

  const {wrapRender: wrapRenderBase, getGlobalFunctions} = callSetup()

  const DataFetcher = () => {
    const [response, setResponse] = useState([])
    const api = useContext(context)
    useEffect(() => {
      const getResponse = async (intoApi) => {
        try {
          const response = await api.getResponse(intoApi)
          setResponse(response)
        } catch (e) {
          setResponse(`Error: ${e}`)
        }
      }
      const handleCalls = async () => {
        await getResponse('passed-into-response')
        if (submitRequestsTwice) {
          await getResponse('second-call')
        }
      }

      handleCalls()
    }, [])

    const renderedResponse =
      typeof response === 'string' ? response : JSON.stringify(response)
    return <div data-testid="response">{renderedResponse}</div>
  }

  const wiring = {
    children: {
      response: {
        findValue: 'response',
        serialize: (val) => val.textContent,
      },
    },
  }

  const Story = () => <DataFetcher />

  const setApiInStory = (api) => {
    Story.story = {
      parameters: {
        mocks: {
          api,
        },
      },
    }
  }

  if (updateStory) {
    updateStory(Story)
  } else {
    setApiInStory(mocks)
  }

  const decoratorWrapper = getDecoratorWrapper({
    StoryProvider,
  })

  // Because of the way storybook runs itself, there doesn't actually
  // seem to be any way to run the decorator added when calling setupDecorator in preview.js in tests.
  // This is the closest I could get to actually testing that code
  // Instead of running setupDecorator, we just wrap the same function
  // that setupDecorator is eventually going to wrap
  const simulatedStorybookRender = (Story) =>
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
  describe('when a waitFor function is called multiple times', () => {
    test('should wait for the next call of the api', async () => {
      const {waitForGetResponse} = await renderStoryMocks({
        mocks: {getResponse: 'mocked-response'},
        submitRequestsTwice: true,
      })
      const firstArgs = await waitForGetResponse()
      expect(firstArgs).toMatchSnapshot('first call args')
      const secondArgs = await waitForGetResponse()
      expect(secondArgs).toMatchSnapshot('second call args')
    })
  })
  describe('when loading stories in the storybook environment', () => {
    test('mocks should behave the same as in tests', async () => {
      const {response} = await renderStoryMocks({
        simulateStorybook: true,
      })
      expect(response).toMatchSnapshot('initial render')
    })
  })
  describe('when mapResults is passed', () => {
    test('should call map results to update all returned mock results', async () => {
      const {response} = await renderStoryMocks({
        mapResults: (results) => ({
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
            getResponse: (passedIn) => `${passedIn}-cleaned`,
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
              getResponse: (passedIn) => `${passedIn}-extra-stuff`,
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

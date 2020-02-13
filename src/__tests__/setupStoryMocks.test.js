import React, {useEffect, useState} from 'react'
import {getRender} from 'react-wiring-library'
import setupStoryMocks from '../setupStoryMocks'

const {wrapApi, setupTestWiring} = setupStoryMocks({
  storyWrappers: [],
})

const baseApi = {
  getResponse: () => Promise.resolve('real-response'),
}

const api = wrapApi(baseApi)

const {wrapRender, getGlobalFunctions} = setupTestWiring([])

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

const render = getRender(wiring, {
  render: wrapRender,
  customFunctions: {
    global: getGlobalFunctions,
  },
})

describe('setupStoryMocks helper', () => {
  describe('when the value of mocked api function is', () => {
    describe('a standard object', () => {
      test('that mocked object should be returned', async () => {
        setApiInStory({getResponse: 'mocked-response'})
        const {findResponse, waitForGetResponse} = render(Story)
        const args = await waitForGetResponse()
        expect(args).toMatchSnapshot('args passed into getResponse')
        const {response} = await findResponse()
        expect(response).toMatchSnapshot('initial render')
      })
    })
    describe('a function', () => {
      test('the result of calling that function should be returned', async () => {
        setApiInStory({getResponse: passedIn => `${passedIn}-extra-stuff`})
        const {findResponse} = render(Story)
        const {response} = await findResponse()
        expect(response).toMatchSnapshot('initial render')
      })
    })
    describe('an object with a single key of TEST_ERROR', () => {
      test('should cause the promise to reject with the provided error message', async () => {
        setApiInStory({getResponse: {TEST_ERROR: 'error-message'}})
        const {findResponse} = render(Story)
        const {response} = await findResponse()
        expect(response).toMatchSnapshot('initial render')
      })
    })
    describe('an object with a key of TEST_ERROR and other keys', () => {
      test('should return the response like normal', async () => {
        setApiInStory({
          getResponse: {TEST_ERROR: 'error-message', otherKey: true},
        })
        const {findResponse} = render(Story)
        const {response} = await findResponse()
        expect(response).toMatchSnapshot('initial render')
      })
    })
  })
  describe('when the entire passed in api is a function', () => {
    test('the return value of the function should behave like a normal api', async () => {
      setApiInStory(() => ({getResponse: 'result-of-a-func-call'}))
      const {findResponse} = render(Story)
      const {response} = await findResponse()
      expect(response).toMatchSnapshot('initial render')
    })
  })
  describe('when DELAY_AMOUNT is passed as a key to the api', () => {
    test('all api requests should be delayed by that amount', async () => {
      setApiInStory({getResponse: 'mocked-response', DELAY_AMOUNT: 100})
      const {findResponse, waitForGetResponse} = render(Story)
      await findResponse()
      const time = Date.now()
      await waitForGetResponse()
      const elapsed = Date.now() - time
      expect(elapsed).toBeGreaterThan(100)
    })
  })
})

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
      const response = await api.getResponse('passed-into-response')
      setResponse(response)
    }
    getResponse()
  }, [])
  return <div data-testid="response">{response}</div>
}

const wiring = {
  children: {
    response: {
      findValue: 'response',
      serialize: val => val.textContent,
    },
  },
}

const render = getRender(wiring, {
  render: wrapRender,
  customFunctions: {
    global: getGlobalFunctions,
  },
})

describe('setupStoryMocks helper', () => {
  describe('when the value of mocked api function is a standard object', () => {
    test('that mocked object should be returned', async () => {
      const Story = () => <DataFetcher />
      Story.story = {
        parameters: {
          mocks: {
            api: {
              getResponse: 'mocked-response',
            },
          },
        },
      }

      const {findResponse, waitForGetResponse} = render(Story)
      const args = await waitForGetResponse()
      expect(args).toMatchSnapshot('args passed into getResponse')
      const {response} = await findResponse()
      expect(response).toMatchSnapshot('initial render')
    })
  })
})

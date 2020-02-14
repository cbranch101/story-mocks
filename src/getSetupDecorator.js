import React from 'react'
import {makeDecorator} from '@storybook/addons'
import {addDecorator} from '@storybook/react'

const setupDecorator = ({
  getStoryProvider,
  storyWrappers,
  mapResults,
}) => () => {
  const StoryProvider = getStoryProvider(storyWrappers, {mapResults})
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

export default setupDecorator

import React from 'react'

const getDecoratorWrapper = ({getStoryProvider, storyWrappers, mapResults}) => {
  const StoryProvider = getStoryProvider(storyWrappers, {mapResults})
  return (storyFn, context) => {
    const {parameters = {}} = context
    const {mocks} = parameters
    return <StoryProvider {...mocks}>{storyFn(context)}</StoryProvider>
  }
}

export default getDecoratorWrapper

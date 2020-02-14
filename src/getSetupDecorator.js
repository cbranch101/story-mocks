import React from 'react'
import {makeDecorator} from '@storybook/addons'
import {addDecorator} from '@storybook/react'

const setupDecorator = ({wrapper}) => () => {
  const withMocks = makeDecorator({
    name: 'withMocks',
    parameterName: 'mocks',
    skipIfNoParametersOrOptions: false,
    wrapper,
  })
  addDecorator(withMocks)
}
export default setupDecorator

import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';
import { MemoryRouter } from 'react-router-dom';
import CommonConnectivity from './CommonConnectivity';

const styles = {};

const actions = {
  getQueryObject: jest.fn(() => ({
    bodyIds: '',
    names: []
  })),
  getQueryString: jest.fn(),
  metaInfoError: jest.fn(),
  submit: jest.fn()
};

const neoServerSettings = {
  get: () => 'http://example.com'
};

const raw = (
  <MemoryRouter>
    <CommonConnectivity
      actions={actions}
      dataSet="mb6"
      history={{ push: jest.fn() }}
      classes={styles}
      neoServerSettings={neoServerSettings}
    />
  </MemoryRouter>
);

function providedRenderedComponent() {
  const wrapper = mount(raw);
  // get through the styles and router components that wrap the plugin.
  const rendered = wrapper.children().children();
  return rendered;
}

describe('Common Connectivity Plugin', () => {
  beforeEach(() => {
    actions.submit.mockReset();
  });

  describe('has required functions', () => {
    test('name', () => {
      expect(CommonConnectivity.queryName).toBeTruthy();
    });
    test('description', () => {
      expect(CommonConnectivity.queryDescription).toBeTruthy();
    });
  });

  describe('renders correct defaults', () => {
    const rendered = providedRenderedComponent();

    it('should render', () => {
      const component = renderer.create(raw);
      const tree = component.toJSON();
      expect(tree).toMatchSnapshot();
    });

    test('bodyIds should be empty', () => {
      expect(
        rendered
          .find('textarea')
          .at(2)
          .props().value
      ).toEqual('');
    });

    test('typeValue should be inputs', () => {
      const inputType = rendered.find('input[name="type"]').at(0);
      expect(inputType.props().value).toEqual('input');
      expect(inputType.props().checked).toBe(true);

      const outputType = rendered.find('input[name="type"]').at(1);
      expect(outputType.props().value).toEqual('output');
      expect(outputType.props().checked).toBe(false);
    });
  });

  describe('submits correctly', () => {
    const rendered = providedRenderedComponent();
    test('submit button pressed', () => {
      rendered
        .find('Button')
        .simulate('click');
      expect(actions.submit).toHaveBeenCalledTimes(1);
    });

    test('enter key pressed in text field', () => {
      rendered
        .find('TextField')
        .at(0)
        .simulate('keyDown', { keyCode: 13 });
      expect(actions.submit).toHaveBeenCalledTimes(1);
    });
  });
});
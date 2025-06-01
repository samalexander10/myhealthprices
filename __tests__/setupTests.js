// __tests__/setupTests.js
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-18';

// Configure Enzyme for React 18
configure({ adapter: new Adapter() });

// Mock CSS/SCSS imports for Jest
import './cssStub.js';

// Polyfill for older browsers (if needed)
import 'babel-polyfill';

// Mock global fetch for API tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
);

// Optional: Mock Apollo Client for GraphQL tests
import { MockedProvider } from '@apollo/client/testing';
jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  MockedProvider: jest.fn(() => null),
}));
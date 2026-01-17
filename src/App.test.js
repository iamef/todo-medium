import { render, screen } from '@testing-library/react';
import App from './App';

test('renders todo app', () => {
  render(<App />);
  const headerElement = screen.getByText(/todo app/i);
  expect(headerElement).toBeInTheDocument();
});

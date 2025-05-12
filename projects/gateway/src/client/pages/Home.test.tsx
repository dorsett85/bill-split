import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Home } from './Home.tsx';

describe('test Home', () => {
  it('renders', () => {
    render(<Home />);
    expect(
      screen.getByRole('heading', { name: 'Welcome to Bill Split!' }),
    ).toBeVisible();
  });
});

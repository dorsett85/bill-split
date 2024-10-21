import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Home } from './Home.tsx';

describe('test Home', () => {
  it('renders', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { name: 'Hello World!' })).toBeVisible();
  });
});

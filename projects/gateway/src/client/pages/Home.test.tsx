import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Home } from './Home.tsx';

describe('test Home', () => {
  it('renders', () => {
    render(
      <MantineProvider>
        <Home />
      </MantineProvider>,
    );
    expect(
      screen.getByRole('heading', { name: 'Welcome to Check Mate!' }),
    ).toBeVisible();
  });
});

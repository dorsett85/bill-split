import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Access } from './Access.tsx';

describe('test Access', () => {
  it('renders', () => {
    render(
      <MantineProvider>
        <Access />
      </MantineProvider>,
    );
    expect(
      screen.getByRole('heading', { name: 'Verify Access' }),
    ).toBeVisible();
  });
});

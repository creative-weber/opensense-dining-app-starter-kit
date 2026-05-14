import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from './LandingPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('admin landing page', () => {
  it('links to the dashboard and customer demo', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /route users from the public demo/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /open dashboard/i })).toHaveLength(2);
    for (const link of screen.getAllByRole('link', { name: /open dashboard/i })) {
      expect(link).toHaveAttribute('href', '/dashboard');
    }
    expect(screen.getByRole('link', { name: /view customer demo/i })).toHaveAttribute('href', 'http://localhost:5174/demo');
  });
});
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';

function renderAtPath(pathname: string) {
  window.history.pushState({}, '', pathname);
  return render(<App />);
}

afterEach(() => {
  window.history.pushState({}, '', '/');
});

describe('customer app routes', () => {
  it('shows the public landing page at root', async () => {
    renderAtPath('/');

    expect(await screen.findByRole('heading', { name: /show the dining flow/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open dining demo/i })).toHaveAttribute('href', '/demo');
    expect(screen.getByRole('link', { name: /open admin dashboard/i })).toHaveAttribute('href', 'http://localhost:5173/dashboard');
  });

  it.each([
    ['/support', /need help using opensense dining/i],
    ['/privacy', /privacy by design/i],
    ['/terms', /terms for open source use/i],
    ['/license', /mit licensed open source software/i],
    ['/demo', /safe public demo/i],
  ])('renders the %s page', async (path, heading) => {
    renderAtPath(path);

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  });
});
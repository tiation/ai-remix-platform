import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { createClient } from '@supabase/supabase-js';
import { SessionContextProvider } from '@supabase/auth-helpers-react';

// Mock Supabase client
const mockSupabaseClient = createClient('http://localhost:54321', 'mock-key');

function render(
  ui: React.ReactElement,
  {
    preloadedState = {},
    supabaseClient = mockSupabaseClient,
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SessionContextProvider supabaseClient={supabaseClient}>
        {children}
      </SessionContextProvider>
    );
  }
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { render };

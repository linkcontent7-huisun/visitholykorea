import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './providers/AppProviders';
import { router } from './routes/router';

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}

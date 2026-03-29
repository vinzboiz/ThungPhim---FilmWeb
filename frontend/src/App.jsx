import { AuthProvider } from './providers/AuthProvider.jsx';
import AppRouter from './router/AppRouter.jsx';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;

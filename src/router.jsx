import { Routes, Route } from 'react-router-dom';
import QuoteCalculator from './pages/quotes/QuoteCalculator';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<QuoteCalculator />} />
    </Routes>
  );
}

export default AppRoutes;
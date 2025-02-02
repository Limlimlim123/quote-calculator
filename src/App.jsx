import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './router';

function App() {
  return (
    <BrowserRouter>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '20px'
        }}>
          <h1 style={{
            textAlign: 'center',
            color: '#1976d2',
            marginBottom: '40px',
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            波点包装报价系统
          </h1>
          <AppRoutes />
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
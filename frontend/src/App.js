
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import FaqPage from './components/FaqList';

const NotFound = () => <h1>404: Page Not Found</h1>;
const App = () => {
  return (
    <BrowserRouter>
      <main className="p-4">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/faq" element={<FaqPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
};

export default App;

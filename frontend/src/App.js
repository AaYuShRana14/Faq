import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import FaqPage from "./components/FaqList";
import Login from "./components/auth/Login";

const NotFound = () => <h1>404: Page Not Found</h1>;

const App = () => {
  return (
    <Router>
      <main className="p-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/faqs" element={<FaqPage />} />
          <Route path="/" element={<Navigate to="/faqs" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;

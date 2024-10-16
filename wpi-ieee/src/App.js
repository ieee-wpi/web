import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Header from './components/Header';
import Networking from './pages/Networking';
import Exec from './pages/Exec';
import './style.css';


const App = () => {
  return (
    <Router>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<Header />} />
          <Route path="/networking" element={<Networking />} />
          <Route path="/exec" element={<Exec />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;

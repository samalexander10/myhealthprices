import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.scss';
import './components/TopExpensiveMeds.scss';
import '@fortawesome/fontawesome-free/css/all.min.css';

const root = createRoot(document.getElementById('root'));
root.render(<App />);

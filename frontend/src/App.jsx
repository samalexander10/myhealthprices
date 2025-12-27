import React, { useState } from 'react';
import SearchBar from './components/SearchBar';
import StateFilter from './components/StateFilter';
import DrugDashboard from './components/DrugDashboard';
import FeaturedMedications from './components/FeaturedMedications';

function App() {
  const [selectedStates, setSelectedStates] = useState(['Nationwide']);
  const [selectedDrug, setSelectedDrug] = useState(null);

  const toggleState = (state) => {
    setSelectedStates(prev =>
      prev.includes(state)
        ? prev.filter(s => s !== state)
        : [...prev, state]
    );
  };

  return (
    <div className="app">
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title"><i className="fas fa-heartbeat"></i> MyHealthPrices</h1>
            <p className="hero-subtitle">Real-time prescription drug prices across the US.</p>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">50+</span>
                <span className="stat-label">States Covered</span>
              </div>
              <div className="stat">
                <span className="stat-number">10k+</span>
                <span className="stat-label">Drug Products</span>
              </div>
              <div className="stat">
                <span className="stat-number">Live</span>
                <span className="stat-label">Market Data</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="layout">
          <StateFilter
            selectedStates={selectedStates}
            onToggleState={toggleState}
          />
          <div style={{ flex: 1 }}>
            <SearchBar onSelectDrug={setSelectedDrug} />

            {!selectedDrug ? (
              <FeaturedMedications onSelectDrug={setSelectedDrug} />
            ) : (
              <DrugDashboard
                selectedDrug={selectedDrug}
                selectedStates={selectedStates}
              />
            )}
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="container">
          <p className="disclaimer">
            Data sourced from Medicaid State Drug Utilization Data. Prices are average per unit reimbursements.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

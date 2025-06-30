import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [drugName, setDrugName] = useState('');
  const [selectedLocations, setSelectedLocations] = useState(['Nationwide']);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock location-based price adjustments
  const locationAdjustments = {
    Nationwide: 1.0,
    California: 1.1,
    'New York': 1.08,
    Texas: 0.95,
  };

  // Available locations for filter
  const locations = ['Nationwide', 'California', 'New York', 'Texas'];

  const toggleLocation = (location) => {
    setSelectedLocations(prev =>
      prev.includes(location)
        ? prev.filter(loc => loc !== location)
        : [...prev, location]
    );
  };

  const fetchDrugInfo = async () => {
    if (!drugName.trim()) {
      setError('Please enter a drug name.');
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const response = await axios.get(`/api/drugs?name=${encodeURIComponent(drugName)}`);
      console.log('API Response:', response.data);
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      const drug = response.data[0];
      const basePrice = drug.nadac_price || 0.00;
      const newResults = selectedLocations.map(location => ({
        name: drug.drug_name,
        ndc: drug.ndc,
        price: (basePrice * (locationAdjustments[location] || 1.0)).toFixed(2),
        location,
      }));
      setResults(newResults);
    } catch (err) {
      setError(`Error: ${err.message}. Try a more specific name, e.g., "IBUPROFEN 200 MG CAPSULE".`);
      console.error('Error Details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (drugName.trim() && selectedLocations.length > 0) {
      fetchDrugInfo();
    } else if (!drugName.trim()) {
      setResults([]);
      setError(null);
    }
  }, [drugName, selectedLocations]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchDrugInfo();
    }
  };

  return (
    <div className="container">
      <h1>MyHealthPrices</h1>
      <div className="layout">
        <div className="filter-panel">
          <h3>Locations</h3>
          <ul className="location-list">
            {locations.map(location => (
              <li
                key={location}
                className={`location-item ${selectedLocations.includes(location) ? 'active' : ''}`}
                onClick={() => toggleLocation(location)}
              >
                {location}
              </li>
            ))}
          </ul>
        </div>
        <div className="main-content">
          <div className="search-bar">
            <input
              type="text"
              value={drugName}
              onChange={(e) => setDrugName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter drug name (e.g., IBUPROFEN 200 MG CAPSULE)"
            />
            <button onClick={fetchDrugInfo}>Search</button>
          </div>
          {loading && <div className="spinner">Loading...</div>}
          {error && <p className="error">{error}</p>}
          {results.length > 0 && (
            <div className="results">
              {results.map((result, index) => (
                <div key={index} className="result-card">
                  <h2>{result.name}</h2>
                  <p><strong>NDC:</strong> {result.ndc}</p>
                  <p><strong>Price:</strong> ${result.price}</p>
                  <p><strong>Location:</strong> {result.location}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [drugName, setDrugName] = useState('');
  const [selectedLocations, setSelectedLocations] = useState(['Nationwide']);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock pricing data by RXCUI and location
  const mockPrices = {
    5640: { // ibuprofen
      Nationwide: 5.99,
      California: 6.49,
      'New York': 6.29,
      Texas: 5.79,
    },
    153165: { // lipitor
      Nationwide: 12.49,
      California: 13.99,
      'New York': 13.49,
      Texas: 12.29,
    },
    308135: { // amoxicillin
      Nationwide: 8.99,
      California: 9.49,
      'New York': 9.29,
      Texas: 8.79,
    },
    68382: { // metformin
      Nationwide: 4.50,
      California: 4.99,
      'New York': 4.79,
      Texas: 4.39,
    },
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
      const response = await axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(drugName)}`);
      console.log('Raw API Response:', response.data);
      const idGroup = response.data.idGroup;
      if (!idGroup || !idGroup.rxnormId) {
        throw new Error('No drug data found. Try: ibuprofen, lipitor, amoxicillin, metformin.');
      }
      const rxcui = idGroup.rxnormId[0];
      const newResults = selectedLocations.map(location => ({
        name: idGroup.name || drugName,
        rxcui,
        price: mockPrices[rxcui]?.[location] || 0.00,
        location,
      }));
      setResults(newResults);
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error('Error Details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Automatically fetch results when selectedLocations or drugName changes
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
              placeholder="Enter drug name (e.g., ibuprofen)"
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
                  <p><strong>RXCUI:</strong> {result.rxcui}</p>
                  <p><strong>Price:</strong> ${result.price.toFixed(2)}</p>
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
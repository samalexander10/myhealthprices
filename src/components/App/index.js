import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [drugName, setDrugName] = useState('');
  const [selectedLocations, setSelectedLocations] = useState(['Nationwide']);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock location-based price adjustments for all 50 U.S. states
  const locationAdjustments = {
    Nationwide: 1.0,
    Alabama: 0.95,
    Alaska: 1.15,
    Arizona: 1.02,
    Arkansas: 0.94,
    California: 1.1,
    Colorado: 1.03,
    Connecticut: 1.08,
    Delaware: 1.05,
    Florida: 1.04,
    Georgia: 1.01,
    Hawaii: 1.2,
    Idaho: 0.97,
    Illinois: 1.06,
    Indiana: 0.99,
    Iowa: 0.96,
    Kansas: 0.95,
    Kentucky: 0.94,
    Louisiana: 0.97,
    Maine: 1.07,
    Maryland: 1.08,
    Massachusetts: 1.09,
    Michigan: 1.02,
    Minnesota: 1.03,
    Mississippi: 0.93,
    Missouri: 0.96,
    Montana: 0.98,
    Nebraska: 0.95,
    Nevada: 1.05,
    'New Hampshire': 1.07,
    'New Jersey': 1.09,
    'New Mexico': 0.99,
    'New York': 1.08,
    'North Carolina': 1.01,
    'North Dakota': 0.97,
    Ohio: 1.0,
    Oklahoma: 0.96,
    Oregon: 1.04,
    Pennsylvania: 1.06,
    'Rhode Island': 1.08,
    'South Carolina': 1.0,
    'South Dakota': 0.96,
    Tennessee: 0.98,
    Texas: 0.95,
    Utah: 0.99,
    Vermont: 1.07,
    Virginia: 1.05,
    Washington: 1.06,
    'West Virginia': 0.94,
    Wisconsin: 1.02,
    Wyoming: 0.97,
  };

  // Available locations for filter
  const locations = [
    'Nationwide',
    'Alabama',
    'Alaska',
    'Arizona',
    'Arkansas',
    'California',
    'Colorado',
    'Connecticut',
    'Delaware',
    'Florida',
    'Georgia',
    'Hawaii',
    'Idaho',
    'Illinois',
    'Indiana',
    'Iowa',
    'Kansas',
    'Kentucky',
    'Louisiana',
    'Maine',
    'Maryland',
    'Massachusetts',
    'Michigan',
    'Minnesota',
    'Mississippi',
    'Missouri',
    'Montana',
    'Nebraska',
    'Nevada',
    'New Hampshire',
    'New Jersey',
    'New Mexico',
    'New York',
    'North Carolina',
    'North Dakota',
    'Ohio',
    'Oklahoma',
    'Oregon',
    'Pennsylvania',
    'Rhode Island',
    'South Carolina',
    'South Dakota',
    'Tennessee',
    'Texas',
    'Utah',
    'Vermont',
    'Virginia',
    'Washington',
    'West Virginia',
    'Wisconsin',
    'Wyoming',
  ];

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
      setError(`Error: ${err.message}. Try a specific name, e.g., "IBUPROFEN 200 MG CAPSULE".`);
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
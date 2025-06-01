import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [drugName, setDrugName] = useState('');
  const [location, setLocation] = useState('Nationwide');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('name');

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

  // Available locations for dropdown
  const locations = ['Nationwide', 'California', 'New York', 'Texas'];

  const fetchDrugInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(drugName)}`);
      console.log('Raw API Response:', response.data);
      const idGroup = response.data.idGroup;
      if (!idGroup || !idGroup.rxnormId) {
        throw new Error('No drug data found. Try: ibuprofen, lipitor, amoxicillin, metformin.');
      }
      const rxcui = idGroup.rxnormId[0];
      const price = mockPrices[rxcui]?.[location] || 0.00;
      const newResult = {
        name: idGroup.name || drugName,
        rxcui,
        price,
        location,
      };
      setResults(prev => [...prev, newResult].sort((a, b) =>
        sortBy === 'name' ? a.name.localeCompare(b.name) :
        sortBy === 'price' ? a.price - b.price : 0
      ));
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error('Error Details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchDrugInfo();
    }
  };

  return (
    <div className="container">
      <h1>MyHealthPrices</h1>
      <div className="search-bar">
        <input
          type="text"
          value={drugName}
          onChange={(e) => setDrugName(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter drug name (e.g., ibuprofen)"
        />
        <select value={location} onChange={(e) => setLocation(e.target.value)}>
          {locations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        <button onClick={fetchDrugInfo}>Search</button>
      </div>
      <div className="sort-controls">
        <label>Sort by: </label>
        <select onChange={(e) => setSortBy(e.target.value)} value={sortBy}>
          <option value="name">Name</option>
          <option value="price">Price</option>
        </select>
      </div>
      {loading && <div className="spinner">Loading...</div>}
      {error && <p className="error">{error}</p>}
      {results.length > 0 && (
        <table className="results-table">
          <thead>
            <tr>
              <th>Drug Name</th>
              <th>RXCUI</th>
              <th>Price</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={index}>
                <td>{result.name}</td>
                <td>{result.rxcui}</td>
                <td>${result.price.toFixed(2)}</td>
                <td>{result.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
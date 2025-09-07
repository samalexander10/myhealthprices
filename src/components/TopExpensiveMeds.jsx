import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TopExpensiveMeds.scss';

const TopExpensiveMeds = () => {
  const [topMeds, setTopMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTopExpensiveMeds();
  }, []);

  const fetchTopExpensiveMeds = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/medications/top-expensive?limit=3');
      setTopMeds(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading top medications...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <section className="top-expensive-meds" data-testid="top-expensive-meds">
      <h2 className="section-title">Top 3 Highest-Priced Medications</h2>
      <div className="meds-grid">
        {topMeds.map((med, index) => (
          <div key={med.id} className={`med-card rank-${index + 1}`} data-testid={`med-card-${index}`}>
            <div className="rank-badge">#{index + 1}</div>
            <h3 className="med-name" data-testid="med-name">{med.name}</h3>
            <div className="price" data-testid="med-price">${med.price.toFixed(2)}</div>
            <div className="location" data-testid="med-location">
              <i className="location-icon">📍</i>
              {med.pharmacy} - {med.city}, {med.state}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TopExpensiveMeds;

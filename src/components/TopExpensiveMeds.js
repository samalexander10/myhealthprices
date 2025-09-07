import React, { useState, useEffect } from 'react';

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
      setError(null);
      const response = await fetch('/api/medications/top-expensive?limit=3');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No medication data available');
      }
      setTopMeds(data);
    } catch (err) {
      console.error('Error fetching top expensive medications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getRankColor = (index) => {
    const colors = ['rank-gold', 'rank-silver', 'rank-bronze'];
    return colors[index] || 'rank-default';
  };

  const getStateName = (stateCode) => {
    const stateMap = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
      'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
      'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
      'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
      'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
      'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
      'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
      'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
      'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
      'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
      'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
      'WI': 'Wisconsin', 'WY': 'Wyoming'
    };
    return stateMap[stateCode] || stateCode;
  };

  if (loading) {
    return (
      <div className="top-expensive-meds-container" data-testid="top-expensive-meds-loading">
        <div className="top-expensive-meds-card">
          <div className="card-header">
            <div className="skeleton skeleton-title"></div>
          </div>
          <div className="card-body">
            <div className="meds-grid">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="med-card-skeleton">
                  <div className="skeleton skeleton-text"></div>
                  <div className="skeleton skeleton-price"></div>
                  <div className="skeleton skeleton-location"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="top-expensive-meds-container" data-testid="top-expensive-meds-error">
        <div className="error-alert">
          <i className="fas fa-exclamation-triangle"></i>
          Unable to load top medications: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="top-expensive-meds-container" data-testid="top-expensive-meds">
      <div className="top-expensive-meds-card">
        <div className="card-header">
          <div className="header-content">
            <i className="fas fa-chart-line header-icon"></i>
            <h2 className="section-title">
              Top 3 Highest-Priced Medications
            </h2>
          </div>
          <p className="section-subtitle">
            Current highest-cost medications by state pricing
          </p>
        </div>
        <div className="card-body">
          <div className="meds-grid">
            {topMeds.map((med, index) => (
              <div
                key={`${med.id}-${med.pharmacy_id}`}
                className="med-card"
                data-testid={`med-card-${index}`}
              >
                <div className={`rank-badge ${getRankColor(index)}`} data-testid={`rank-badge-${index}`}>
                  #{index + 1}
                </div>
                
                <div className="med-content">
                  <h3 
                    className="med-name"
                    data-testid={`med-name-${index}`}
                  >
                    {med.name}
                  </h3>
                  
                  <div className="price-section">
                    <i className="fas fa-dollar-sign price-icon"></i>
                    <span 
                      className="med-price"
                      data-testid={`med-price-${index}`}
                    >
                      {formatPrice(med.price)}
                    </span>
                    <span className="price-unit">per unit</span>
                  </div>
                  
                  <div className="location-section">
                    <i className="fas fa-map-marker-alt location-icon"></i>
                    <div 
                      className="location-info"
                      data-testid={`med-location-${index}`}
                    >
                      <div className="state-name">{getStateName(med.state)}</div>
                    </div>
                  </div>

                  {med.last_updated && (
                    <div className="last-updated">
                      Updated: {new Date(med.last_updated).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="disclaimer">
            Prices shown are average unit prices by state and may vary by location and pharmacy.
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopExpensiveMeds;

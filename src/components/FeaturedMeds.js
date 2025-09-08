import React, { useState, useEffect } from 'react';

const FeaturedMeds = () => {
  const [featuredMeds, setFeaturedMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeaturedMeds();
  }, []);

  const fetchFeaturedMeds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/medications/featured?limit=3');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No featured medication data available');
      }
      setFeaturedMeds(data);
    } catch (err) {
      console.error('Error fetching featured medications:', err);
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

  if (loading) {
    return (
      <div className="featured-meds-container" data-testid="featured-meds-loading">
        <div className="featured-meds-card">
          <div className="card-header">
            <div className="skeleton skeleton-title"></div>
          </div>
          <div className="card-body">
            <div className="meds-grid">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="med-card-skeleton">
                  <div className="skeleton skeleton-text"></div>
                  <div className="skeleton skeleton-price"></div>
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
      <div className="featured-meds-container" data-testid="featured-meds-error">
        <div className="error-alert">
          <i className="fas fa-exclamation-triangle"></i>
          Unable to load featured medications: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="featured-meds-container" data-testid="featured-meds">
      <div className="featured-meds-card">
        <div className="card-header">
          <div className="header-content">
            <i className="fas fa-star header-icon"></i>
            <h2 className="section-title">
              Featured Medications
            </h2>
          </div>
          <p className="section-subtitle">
            Curated selection of mid-range priced medications
          </p>
        </div>
        <div className="card-body">
          <div className="meds-grid">
            {featuredMeds.map((med, index) => (
              <div
                key={`${med.name}-${med.ndc}`}
                className="med-card featured"
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
                      {formatPrice(med.pricePerUnit)}
                    </span>
                    <span className="price-unit">per unit</span>
                  </div>

                  {med.genericName && med.name !== med.genericName && (
                    <div className="generic-name">
                      Generic: {med.genericName}
                    </div>
                  )}

                  {med.ndcPrefix && (
                    <div className="ndc-info">
                      NDC: {med.ndcPrefix}xxxxx
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="disclaimer">
            Featured medications are updated daily and represent mid-range pricing options.
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedMeds;

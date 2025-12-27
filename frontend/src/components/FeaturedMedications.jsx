import React, { useState, useEffect } from 'react';
import { getExpensiveMedications, getCheapMedications } from '../api';

const FeaturedMedications = ({ onSelectDrug }) => {
    const [expensive, setExpensive] = useState([]);
    const [cheap, setCheap] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const [expensiveData, cheapData] = await Promise.all([
                    getExpensiveMedications(),
                    getCheapMedications()
                ]);
                setExpensive(expensiveData);
                setCheap(cheapData);
            } catch (err) {
                console.error('Failed to fetch featured meds:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchFeatured();
    }, []);

    if (loading) return (
        <div className="meds-grid">
            {[1, 2, 3].map(i => (
                <div key={i} className="med-card-skeleton skeleton">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-text"></div>
                    <div className="skeleton-price"></div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="featured-sections">
            {expensive.length > 0 && (
                <div className="top-expensive-meds-container">
                    <div className="header-content">
                        <i className="fas fa-exclamation-circle header-icon"></i>
                        <h3 className="section-title">Most Expensive Medications</h3>
                    </div>
                    <p className="section-subtitle">Based on nationwide average price per unit</p>
                    <div className="meds-grid">
                        {expensive.map((med, index) => (
                            <div key={med.ndc} className="med-card expensive" onClick={() => onSelectDrug(med)}>
                                <div className="rank-badge rank-gold">{index + 1}</div>
                                <div className="med-content">
                                    <h4 className="med-name">{med.name}</h4>
                                    <p className="med-manufacturer">{med.manufacturer}</p>
                                    <div className="price-section">
                                        <span className="med-price">${med.averagePrice.toFixed(2)}</span>
                                        <span className="price-unit">per unit</span>
                                    </div>
                                    <p className="ndc-info">NDC: {med.ndc}</p>
                                    <p className="last-updated">Reported in {med.totalStates} states</p>
                                </div>
                                <div className="med-action">
                                    <span>Click to view</span>
                                    <i className="fas fa-arrow-right"></i>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {cheap.length > 0 && (
                <div className="lowest-price-meds-container">
                    <div className="header-content">
                        <i className="fas fa-check-circle header-icon"></i>
                        <h3 className="section-title">Best Value Medications</h3>
                    </div>
                    <p className="section-subtitle">Common medications with the lowest per-unit cost</p>
                    <div className="meds-grid">
                        {cheap.map((med, index) => (
                            <div key={med.ndc} className="med-card lowest-price" onClick={() => onSelectDrug(med)}>
                                <div className="rank-badge rank-bronze">{index + 1}</div>
                                <div className="med-content">
                                    <h4 className="med-name">{med.name}</h4>
                                    <p className="med-manufacturer">{med.manufacturer}</p>
                                    <div className="price-section">
                                        <span className="med-price">${med.averagePrice.toFixed(2)}</span>
                                        <span className="price-unit">per unit</span>
                                    </div>
                                    <p className="ndc-info">NDC: {med.ndc}</p>
                                    <p className="last-updated">Reported in {med.totalStates} states</p>
                                </div>
                                <div className="med-action">
                                    <span>Click to view</span>
                                    <i className="fas fa-arrow-right"></i>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeaturedMedications;

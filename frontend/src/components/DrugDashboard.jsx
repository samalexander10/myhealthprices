import React, { useState, useEffect } from 'react';
import { getDrugSummary, getDrugPrices } from '../api';

const stateCodeMap = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
    'Nationwide': 'Nationwide'
};

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DrugDashboard = ({ selectedDrug, selectedStates }) => {
    const [summary, setSummary] = useState(null);
    const [allPrices, setAllPrices] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedDrug) return;
            setLoading(true);
            try {
                const [summaryData, priceData] = await Promise.all([
                    getDrugSummary(selectedDrug.ndc),
                    getDrugPrices(selectedDrug.ndc)
                ]);
                setSummary(summaryData);
                setAllPrices(priceData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedDrug]);

    if (!selectedDrug) return null;

    // Filter prices based on selected states for the specific section
    const activeStateCodes = selectedStates
        .filter(s => s !== 'Nationwide')
        .map(s => stateCodeMap[s] || s);

    const filteredPrices = allPrices.filter(p => activeStateCodes.includes(p.state));

    const chartData = [
        ...(summary?.summary ? [{
            name: 'Nationwide Avg',
            price: summary.summary.averagePrice,
            isAvg: true
        }] : []),
        ...filteredPrices.map(p => ({
            name: p.state,
            price: p.price,
            isAvg: false
        }))
    ];

    return (
        <div className="main-content">
            <div className="search-section">
                <h2>Result for {selectedDrug.name} ({selectedDrug.manufacturer})</h2>
                <p className="ndc-info">NDC: {selectedDrug.ndc} | Labeler: {selectedDrug.labeler}</p>
            </div>

            {loading && (
                <div className="spinner"><i className="fas fa-spinner fa-spin"></i> Loading data...</div>
            )}

            {!loading && summary && (
                <>
                    <div className="chart-container">
                        <div className="chart-header">
                            <h3><i className="fas fa-chart-bar"></i> Price Comparison</h3>
                        </div>
                        <div className="chart-body" style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(val) => `$${val}`} />
                                    <Tooltip
                                        formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.isAvg ? '#2E86AB' : '#A23B72'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="results-section">
                        <h3>Nationwide Summary</h3>
                        <div className="results-grid">
                            <div className="result-card summary-card">
                                <div className="card-header">
                                    <h4>Average Overview</h4>
                                    <span className="price-badge">${summary.summary?.averagePrice?.toFixed(2) || 'N/A'}</span>
                                </div>
                                <div className="card-body">
                                    <div className="summary-stats">
                                        <p><i className="fas fa-arrow-down"></i> Min: <strong>${summary.summary?.minPrice?.toFixed(2)}</strong></p>
                                        <p><i className="fas fa-arrow-up"></i> Max: <strong>${summary.summary?.maxPrice?.toFixed(2)}</strong></p>
                                        <p><i className="fas fa-globe-americas"></i> Reported in {summary.summary?.totalStates} states</p>
                                    </div>

                                    <div className="state-pricing-list">
                                        <h5><i className="fas fa-list-ul"></i> State Breakdown</h5>
                                        <div className="scroll-container">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>State</th>
                                                        <th>Price</th>
                                                        <th>Period</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {allPrices.map(p => (
                                                        <tr key={p.state}>
                                                            <td>{p.state}</td>
                                                            <td className="price-cell">${p.price.toFixed(2)}</td>
                                                            <td className="period-cell">{p.year} Q{p.quarter}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {filteredPrices.length > 0 && (
                        <div className="results-section" style={{ marginTop: '20px' }}>
                            <h3>Selected State Prices</h3>
                            <div className="results">
                                {filteredPrices.map(price => (
                                    <div key={price.state} className="result-card">
                                        <div className="card-header">
                                            <h4>{price.state}</h4>
                                            <span className="price-badge">${price.price?.toFixed(2)}</span>
                                        </div>
                                        <div className="card-body">
                                            <p><i className="fas fa-calendar-alt"></i> Year: {price.year} Q{price.quarter}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default DrugDashboard;

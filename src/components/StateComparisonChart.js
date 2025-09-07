import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StateComparisonChart = ({ results }) => {
  if (!results || results.length === 0) return null;

  const chartData = results.map(result => ({
    state: result.location,
    price: parseFloat(result.price),
    name: result.name
  }));

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Price Comparison Across Selected States</h3>
      </div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="state" angle={-45} textAnchor="end" height={100} />
            <YAxis tickFormatter={(value) => `$${value}`} />
            <Tooltip formatter={(value) => [`$${value}`, 'Price']} />
            <Bar dataKey="price" fill="var(--primary-blue)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StateComparisonChart;

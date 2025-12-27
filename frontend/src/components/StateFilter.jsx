import React from 'react';

const availableStates = [
    'Nationwide', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
    'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const StateFilter = ({ selectedStates, onToggleState }) => {
    return (
        <div className="filter-panel">
            <h3><i className="fas fa-map-marker-alt"></i> Select States</h3>
            <ul className="location-list">
                {availableStates.map(state => (
                    <li
                        key={state}
                        className={`location-item ${selectedStates.includes(state) ? 'active' : ''}`}
                        onClick={() => onToggleState(state)}
                    >
                        {state}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default StateFilter;

import React, { useState, useEffect, useRef } from 'react';
import { searchDrugs } from '../api';

const SearchBar = ({ onSelectDrug }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const justSelectedRef = useRef(false);

    useEffect(() => {
        // Skip search if we just selected a drug
        if (justSelectedRef.current) {
            justSelectedRef.current = false;
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            if (query.length > 2) {
                setLoading(true);
                try {
                    const results = await searchDrugs(query);
                    setSuggestions(results);
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            } else {
                setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSelect = (drug) => {
        justSelectedRef.current = true;
        setQuery(drug.name);
        setSuggestions([]);
        onSelectDrug(drug);
    };

    return (
        <div className="search-bar-container">
            <div className="search-bar">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter drug name (e.g., AMOXICILLIN)"
                />
                <button disabled={loading}>
                    {loading ? '...' : <i className="fas fa-search"></i>} Search
                </button>
            </div>
            {suggestions.length > 0 && (
                <ul className="suggestions-list">
                    {suggestions.map((drug) => (
                        <li key={drug.ndc} onClick={() => handleSelect(drug)}>
                            <div className="suggestion-info">
                                <strong>{drug.name}</strong> <span className="suggestion-manufacturer">({drug.manufacturer})</span>
                                <span>{drug.strength} - {drug.dosageForm} (NDC: {drug.ndc})</span>
                            </div>
                            <div className="suggestion-action">
                                <span>View Details</span>
                                <i className="fas fa-chevron-right"></i>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchBar;

import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v2/drugs', // Proxy will handle the domain
    headers: {
        'Content-Type': 'application/json',
    },
});

export const searchDrugs = async (query) => {
    try {
        const response = await api.get('/search', { params: { q: query } });
        return response.data;
    } catch (error) {
        console.error('Error searching drugs:', error);
        throw error;
    }
};

export const getDrugSummary = async (ndc) => {
    try {
        const response = await api.get(`/${ndc}/summary`);
        return response.data;
    } catch (error) {
        console.error('Error getting drug summary:', error);
        throw error;
    }
};

export const getDrugPrices = async (ndc, states = []) => {
    try {
        const params = {};
        if (states.length > 0) {
            params.states = states.join(',');
        }
        const response = await api.get(`/${ndc}/prices`, { params });
        return response.data;
    } catch (error) {
        console.error('Error getting drug prices:', error);
        throw error;
    }
};

export const getExpensiveMedications = async () => {
    try {
        const response = await api.get('/expensive');
        return response.data;
    } catch (error) {
        console.error('Error getting expensive medications:', error);
        throw error;
    }
};

export const getCheapMedications = async () => {
    try {
        const response = await api.get('/cheap');
        return response.data;
    } catch (error) {
        console.error('Error getting cheap medications:', error);
        throw error;
    }
};

export default api;

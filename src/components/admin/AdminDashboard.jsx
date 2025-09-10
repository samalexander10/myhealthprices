import React, { useEffect, useState } from 'react';
import { Button, Container, Grid, Paper, Typography } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ drugsCount: 0, cachedCount: 0, logsCount: 0 });
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchStats = () => {
    axios.get('/api/admin/stats', { withCredentials: true }).then(res => setStats(res.data)).catch(() => {});
  };

  useEffect(() => {
    fetchStats();
    const t = setInterval(fetchStats, 5000);
    return () => clearInterval(t);
  }, []);

  const triggerImport = async () => {
    setLoading(true);
    try {
      await axios.post('/api/admin/import', {}, { withCredentials: true });
    } catch (e) {}
    setLoading(false);
    fetchStats();
  };

  const clearData = async () => {
    setClearing(true);
    try {
      await axios.post('/api/admin/clear', {}, { withCredentials: true });
    } catch (e) {}
    setClearing(false);
    fetchStats();
  };

  return (
    <Container maxWidth="md" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h4">Admin Dashboard</Typography>
        </Grid>
        <Grid item xs={12}>
          <Paper style={{ padding: 16 }}>
            <Typography variant="subtitle1">Signed in as {user?.email}</Typography>
            <Button onClick={logout} variant="outlined" size="small" style={{ marginTop: 8 }}>Logout</Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper style={{ padding: 16 }}>
            <Typography variant="h6">Drugs</Typography>
            <Typography variant="h4">{stats.drugsCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper style={{ padding: 16 }}>
            <Typography variant="h6">Cached</Typography>
            <Typography variant="h4">{stats.cachedCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper style={{ padding: 16 }}>
            <Typography variant="h6">Logs</Typography>
            <Typography variant="h4">{stats.logsCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper style={{ padding: 16, display: 'flex', gap: 12 }}>
            <Button variant="contained" onClick={triggerImport} disabled={loading}>Import CSV Data</Button>
            <Button variant="outlined" onClick={clearData} disabled={clearing}>Clear Data</Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

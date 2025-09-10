import React from 'react';
import { Button, Container, Paper, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  return (
    <Container maxWidth="sm" style={{ paddingTop: 64 }}>
      <Paper style={{ padding: 24, textAlign: 'center' }}>
        <Typography variant="h5">Admin Login</Typography>
        <Button variant="contained" style={{ marginTop: 16 }} onClick={login}>Sign in with Google</Button>
      </Paper>
    </Container>
  );
}

import React from 'react';
import { Button, Container, Paper, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export default function AccessDenied() {
  return (
    <Container maxWidth="sm" style={{ paddingTop: 64 }}>
      <Paper style={{ padding: 24, textAlign: 'center' }}>
        <Typography variant="h5">Access Denied</Typography>
        <Typography variant="body1" style={{ marginTop: 8 }}>You do not have permission to access this page.</Typography>
        <Button variant="outlined" style={{ marginTop: 16 }} component={Link} to="/">Go Home</Button>
      </Paper>
    </Container>
  );
}

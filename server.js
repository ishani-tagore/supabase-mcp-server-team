const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'Supabase API Wrapper Running',
    available_endpoints: [
      'GET /tables - List available operations',
      'GET /query/:table - Query a table with filters',
      'POST /query - Custom query with parameters'
    ]
  });
});

// List tables info
app.get('/tables', async (req, res) => {
  try {
    res.json({
      message: "Database query interface ready",
      usage: {
        "Query a table": "GET /query/table_name?limit=10&column=value",
        "Custom query": "POST /query with {table, select, filters, limit}"
      },
      examples: [
        "/query/users?limit=5",
        "/query/orders?status=completed&limit=10"
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Query a specific table
app.get('/query/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { limit = 10, select = '*', ...filters } = req.query;
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        error: 'Supabase credentials not configured',
        need: ['SUPABASE_URL', 'SUPABASE_ANON_KEY']
      });
    }
    
    // Build PostgREST query
    let url = `${supabaseUrl}/rest/v1/${table}?select=${select}&limit=${limit}`;
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== 'select' && key !== 'limit') {
        url += `&${key}=eq.${value}`;
      }
    });
    
    const response = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    res.json({
      table,
      query_used: url,
      count: data.length,
      data
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      table: req.params.table 
    });
  }
});

// Custom query endpoint
app.post('/query', async (req, res) => {
  try {
    const { table, select = '*', filters = {}, limit = 10 } = req.body;
    
    if (!table) {
      return res.status(400).json({ 
        error: 'Table name is required',
        example: { table: 'users', select: 'id,name', filters: { status: 'active' }, limit: 5 }
      });
    }
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        error: 'Supabase credentials not configured' 
      });
    }
    
    let url = `${supabaseUrl}/rest/v1/${table}?select=${select}&limit=${limit}`;
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      url += `&${key}=eq.${value}`;
    });
    
    const response = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    res.json({
      table,
      query: { select, filters, limit },
      count: data.length,
      data
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Supabase API wrapper running on port ${port}`);
});
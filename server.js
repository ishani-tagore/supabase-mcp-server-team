const express = require('express');
const { spawn } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/mcp', (req, res) => {
  const mcpProcess = spawn('npx', [
    '@supabase/mcp-server-supabase@latest',
    '--read-only',
    `--project-ref=${process.env.SUPABASE_PROJECT_REF}`
  ], {
    env: {
      ...process.env,
      SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN
    }
  });
  
  // Handle MCP communication
  mcpProcess.stdin.write(JSON.stringify(req.body));
  mcpProcess.stdin.end();
  
  let response = '';
  mcpProcess.stdout.on('data', (data) => {
    response += data.toString();
  });
  
  mcpProcess.stderr.on('data', (data) => {
    console.error('MCP Error:', data.toString());
  });
  
  mcpProcess.on('close', (code) => {
    try {
      res.json(JSON.parse(response));
    } catch (error) {
      res.status(500).json({ error: 'Failed to parse MCP response' });
    }
  });
});

app.get('/', (req, res) => {
  res.json({ status: 'Supabase MCP Server Running', port: port });
});

app.listen(port, () => {
  console.log(`MCP server running on port ${port}`);
});
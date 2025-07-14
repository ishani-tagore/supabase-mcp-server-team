const express = require('express');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Supabase MCP Server Running', 
    port: port,
    endpoints: {
      health: '/',
      mcp: '/mcp'
    }
  });
});

// MCP endpoint
app.post('/mcp', async (req, res) => {
  try {
    // This is a simplified MCP response
    // You'll need the full MCP protocol implementation here
    const { method, params } = req.body;
    
    if (method === 'initialize') {
      res.json({
        jsonrpc: '2.0',
        id: req.body.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'supabase-mcp-server',
            version: '1.0.0'
          }
        }
      });
    } else {
      res.status(501).json({
        jsonrpc: '2.0',
        id: req.body.id,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body.id || null,
      error: {
        code: -32000,
        message: error.message
      }
    });
  }
});

app.listen(port, () => {
  console.log(`MCP server running on port ${port}`);
});

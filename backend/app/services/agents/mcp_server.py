import json
import sys
import asyncio
import logging
from typing import Dict, Any
from app.services.agents.tools import TOOL_REGISTRY

logger = logging.getLogger(__name__)

class MCPServer:
    def __init__(self, name: str = "paperlens-research-tools"):
        self.name = name

    def list_tools(self) -> list[Dict[str, Any]]:
        return [
            {
                "name": name,
                "description": meta["description"],
                "parameters": {
                    "type": "object",
                    "properties": {
                        "domain": {"type": "string"},
                        "topic": {"type": "string"},
                        "text": {"type": "string"},
                        "gap_summary": {"type": "string"},
                        "limit": {"type": "integer", "default": 30},
                    }
                }
            }
            for name, meta in TOOL_REGISTRY.items()
        ]

    async def call_tool(self, name: str, arguments: dict) -> Dict[str, Any]:
        if name not in TOOL_REGISTRY:
            raise ValueError(f"Unknown tool: {name}")
        fn = TOOL_REGISTRY[name]["fn"]
        if asyncio.iscoroutinefunction(fn):
            return await fn(**arguments)
        else:
            return fn(**arguments)

    async def handle_rpc_request(self, request: dict) -> dict:
        method = request.get("method")
        req_id = request.get("id")

        if method == "tools/list":
            return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": self.list_tools()}}
        elif method == "tools/call":
            params = request.get("params", {})
            tool_name = params.get("name")
            args = params.get("arguments", {})
            try:
                result = await self.call_tool(tool_name, args)
                return {"jsonrpc": "2.0", "id": req_id, "result": {"content": [{"type": "text", "text": json.dumps(result)}]}}
            except Exception as e:
                return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32603, "message": str(e)}}
        else:
            return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": "Method not found"}}


mcp_server = MCPServer()

async def run_stdio():
    """Stdio entrypoint for MCP clients."""
    reader = asyncio.StreamReader()
    protocol = asyncio.StreamReaderProtocol(reader)
    await asyncio.get_event_loop().connect_read_pipe(lambda: protocol, sys.stdin)

    while True:
        line = await reader.readline()
        if not line:
            break
        try:
            req = json.loads(line.decode("utf-8"))
            resp = await mcp_server.handle_rpc_request(req)
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()
        except Exception as e:
            logger.error("Error processing MCP stdio message: %s", e)

if __name__ == "__main__":
    asyncio.run(run_stdio())

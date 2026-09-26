"""Real-time connection manager for WebSockets and async event queues."""

import asyncio
import logging
from typing import Dict, Set, Any
from fastapi import WebSocket

logger = logging.getLogger("holmes.api.connection_manager")


class ConnectionManager:
    """Manages active WebSocket connections and in-memory event distribution queues per case."""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.case_queues: Dict[str, asyncio.Queue] = {}
        self.broadcaster_tasks: Dict[str, asyncio.Task] = {}

    def get_or_create_queue(self, case_id: str) -> asyncio.Queue:
        """Retrieve existing or initialize a new asyncio.Queue for a given case_id."""
        if case_id not in self.case_queues:
            queue: asyncio.Queue = asyncio.Queue()
            self.case_queues[case_id] = queue
            task = asyncio.create_task(self._broadcaster(case_id, queue))
            self.broadcaster_tasks[case_id] = task
        return self.case_queues[case_id]

    async def _broadcaster(self, case_id: str, queue: asyncio.Queue):
        """Continuously pop events from queue and broadcast to all connected WebSocket clients."""
        try:
            while True:
                event_payload = await queue.get()
                await self.broadcast(case_id, event_payload)
                queue.task_done()
        except asyncio.CancelledError:
            logger.debug(f"Broadcaster task cancelled for case {case_id}")
        except Exception as e:
            logger.exception(f"Unexpected error in broadcaster for case {case_id}: {e}")

    async def connect(self, case_id: str, websocket: WebSocket):
        """Register and accept a new WebSocket client for a case."""
        await websocket.accept()
        if case_id not in self.active_connections:
            self.active_connections[case_id] = set()
        self.active_connections[case_id].add(websocket)
        logger.info(f"WebSocket client connected to case {case_id} (Total: {len(self.active_connections[case_id])})")

    def disconnect(self, case_id: str, websocket: WebSocket):
        """Remove a disconnected WebSocket client."""
        if case_id in self.active_connections:
            self.active_connections[case_id].discard(websocket)
            logger.info(f"WebSocket client disconnected from case {case_id}")
            if not self.active_connections[case_id]:
                del self.active_connections[case_id]

    async def broadcast(self, case_id: str, message: Dict[str, Any]):
        """Send JSON payload to all active WebSockets subscribed to the case."""
        if case_id not in self.active_connections:
            return

        dead_connections = set()
        for connection in list(self.active_connections[case_id]):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send to client on case {case_id}: {e}")
                dead_connections.add(connection)

        for dead in dead_connections:
            self.active_connections[case_id].discard(dead)


# Global singleton manager instance
manager = ConnectionManager()

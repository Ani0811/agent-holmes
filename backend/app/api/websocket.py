"""WebSocket router streaming real-time investigation events to connected clients."""

import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlmodel import Session, select

from app.database import engine
from app.models import InvestigationEvent
from app.api.connection_manager import manager

logger = logging.getLogger("holmes.api.websocket")

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/cases/{case_id}")
async def case_investigation_stream(websocket: WebSocket, case_id: str):
    """Real-time investigation event stream.

    Replays historic events on initial connection, then streams live events
    as Agent Holmes advances through the investigation pipeline.
    """
    await manager.connect(case_id, websocket)

    try:
        # 1. Replay historical events from database so late/reconnecting clients get the complete audit log
        with Session(engine) as session:
            query = (
                select(InvestigationEvent)
                .where(InvestigationEvent.case_id == case_id)
                .order_by(InvestigationEvent.id)
            )
            stored_events = list(session.exec(query).all())

            for ev in stored_events:
                parsed_data = json.loads(ev.data) if isinstance(ev.data, str) else (ev.data or None)
                payload = {
                    "id": ev.id,
                    "case_id": ev.case_id,
                    "event_type": ev.event_type,
                    "message": ev.message,
                    "data": parsed_data,
                    "timestamp": ev.timestamp.isoformat(),
                    "is_replay": True,
                }
                await websocket.send_json(payload)

        # 2. Keep connection open for incoming messages (e.g. ping/pong) while live events stream from manager
        while True:
            client_msg = await websocket.receive_text()
            try:
                data = json.loads(client_msg)
                if data.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except Exception:
                pass

    except WebSocketDisconnect:
        manager.disconnect(case_id, websocket)
    except Exception as e:
        logger.warning(f"WebSocket connection exception for case {case_id}: {e}")
        manager.disconnect(case_id, websocket)

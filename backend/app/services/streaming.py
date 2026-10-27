from __future__ import annotations

from collections.abc import AsyncGenerator

from fastapi import WebSocket


class SocketRegistry:
    def __init__(self) -> None:
        self.connections: dict[str, set[WebSocket]] = {}

    async def connect(self, patient_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections.setdefault(patient_id, set()).add(websocket)

    def disconnect(self, patient_id: str, websocket: WebSocket) -> None:
        sockets = self.connections.get(patient_id, set())
        sockets.discard(websocket)
        if not sockets:
            self.connections.pop(patient_id, None)

    async def broadcast(self, patient_id: str, payload: dict) -> None:
        for websocket in list(self.connections.get(patient_id, set())):
            try:
                await websocket.send_json(payload)
            except Exception:
                self.disconnect(patient_id, websocket)


socket_registry = SocketRegistry()

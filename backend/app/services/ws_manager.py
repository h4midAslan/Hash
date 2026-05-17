from fastapi import WebSocket
from typing import Dict


class ConnectionManager:
    def __init__(self):
        self.connections: Dict[int, WebSocket] = {}

    async def connect(self, user_id: int, ws: WebSocket):
        await ws.accept()
        old = self.connections.get(user_id)
        if old:
            try:
                await old.close()
            except Exception:
                pass
        self.connections[user_id] = ws

    def disconnect(self, user_id: int):
        self.connections.pop(user_id, None)

    async def send(self, user_id: int, data: dict):
        ws = self.connections.get(user_id)
        if ws:
            try:
                await ws.send_json(data)
            except Exception:
                self.connections.pop(user_id, None)

    def is_online(self, user_id: int) -> bool:
        return user_id in self.connections


manager = ConnectionManager()

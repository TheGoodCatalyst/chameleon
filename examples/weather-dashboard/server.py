"""
Chameleon MCP Server - Example Python Implementation

Demonstrates how to create an MCP server that returns View components
"""

import asyncio
import json
from typing import Any, Dict, List
from datetime import datetime

# Simulated MCP server (you'd use the actual MCP Python SDK)


class ChameleonMCPServer:
    """Example MCP Server with Chameleon View support"""

    def __init__(self):
        self.tools = {
            "get_weather": self.get_weather,
            "analyze_data": self.analyze_data,
            "create_task": self.create_task,
        }

    async def get_weather(self, location: str) -> Dict[str, Any]:
        """
        Get weather information and return as a gauge + card view
        """
        # Simulate fetching weather data
        await asyncio.sleep(0.5)
        
        temperature = 22
        forecast = [
            {"day": "Mon", "temp": 21, "condition": "Sunny"},
            {"day": "Tue", "temp": 23, "condition": "Cloudy"},
            {"day": "Wed", "temp": 19, "condition": "Rainy"},
        ]

        return {
            "content": [
                {
                    "type": "text",
                    "text": f"Weather forecast for {location}",
                },
                {
                    "type": "component",
                    "component_name": "gauge",
                    "data": {
                        "value": temperature,
                        "min": -20,
                        "max": 50,
                        "unit": "°C",
                        "label": "Current Temperature",
                        "thresholds": [
                            {"value": 0, "color": "#3b82f6", "label": "Cold"},
                            {"value": 15, "color": "#10b981", "label": "Mild"},
                            {"value": 25, "color": "#f59e0b", "label": "Warm"},
                            {"value": 35, "color": "#ef4444", "label": "Hot"},
                        ],
                        "display_mode": "arc",
                    },
                    "interactive": False,
                    "layer": "focus",
                },
                {
                    "type": "component",
                    "component_name": "card",
                    "data": {
                        "title": "3-Day Forecast",
                        "content": f"{forecast[0]['day']}: {forecast[0]['temp']}°C ({forecast[0]['condition']})\n"
                                   f"{forecast[1]['day']}: {forecast[1]['temp']}°C ({forecast[1]['condition']})\n"
                                   f"{forecast[2]['day']}: {forecast[2]['temp']}°C ({forecast[2]['condition']})",
                    },
                    "layer": "focus",
                },
            ]
        }

    async def analyze_data(self, query: str) -> Dict[str, Any]:
        """
        Analyze data and return as a streaming chart
        """
        stream_id = f"analysis-{datetime.now().timestamp()}"

        # Send initial skeleton
        yield {
            "event": "ui_delta",
            "data": {
                "layer": "focus",
                "component": {
                    "type": "component",
                    "component_name": "chart",
                    "data": {
                        "chart_type": "line",
                        "data": {
                            "labels": [],
                            "datasets": [{"label": "Sales", "data": [], "color": "#6366f1"}],
                        },
                        "options": {"title": "Sales Analysis", "animations": True},
                    },
                    "stream_id": stream_id,
                    "layer": "focus",
                },
            },
        }

        # Simulate streaming data points
        labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
        data = [10, 20, 15, 35, 40, 38]

        for i, (label, value) in enumerate(zip(labels, data)):
            await asyncio.sleep(0.3)

            yield {
                "event": "ui_delta",
                "data": {
                    "delta": {
                        "target_id": stream_id,
                        "operation": "update",
                        "payload": {
                            "data": {
                                "labels": labels[: i + 1],
                                "datasets": [
                                    {
                                        "label": "Sales",
                                        "data": data[: i + 1],
                                        "color": "#6366f1",
                                        "fill": True,
                                    }
                                ],
                            }
                        },
                        "timestamp": int(datetime.now().timestamp() * 1000),
                    }
                },
            }

        # Check for anomaly
        if max(data) > 35:
            yield {
                "event": "blocker",
                "data": {
                    "requires": "clarification",
                    "message": "Anomaly detected: Sales spike in May. How would you like to proceed?",
                    "actions": [
                        {"id": "investigate", "label": "Investigate", "type": "primary"},
                        {"id": "ignore", "label": "Ignore", "type": "secondary"},
                    ],
                },
            }

    async def create_task(self) -> Dict[str, Any]:
        """
        Create a task by showing a dynamic form
        """
        return {
            "content": [
                {
                    "type": "text",
                    "text": "Let's create a new task. Please fill out the details:",
                },
                {
                    "type": "component",
                    "component_name": "form",
                    "data": {
                        "title": "New Task",
                        "description": "Create a new task for your team",
                        "fields": [
                            {
                                "id": "title",
                                "label": "Task Title",
                                "type": "text",
                                "placeholder": "Enter task title",
                                "required": True,
                            },
                            {
                                "id": "description",
                                "label": "Description",
                                "type": "textarea",
                                "placeholder": "Describe the task",
                            },
                            {
                                "id": "priority",
                                "label": "Priority",
                                "type": "select",
                                "required": True,
                                "options": [
                                    {"value": "low", "label": "Low"},
                                    {"value": "medium", "label": "Medium"},
                                    {"value": "high", "label": "High"},
                                    {"value": "critical", "label": "Critical"},
                                ],
                            },
                            {
                                "id": "due_date",
                                "label": "Due Date",
                                "type": "date",
                                "required": True,
                            },
                        ],
                        "submit_label": "Create Task",
                        "cancel_label": "Cancel",
                    },
                    "interactive": True,
                    "layer": "focus",
                },
            ]
        }


# WebSocket Server Example
async def handle_websocket(websocket, path):
    """Handle WebSocket connections from Chameleon client"""
    server = ChameleonMCPServer()

    try:
        async for message in websocket:
            data = json.loads(message)
            event_type = data.get("event")

            if event_type == "interaction":
                # Handle user interaction
                interaction = data.get("data")
                component_id = interaction.get("component_id")
                event_type = interaction.get("event_type")
                payload = interaction.get("payload")

                print(f"Received interaction: {component_id} - {event_type}")
                print(f"Payload: {payload}")

                # Send response
                if event_type == "submit" and component_id == "form":
                    response = {
                        "event": "ui_delta",
                        "data": {
                            "layer": "focus",
                            "component": {
                                "type": "component",
                                "component_name": "card",
                                "data": {
                                    "title": "Task Created!",
                                    "content": f"Successfully created task: {payload.get('title')}",
                                },
                            },
                        },
                    }
                    await websocket.send(json.dumps(response))

    except Exception as e:
        print(f"WebSocket error: {e}")


# Example usage
if __name__ == "__main__":
    print("Chameleon MCP Server Example")
    print("\nAvailable tools:")
    print("1. get_weather(location: str) -> Returns gauge + card view")
    print("2. analyze_data(query: str) -> Returns streaming chart")
    print("3. create_task() -> Returns dynamic form")

    # To run the WebSocket server:
    # import websockets
    # async def main():
    #     async with websockets.serve(handle_websocket, "localhost", 3000):
    #         await asyncio.Future()  # run forever
    #
    # asyncio.run(main())

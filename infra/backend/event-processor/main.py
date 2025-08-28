
import json
import logging
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncpg
import aio_pika


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)


DATABASE_URL = 'postgresql://user:password@postgres:5432/smolhog_analytics'
RABBITMQ_URL = 'amqp://guest:guest@rabbitmq:5672/'

class Event(BaseModel):
    event_id: str
    event_name: str
    user_id: str
    properties: Dict[str, Any] = {}
    timestamp: str
    session_id: Optional[str] = None
    
class EventBatch(BaseModel):
    events: List[Event]

@app.get("/")
async def root():
    return {"message": "SmolHog Event Processor", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Event Processor is running"}

@app.post("/events")
async def receive_events(
    event_batch: EventBatch,
    background_tasks: BackgroundTasks,
) -> Dict[str, Any]:
    logger.info(f"Received {len(event_batch.events)} events")
    
    
    background_tasks.add_task(queue_events, event_batch.events)
    
    return {
        "status": "success",
        "events_received": len(event_batch.events),
        "message": "Events queued for processing"
    }

@app.get('/analytics/stats')
async def get_stats() -> Dict[str, Any]:
    try:
        logger.info("Fetching analytics stats")
        conn = await asyncpg.connect(DATABASE_URL)
        
        total_events = await conn.fetchval("SELECT COUNT(*) FROM events")
        unique_users = await conn.fetchval("SELECT COUNT(DISTINCT user_id) FROM events")
        
        top_events = await conn.fetch(
            """
            SELECT event_name, COUNT(*) as event_count
            FROM events
            GROUP BY event_name
            ORDER BY event_count DESC
            LIMIT 10
            """
        )
        
        await conn.close()
        
        return {
            "total_events": total_events or 0,
            "unique_users": unique_users or 0,
            "top_events": [{"event": row['event_name'], "count": row['event_count']} for row in top_events]
        }
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get('/analytics/events')
async def get_recent_events(limit: int = 100) -> Dict[str, Any]:
    try:
        logger.info(f"Fetching {limit} recent events")
        conn = await asyncpg.connect(DATABASE_URL)
        
        events = await conn.fetch("""
            SELECT event_name, user_id, properties, timestamp, session_id
            FROM events 
            ORDER BY timestamp DESC 
            LIMIT $1
        """, limit)
        
        await conn.close()
        
        processed_events = []
        for row in events:
            processed_event = {
                "event_name": row['event_name'],
                "user_id": row['user_id'],
                "properties": json.loads(row['properties']) if isinstance(row['properties'], str) else row['properties'],
                "timestamp": row['timestamp'],
                "session_id": row['session_id']
            }
            processed_events.append(processed_event)
        return {
            "events": processed_events
        }
    except Exception as e:
        logger.error(f"Error getting events: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def queue_events(events: List[Event]):
    try:
        logger.info(f"Queuing {len(events)} events to RabbitMQ")
        conn = await aio_pika.connect_robust(RABBITMQ_URL)
        chan = await conn.channel()
        queue = await chan.declare_queue('events', durable=True)
        
        for event in events:
            message = aio_pika.Message(
                json.dumps(event.dict()).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT
            )
            await chan.default_exchange.publish(message, routing_key="events")
        
        await conn.close()
        logger.info(f"Successfully queued {len(events)} events")
        
    except Exception as e:
        logger.error(f"Error queuing events: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
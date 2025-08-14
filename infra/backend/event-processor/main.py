import json
import logging
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import asyncpg
import aio_pika

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

DATABASE_URL = 'postgresql://user:password@localhost:5432/smolhog_analytics'
RABBITMQ_URL = 'amqp://user:password@localhost:5672/'

class Event(BaseModel):
    event_id: str
    event_name: str
    user_id: str
    properties: Dict[str, Any] = {}
    timestamp: str
    session_id: Optional[str] = None
    
class EventBatch(BaseModel):
    events: List[Event]


'''
Receives, queues and processes events
'''
@app.post("/events")
async def recieve_events(
    event_batch: EventBatch,
    background_tasks: BackgroundTasks
    ) -> Dict[str, Any]:
    background_tasks.add_task(queue_events, event_batch.events)
    return {
        "status": "success",
        "events_received": len(event_batch.events),
    }


@app.get('/analytics/stats')
async def get_stats()->Dict[str, Any]:
    try:
        logger.info("Attempting to connect to PostgreSQL database")
        conn = await asyncpg.connect(DATABASE_URL)
        logger.info("Successfully connected to PostgreSQL database")
        
        total_events = await conn.fetchval("SELECT COUNT(*) FROM events")
        unique_users = await conn.fetchval("SELECT COUNT(DISTINCT user_id) FROM events")
        
        top_events = await conn.fetchval(
            """
            SELECT event_name, COUNT(*) as event_count
            FROM events
            GROUP BY event_name
            ORDER BY event_count DESC
            LIMIT 10
            """
        )
        
        await conn.close()
        logger.info("PostgreSQL connection closed")
        return {
            "total_events": total_events,
            "unique_users": unique_users,
            "top_events": [{"event": row['event_name'], "count": row['event_count']} for row in top_events]
        }
    except Exception as e:
        logger.error(f"Failed to connect to PostgreSQL or execute query: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get('/analytics/events')
async def get_recent_events(limit:int =100)->Dict[str, Any]:
    try:
        logger.info("Attempting to connect to PostgreSQL database")
        conn = await asyncpg.connect(DATABASE_URL)
        logger.info("Successfully connected to PostgreSQL database")
        
        events = await conn.fetch("""
            SELECT event_name, user_id, properties, timestamp, session_id
            FROM events 
            ORDER BY timestamp DESC 
            LIMIT $1
        """, limit)
        
        await conn.close()
        logger.info("PostgreSQL connection closed")
        return {
            "events": [
                {
                    "event_name": row['event_name'],
                    "user_id": row['user_id'],
                    "properties": row['properties'],
                    "timestamp": row['timestamp'],
                    "session_id": row['session_id']
                }
                for row in events
            ]
        }
    except Exception as e:
        logger.error(f"Failed to connect to PostgreSQL or execute query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def queue_events(events: List[Event]):
    try:
        logger.info("Attempting to connect to RabbitMQ")
        conn = await aio_pika.connect_robust(RABBITMQ_URL)
        logger.info("Successfully connected to RabbitMQ")
        
        chan = await conn.channel()
        queue= await chan.declare_queue('events', durable=True)
        logger.info(f"Queuing {len(events)} events to RabbitMQ")
        
        for event in events:
            message = aio_pika.Message(
                json.dumps(event.dict()).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT
            )
            await chan.default_exchange.publish(message, routing_key="events")
        
        await conn.close()
        logger.info("RabbitMQ connection closed")
    except Exception as e:
        logger.error(f"Error connecting to RabbitMQ or queuing events: {e}")



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
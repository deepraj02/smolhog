import asyncio
import json
import asyncpg
import aio_pika
from aio_pika.abc import AbstractIncomingMessage 
from datetime import datetime

DATABASE_URL = "postgresql://user:password@postgres:5432/analytics"
RABBITMQ_URL = "amqp://guest:guest@rabbitmq:5672/"

async def process_events():
    
    conn = await aio_pika.connect_robust(RABBITMQ_URL)
    chan = await conn.channel()
    queue = await chan.declare_queue("events", durable=True)

    db_conn = await asyncpg.connect(DATABASE_URL)
    
    async def handle_message(message: AbstractIncomingMessage) -> None:  
        async with message.process():
            try:
                event_data = json.loads(message.body.decode())
                
                await db_conn.execute("""
                    INSERT INTO events (event_id, event_name, user_id, properties, timestamp, session_id)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (event_id) DO NOTHING
                """, 
                    event_data['event_id'],
                    event_data['event_name'],
                    event_data['user_id'],
                    json.dumps(event_data['properties']),
                    datetime.fromisoformat(event_data['timestamp'].replace('Z', '+00:00')),
                    event_data.get('session_id')
                )
                
                print(f"Processed event: {event_data['event_name']}")
                
            except Exception as e:
                print(f"Error processing event: {e}")
                raise

    await queue.consume(handle_message)
    print("Worker started, waiting for events...")
    
    try:
        await asyncio.Future() 
    finally:
        await db_conn.close()
        await conn.close()

if __name__ == "__main__":
    asyncio.run(process_events())

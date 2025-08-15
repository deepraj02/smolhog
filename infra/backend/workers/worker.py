import asyncio
import json
import asyncpg
import aio_pika
from aio_pika.abc import AbstractIncomingMessage 
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = "postgresql://user:password@postgres:5432/smolhog_analytics"
RABBITMQ_URL = "amqp://guest:guest@rabbitmq:5672/"

async def process_events():
    logger.info("Worker starting...")
    
    try:

        logger.info("Connecting to RabbitMQ...")
        conn = await aio_pika.connect_robust(RABBITMQ_URL)
        chan = await conn.channel()
        queue = await chan.declare_queue("events", durable=True)
        logger.info("Connected to RabbitMQ successfully")
        

        logger.info("Connecting to PostgreSQL...")
        db_conn = await asyncpg.connect(DATABASE_URL)
        logger.info("Connected to PostgreSQL successfully")
        
        async def handle_message(message: AbstractIncomingMessage) -> None:  
            async with message.process():
                try:
                    event_data = json.loads(message.body.decode())
                    logger.info(f"Processing event: {event_data['event_name']}")
                    
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
                    
                    logger.info(f"Successfully processed event: {event_data['event_name']}")
                    
                except Exception as e:
                    logger.error(f"Error processing event: {e}")
                    raise
        

        await queue.consume(handle_message)
        logger.info("Worker started successfully, waiting for events...")
        
        try:
            await asyncio.Future()
        finally:
            await db_conn.close()
            await conn.close()
            
    except Exception as e:
        logger.error(f"Worker failed to start: {e}")
        await asyncio.sleep(5)
        raise

if __name__ == "__main__":
    while True:
        try:
            asyncio.run(process_events())
        except Exception as e:
            logger.error(f"Worker crashed: {e}")
            logger.info("Restarting worker in 5 seconds...")
            asyncio.run(asyncio.sleep(5))

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# Get the database URL from .env
DATABASE_URL = os.getenv("DATABASE_URL")

# Create the engine — this is the connection to PostgreSQL
engine = create_engine(DATABASE_URL)

# Each database operation happens in a session
SessionLocal = sessionmaker(bind=engine)

# Base class that all our table models will inherit from
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
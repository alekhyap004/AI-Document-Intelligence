from src.backend.database import engine, Base
from src.backend.models import Conversation, Message

def init_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

if __name__ == "__main__":
    init_db()
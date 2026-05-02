from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from database import Base

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    region = Column(String(100))
    travel_style = Column(String(100))
    start_time = Column(String(100))
    end_time = Column(String(100))
    result_json = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
"""
Database Initialization Script
Run this to create all database tables
"""

from app import app, db

def init_database():
    with app.app_context():
        # Create all tables
        db.create_all()
        print("✓ Database tables created successfully!")
        
        # Print table names
        print("\nCreated tables:")
        for table in db.metadata.sorted_tables:
            print(f"  - {table.name}")

if __name__ == '__main__':
    init_database()

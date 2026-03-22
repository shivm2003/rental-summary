import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

OUTPUT_FILE = f"{DB_NAME}_tables_structure.txt"

try:
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT
    )

    cursor = conn.cursor()

    # Get all tables (excluding system tables)
    cursor.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)

    tables = cursor.fetchall()

    with open(OUTPUT_FILE, "w", encoding="utf-8") as file:

        for table in tables:
            table_name = table[0]

            file.write(f"\nTable: {table_name}\n")
            file.write("-" * 50 + "\n")

            cursor.execute("""
                SELECT column_name, data_type, character_maximum_length
                FROM information_schema.columns
                WHERE table_name = %s
                ORDER BY ordinal_position;
            """, (table_name,))

            columns = cursor.fetchall()

            for col in columns:
                column_name = col[0]
                data_type = col[1]
                length = col[2]

                if length:
                    file.write(f"{column_name} : {data_type}({length})\n")
                else:
                    file.write(f"{column_name} : {data_type}\n")

    print(f"✅ Table names and attributes exported to {OUTPUT_FILE}")

except Exception as e:
    print("❌ Error:", e)

finally:
    if 'conn' in locals():
        cursor.close()
        conn.close()
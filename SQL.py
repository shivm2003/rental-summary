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

            file.write(f"\n{'='*60}\n")
            file.write(f"Table: {table_name}\n")
            file.write(f"{'='*60}\n")

            # Get column information
            cursor.execute("""
                SELECT column_name, data_type, character_maximum_length
                FROM information_schema.columns
                WHERE table_name = %s
                ORDER BY ordinal_position;
            """, (table_name,))

            columns = cursor.fetchall()
            column_names = [col[0] for col in columns]

            file.write(f"\n--- Structure ---\n")
            for col in columns:
                column_name = col[0]
                data_type = col[1]
                length = col[2]

                if length:
                    file.write(f"{column_name} : {data_type}({length})\n")
                else:
                    file.write(f"{column_name} : {data_type}\n")

            # Get ALL data from table
            file.write(f"\n--- All Data ---\n")

            try:
                cursor.execute(f"""
                    SELECT * FROM "{table_name}";
                """)

                rows = cursor.fetchall()

                if rows:
                    # Print header
                    file.write(" | ".join(column_names) + "\n")
                    file.write("-" * 50 + "\n")

                    # Print all rows
                    for row in rows:
                        row_values = [str(val) if val is not None else "NULL" for val in row]
                        file.write(" | ".join(row_values) + "\n")

                    file.write(f"\nTotal rows: {len(rows)}\n")
                else:
                    file.write("(No data in table)\n")

            except Exception as table_error:
                file.write(f"(Error fetching data: {table_error})\n")

            file.write("\n")

    print(f"✅ Table structure and ALL data exported to {OUTPUT_FILE}")

except Exception as e:
    print("❌ Error:", e)

finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
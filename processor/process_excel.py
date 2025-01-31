import sys
import os
import pandas as pd
import psycopg2

# Force UTF-8
sys.stdout.reconfigure(encoding="utf-8")

DB_CONFIG = {
    "dbname": "pricelab",
    "user": "myuser",
    "password": "ktkr8658",
    "host": "localhost",
    "port": "5432"
}

def process_excel(file_path, mode="refresh"):
    try:
        if not os.path.exists(file_path):
            print(f"❌ Error: File {file_path} not found!")
            sys.stdout.flush()
            return

        print(f"📖 Opening Excel file: {file_path} ...")
        sys.stdout.flush()

        reader = pd.read_excel(file_path, sheet_name=None, dtype=str)

        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        for sheet_name, df in reader.items():
            print(f"🔄 Processing sheet: {sheet_name} with {len(df)} rows")
            sys.stdout.flush()

            df = df.fillna("")
            df.columns = [col.lower().replace(" ", "_") for col in df.columns]

            # Check if table exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                      AND table_name = %s
                );
            """, (sheet_name,))
            table_exists = cursor.fetchone()[0]

            if table_exists and mode == "refresh":
                truncate_sql = f'TRUNCATE TABLE "{sheet_name}"'
                cursor.execute(truncate_sql)
                print(f"✔ Table {sheet_name} truncated.")
            else:
                # Drop & Create fresh
                cursor.execute(f'DROP TABLE IF EXISTS "{sheet_name}"')
                col_defs = ", ".join([f'{c} TEXT' for c in df.columns])
                cursor.execute(f'CREATE TABLE "{sheet_name}" ({col_defs})')
                print(f"✔ Table {sheet_name} created.")

            # Insert rows
            chunksize = 5000
            total_rows_inserted = 0
            for start in range(0, len(df), chunksize):
                chunk_data = df.iloc[start : start+chunksize].to_dict(orient="records")
                for row in chunk_data:
                    placeholders = ", ".join(["%s"] * len(row))
                    insert_sql = f'INSERT INTO "{sheet_name}" VALUES ({placeholders})'
                    cursor.execute(insert_sql, list(row.values()))
                conn.commit()
                total_rows_inserted += len(chunk_data)
                print(f"✅ Inserted {total_rows_inserted}/{len(df)} rows into {sheet_name}")
                sys.stdout.flush()

        cursor.close()
        conn.close()
        print("✅ Processing Complete")
        sys.stdout.flush()

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.stdout.flush()

if __name__ == "__main__":
    # usage: python process_excel.py path_to_file [mode]
    excel_file = sys.argv[1] if len(sys.argv) > 1 else None
    refresh_mode = sys.argv[2] if len(sys.argv) > 2 else "refresh"
    process_excel(excel_file, refresh_mode)

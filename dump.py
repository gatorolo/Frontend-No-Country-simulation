import mysql.connector

try:
    connection = mysql.connector.connect(
        host="localhost",
        database="valora_db",
        user="root",
        password=""
    )

    if connection.is_connected():
        cursor = connection.cursor(dictionary=True)
        # Buscar "Jorge" en cualquier turno
        cursor.execute("SELECT * FROM shifts WHERE patient_name LIKE '%Jorge%'")
        records = cursor.fetchall()
        print(f"Borrando {len(records)} registros fantasmas...")
        
        cursor.execute("DELETE FROM shifts WHERE patient_name LIKE '%Jorge%'")
        connection.commit()
        print("Registros de Jorge borrados con exito de la base de datos.")

except Exception as e:
    print(f"Error: {e}")
finally:
    if 'connection' in locals() and connection.is_connected():
        cursor.close()
        connection.close()

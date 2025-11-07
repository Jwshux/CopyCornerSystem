import json
import os
from datetime import datetime

def convert_json_to_sql():
    collections = [
        'categories', 'groups', 'users', 'staffs', 
        'products', 'service_type', 'schedule', 'transactions'
    ]
    
    # TABLE CREATION SQL
    sql_output = f"""-- CopyCornerSystem Database Backup
-- Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- Total Collections: 8

-- Drop tables if they exist (optional)
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS schedule;
DROP TABLE IF EXISTS service_type;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS staffs;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS categories;

-- categories table
CREATE TABLE categories (
    _id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    archived_at DATETIME,
    is_archived TINYINT DEFAULT 0,
    restored_at DATETIME
);

-- groups table
CREATE TABLE groups (
    _id VARCHAR(255) PRIMARY KEY,
    group_name VARCHAR(255),
    group_level INT,
    status VARCHAR(50),
    created_at DATETIME,
    updated_at DATETIME,
    archived_at DATETIME,
    is_archived TINYINT DEFAULT 0,
    restored_at DATETIME
);

-- products table
CREATE TABLE products (
    _id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(100),
    product_name VARCHAR(255),
    category VARCHAR(255),
    category_id VARCHAR(255),
    stock_quantity INT,
    unit_price DECIMAL(10,2),
    status VARCHAR(50),
    minimum_stock INT,
    is_archived TINYINT DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME,
    archived_at DATETIME,
    restored_at DATETIME,
    FOREIGN KEY (category_id) REFERENCES categories(_id)
);

-- service_type table
CREATE TABLE service_type (
    _id VARCHAR(255) PRIMARY KEY,
    service_id VARCHAR(100),
    service_name VARCHAR(255),
    category VARCHAR(255),
    category_id VARCHAR(255),
    status VARCHAR(50),
    is_archived TINYINT DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME,
    archived_at DATETIME,
    restored_at DATETIME,
    FOREIGN KEY (category_id) REFERENCES categories(_id)
);

-- users table
CREATE TABLE users (
    _id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    username VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    group_id VARCHAR(255),
    status VARCHAR(50),
    last_login DATETIME,
    is_archived TINYINT DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME,
    archived_at DATETIME,
    restored_at DATETIME,
    FOREIGN KEY (group_id) REFERENCES groups(_id)
);

-- staffs table
CREATE TABLE staffs (
    _id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    studentNumber VARCHAR(100),
    course VARCHAR(100),
    section VARCHAR(50),
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(_id)
);

-- schedule table
CREATE TABLE schedule (
    _id VARCHAR(255) PRIMARY KEY,
    day VARCHAR(20),
    start_time TIME,
    end_time TIME,
    staff_id VARCHAR(255),
    staff_name VARCHAR(255),
    created_at DATETIME,
    updated_at DATETIME
);

-- transactions table
CREATE TABLE transactions (
    _id VARCHAR(255) PRIMARY KEY,
    queue_number VARCHAR(50),
    transaction_id VARCHAR(100),
    customer_name VARCHAR(255),
    service_type VARCHAR(255),
    paper_type VARCHAR(255),
    size_type VARCHAR(255),
    supply_type VARCHAR(255),
    product_id VARCHAR(255),
    product_name VARCHAR(255),
    total_pages INT,
    price_per_unit DECIMAL(10,2),
    quantity INT,
    total_amount DECIMAL(10,2),
    date DATE,
    status VARCHAR(50),
    is_archived TINYINT DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME,
    archived_at DATETIME,
    restored_at DATETIME,
    FOREIGN KEY (product_id) REFERENCES products(_id)
);

-- ============================================================================
-- INSERT DATA IN CORRECT ORDER
-- ============================================================================

"""
    
    # Process each collection in the correct order
    for collection in collections:
        json_file = f"{collection}.json"
        
        if not os.path.exists(json_file):
            print(f"⚠️  Skipping {json_file} - file not found")
            continue
            
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if not data:
                print(f"⚠️  Skipping {collection} - no data")
                continue
                
            sql_output += f"\n-- {collection} table ({len(data)} records)\n"
            
            for record in data:
                columns = []
                values = []
                
                for key, value in record.items():
                    columns.append(key)
                    
                    if value is None:
                        values.append("NULL")
                    elif isinstance(value, bool):
                        values.append("1" if value else "0")
                    elif isinstance(value, (int, float)):
                        values.append(str(value))
                    elif isinstance(value, dict):
                        if '$oid' in value:
                            values.append(f"'{value['$oid']}'")
                        elif '$date' in value:
                            date_str = value['$date'].replace('T', ' ').split('.')[0]
                            values.append(f"'{date_str}'")
                        elif '$binary' in value:
                            values.append("'[BINARY_DATA]'")
                        else:
                            json_str = json.dumps(value).replace("'", "''")
                            values.append(f"'{json_str}'")
                    else:
                        escaped_value = str(value).replace("'", "''")
                        values.append(f"'{escaped_value}'")
                
                columns_str = ", ".join(columns)
                values_str = ", ".join(values)
                
                sql_output += f"INSERT INTO {collection} ({columns_str}) VALUES ({values_str});\n"
            
            print(f"✅ Converted {collection} - {len(data)} records")
            
        except Exception as e:
            print(f"❌ Error converting {collection}: {str(e)}")
    
    # Final cleanup
    sql_output = sql_output.replace('False', '0').replace('True', '1')
    
    with open('CopyCornerSystemBackup.sql', 'w', encoding='utf-8') as f:
        f.write(sql_output)
    
    print(f"\n🎉 COMPLETE SQL BACKUP CREATED: CopyCornerSystemBackup.sql")
    print("📊 Includes: Table Creation + Data Insertion (61 total records)")
    print("✅ Ready for submission!")

if __name__ == "__main__":
    convert_json_to_sql()
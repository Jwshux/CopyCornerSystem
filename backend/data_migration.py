# data_migration.py
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv

# Load environment variables (same as your app.py)
load_dotenv()

def migrate_data():
    # Use the same MongoDB URI as your app
    MONGO_URI = os.getenv("MONGO_URI")
    if not MONGO_URI:
        print("❌ MONGO_URI not found in .env file")
        return
    
    try:
        client = MongoClient(MONGO_URI)
        db = client["CopyCornerSystem"]
        
        print("🔄 Starting data migration...")
        
        # Step 1: Convert Products
        print("📦 Migrating Products...")
        products = db.products.find()
        products_updated = 0
        
        for product in products:
            if 'category' in product and product['category'] and not product.get('category_id'):
                # Find the category by name
                category = db.categories.find_one({'name': product['category']})
                if category:
                    db.products.update_one(
                        {'_id': product['_id']},
                        {'$set': {'category_id': category['_id']}}
                    )
                    products_updated += 1
                    print(f"   ✅ Product '{product['product_name']}' linked to category '{product['category']}'")
                else:
                    print(f"   ❌ Category '{product['category']}' not found for product '{product['product_name']}'")
        
        # Step 2: Convert Service Types  
        print("🛠️ Migrating Service Types...")
        service_types = db.service_type.find()
        services_updated = 0
        
        for service in service_types:
            if 'category' in service and service['category'] and not service.get('category_id'):
                # Find the category by name
                category = db.categories.find_one({'name': service['category']})
                if category:
                    db.service_type.update_one(
                        {'_id': service['_id']},
                        {'$set': {'category_id': category['_id']}}
                    )
                    services_updated += 1
                    print(f"   ✅ Service '{service['service_name']}' linked to category '{service['category']}'")
                else:
                    print(f"   ❌ Category '{service['category']}' not found for service '{service['service_name']}'")
        
        print(f"\n🎉 Migration Completed!")
        print(f"   Products updated: {products_updated}")
        print(f"   Service Types updated: {services_updated}")
        
        # Verify migration
        print("\n🔍 Verification:")
        products_without_category = db.products.count_documents({'category': {'$exists': True}, 'category_id': {'$exists': False}})
        services_without_category = db.service_type.count_documents({'category': {'$exists': True}, 'category_id': {'$exists': False}})
        
        print(f"   Products still needing migration: {products_without_category}")
        print(f"   Service Types still needing migration: {services_without_category}")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    print("🚀 CopyCorner System Data Migration")
    print("=====================================")
    confirm = input("This will update your database. Backup recommended. Continue? (y/n): ")
    
    if confirm.lower() == 'y':
        migrate_data()
    else:
        print("Migration cancelled.")
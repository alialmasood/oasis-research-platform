import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testDatabase() {
  try {
    console.log("🔍 Testing database connection and functions...\n");

    const client = await pool.connect();

    // Test 1: Check if users exist
    console.log("1. Checking users...");
    const usersResult = await client.query("SELECT username, email, is_active FROM users LIMIT 5");
    console.log(`   Found ${usersResult.rows.length} users:`);
    usersResult.rows.forEach((user) => {
      console.log(`   - ${user.username} (${user.email}) - Active: ${user.is_active}`);
    });

    // Test 2: Check if functions exist
    console.log("\n2. Checking database functions...");
    const functionsResult = await client.query(
      "SELECT proname FROM pg_proc WHERE proname IN ('verify_login', 'hash_password')"
    );
    console.log(`   Found ${functionsResult.rows.length} functions:`);
    functionsResult.rows.forEach((func) => {
      console.log(`   - ${func.proname}`);
    });

    // Test 3: Test verify_login function
    console.log("\n3. Testing verify_login function...");
    try {
      const loginResult = await client.query(
        "SELECT * FROM verify_login($1, $2)",
        ["admin", "admin123"]
      );
      if (loginResult.rows.length > 0) {
        console.log("   ✅ verify_login works! User found:");
        console.log(`   - User ID: ${loginResult.rows[0].user_id}`);
        console.log(`   - Username: ${loginResult.rows[0].username}`);
        console.log(`   - Email: ${loginResult.rows[0].email}`);
      } else {
        console.log("   ❌ verify_login returned no results (wrong password or user not found)");
      }
    } catch (error: any) {
      console.log(`   ❌ Error testing verify_login: ${error.message}`);
    }

    // Test 4: Check user roles
    console.log("\n4. Checking user roles...");
    const rolesResult = await client.query(
      `SELECT u.username, r.name as role_name 
       FROM users u 
       JOIN user_roles ur ON u.id = ur.user_id 
       JOIN roles r ON ur.role_id = r.id 
       LIMIT 10`
    );
    console.log(`   Found ${rolesResult.rows.length} user-role assignments:`);
    rolesResult.rows.forEach((row) => {
      console.log(`   - ${row.username} has role: ${row.role_name}`);
    });

    client.release();
    console.log("\n✅ Database tests completed!");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testDatabase();

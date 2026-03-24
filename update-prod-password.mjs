// Generate bcrypt hash for production password update
import bcrypt from "bcryptjs";

const password = "Admin@Tantech23";
const hashed = await bcrypt.hash(password, 10);

console.log("\n=== Password Hash for Production ===");
console.log("Password:", password);
console.log("\nBcrypt Hash:");
console.log(hashed);
console.log("\n=== SQL Command ===");
console.log(`UPDATE "Recruiter" SET password = '${hashed}' WHERE email = 'admin@tantech.com';`);

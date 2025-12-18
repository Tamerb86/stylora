import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './drizzle/schema.js';

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function checkSalonData() {
  try {
    const tenantId = 'tamerb86@gmail.com';
    
    console.log('🔍 Checking data for salon:', tenantId);
    console.log('='.repeat(60));
    
    // Check services
    const services = await db.query.services.findMany({
      where: (services, { eq }) => eq(services.tenantId, tenantId),
    });
    
    console.log('\n📋 SERVICES:');
    console.log('Count:', services.length);
    if (services.length > 0) {
      services.forEach(s => {
        console.log(`  - ${s.name} (${s.price} kr, ${s.durationMinutes} min)`);
      });
    } else {
      console.log('  ❌ No services found');
    }
    
    // Check employees
    const employees = await db.query.employees.findMany({
      where: (employees, { eq }) => eq(employees.tenantId, tenantId),
    });
    
    console.log('\n👥 EMPLOYEES:');
    console.log('Count:', employees.length);
    if (employees.length > 0) {
      employees.forEach(e => {
        console.log(`  - ${e.name} (${e.email})`);
      });
    } else {
      console.log('  ❌ No employees found');
    }
    
    // Check salon info
    const salonInfo = await db.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.id, tenantId),
    });
    
    console.log('\n🏢 SALON INFO:');
    if (salonInfo) {
      console.log('  Name:', salonInfo.name || 'N/A');
      console.log('  Phone:', salonInfo.phone || 'N/A');
      console.log('  Email:', salonInfo.email || 'N/A');
      console.log('  Address:', salonInfo.address || 'N/A');
    } else {
      console.log('  ❌ Salon not found');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Data check complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSalonData();

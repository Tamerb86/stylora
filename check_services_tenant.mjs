import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './drizzle/schema.js';

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function checkServicesTenant() {
  try {
    console.log('🔍 Checking all services and their tenant_id...\n');
    
    const services = await db.query.services.findMany({
      limit: 20,
    });
    
    console.log(`Found ${services.length} services:\n`);
    
    const tenantGroups = {};
    services.forEach(s => {
      if (!tenantGroups[s.tenantId]) {
        tenantGroups[s.tenantId] = [];
      }
      tenantGroups[s.tenantId].push(s);
    });
    
    for (const [tenantId, servs] of Object.entries(tenantGroups)) {
      console.log(`\n📧 Tenant: ${tenantId}`);
      console.log(`   Services count: ${servs.length}`);
      servs.forEach(s => {
        console.log(`   - ${s.name} (${s.price} NOK, ${s.durationMinutes} min) [ID: ${s.id}]`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🎯 Target tenant: tamerb86@gmail.com');
    const targetServices = services.filter(s => s.tenantId === 'tamerb86@gmail.com');
    console.log(`   Services for target: ${targetServices.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkServicesTenant();

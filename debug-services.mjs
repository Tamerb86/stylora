import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { services, tenants } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function debugServices() {
  console.log('🔍 Checking all services and their tenant_id...\n');

  try {
    // Get all services
    const allServices = await db
      .select({
        id: services.id,
        name: services.name,
        price: services.price,
        tenantId: services.tenantId,
        createdAt: services.createdAt,
      })
      .from(services)
      .orderBy(services.createdAt);

    console.log(`Found ${allServices.length} services:\n`);
    
    allServices.forEach((service, index) => {
      console.log(`${index + 1}. ${service.name}`);
      console.log(`   Price: ${service.price} NOK`);
      console.log(`   Tenant ID: ${service.tenantId}`);
      console.log(`   Created: ${service.createdAt}`);
      console.log('');
    });

    // Get all tenants
    console.log('\n📋 All tenants in database:\n');
    const allTenants = await db
      .select({
        id: tenants.id,
        subdomain: tenants.subdomain,
        name: tenants.name,
        email: tenants.email,
      })
      .from(tenants);

    allTenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name || 'Unnamed'}`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Subdomain: ${tenant.subdomain}`);
      console.log(`   Email: ${tenant.email}`);
      console.log('');
    });

    // Check if services match any tenant
    console.log('\n🔗 Matching services to tenants:\n');
    
    for (const service of allServices) {
      const matchingTenant = allTenants.find(t => t.id === service.tenantId);
      if (matchingTenant) {
        console.log(`✅ ${service.name} → Tenant: ${matchingTenant.subdomain} (${matchingTenant.name})`);
      } else {
        console.log(`❌ ${service.name} → No matching tenant found for ID: ${service.tenantId}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

debugServices();

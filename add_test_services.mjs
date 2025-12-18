import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './drizzle/schema.js';

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function addTestServices() {
  try {
    const tenantId = 'tamerb86@gmail.com';
    
    console.log('🎯 Adding test services for:', tenantId);
    console.log('='.repeat(60));
    
    // Check if tenant exists
    const tenant = await db.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.id, tenantId),
    });
    
    if (!tenant) {
      console.log('❌ Tenant not found. Creating tenant first...');
      await db.insert(schema.tenants).values({
        id: tenantId,
        name: 'Tamer Salon',
        email: tenantId,
        phone: '+47 123 45 678',
        address: 'Oslo, Norway',
        createdAt: new Date(),
      });
      console.log('✅ Tenant created');
    } else {
      console.log('✅ Tenant exists:', tenant.name);
    }
    
    // Add test services
    const services = [
      {
        tenantId,
        name: 'Herreklipp',
        description: 'Profesjonell herreklipp med styling',
        price: '299',
        durationMinutes: 30,
        isActive: true,
        createdAt: new Date(),
      },
      {
        tenantId,
        name: 'Skjeggstell',
        description: 'Skjeggtrimming og styling',
        price: '199',
        durationMinutes: 20,
        isActive: true,
        createdAt: new Date(),
      },
      {
        tenantId,
        name: 'Hårfarge',
        description: 'Profesjonell hårfarge',
        price: '599',
        durationMinutes: 90,
        isActive: true,
        createdAt: new Date(),
      },
    ];
    
    console.log('\n📋 Adding services...');
    for (const service of services) {
      const inserted = await db.insert(schema.services).values(service).returning();
      console.log(`  ✅ ${service.name} - ${service.price} kr - ${service.durationMinutes} min`);
    }
    
    // Add a test employee
    console.log('\n👤 Adding test employee...');
    const employee = await db.insert(schema.employees).values({
      tenantId,
      name: 'Tamer',
      email: tenantId,
      phone: '+47 123 45 678',
      isActive: true,
      createdAt: new Date(),
    }).returning();
    console.log(`  ✅ ${employee[0].name}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test data added successfully!');
    console.log('\n📱 Test booking page:');
    console.log('https://barbertime-production-5d35.up.railway.app/book?tenant=tamerb86@gmail.com');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

addTestServices();

#!/usr/bin/env node
/**
 * Seed Demo Account for BarberTime
 * Creates a demo tenant with sample data for users to explore
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import * as schema from '../drizzle/schema.js';

const { tenants, users, services, customers, appointments, serviceCategories, eq, and, sql } = schema;

// Database connection
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('🚀 Starting demo account seed...\n');

// Demo tenant ID
const DEMO_TENANT_ID = 'demo-tenant-barbertime';
const DEMO_USER_EMAIL = 'demo@barbertime.no';
const DEMO_PASSWORD = 'demo123';

try {
  // 1. Create Demo Tenant
  console.log('📦 Creating demo tenant...');
  
  const existingTenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, DEMO_TENANT_ID))
    .limit(1);

  if (existingTenant.length > 0) {
    console.log('⚠️  Demo tenant already exists, skipping...');
  } else {
    await db.insert(tenants).values({
      id: DEMO_TENANT_ID,
      name: 'Demo Barbershop',
      subdomain: 'demo-barbertime',
      orgNumber: '123456789',
      phone: '+47 12 34 56 78',
      email: DEMO_USER_EMAIL,
      address: 'Karl Johans gate 1, 0154 Oslo, Norge',
      timezone: 'Europe/Oslo',
      currency: 'NOK',
      vatRate: '25.00',
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      emailVerified: true,
      emailVerifiedAt: new Date(),
      onboardingCompleted: true,
      onboardingStep: 'complete',
      onboardingCompletedAt: new Date(),
      cancellationWindowHours: 24,
      noShowThresholdForPrepayment: 2,
      requirePrepayment: false,
    });
    console.log('✅ Demo tenant created');
  }

  // 2. Create Demo User (Owner)
  console.log('\n👤 Creating demo user...');
  
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, DEMO_USER_EMAIL))
    .limit(1);

  let demoUserId;
  if (existingUser.length > 0) {
    console.log('⚠️  Demo user already exists, skipping...');
    demoUserId = existingUser[0].id;
  } else {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    
    const [result] = await db.insert(users).values({
      tenantId: DEMO_TENANT_ID,
      openId: `demo-owner-${nanoid()}`,
      email: DEMO_USER_EMAIL,
      name: 'Demo Owner',
      phone: '+47 12 34 56 78',
      passwordHash,
      role: 'owner',
      loginMethod: 'email',
      isActive: true,
      commissionType: 'percentage',
      commissionRate: '50.00',
      uiMode: 'advanced',
      onboardingCompleted: true,
    });
    
    demoUserId = result.insertId;
    console.log('✅ Demo user created');
  }

  // 3. Create Sample Employees
  console.log('\n👥 Creating sample employees...');
  
  const employees = [
    {
      name: 'Lars Olsen',
      phone: '+47 98 76 54 32',
      email: 'lars@demo.barbertime.no',
      commissionRate: '45.00',
    },
    {
      name: 'Kari Hansen',
      phone: '+47 98 76 54 33',
      email: 'kari@demo.barbertime.no',
      commissionRate: '40.00',
    },
  ];

  const employeeIds = [];
  for (const emp of employees) {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, emp.email))
      .limit(1);

    if (existing.length > 0) {
      employeeIds.push(existing[0].id);
      console.log(`⚠️  Employee ${emp.name} already exists, skipping...`);
    } else {
      const [result] = await db.insert(users).values({
        tenantId: DEMO_TENANT_ID,
        openId: `demo-employee-${nanoid()}`,
        email: emp.email,
        name: emp.name,
        phone: emp.phone,
        role: 'employee',
        loginMethod: 'email',
        isActive: true,
        commissionType: 'percentage',
        commissionRate: emp.commissionRate,
      });
      employeeIds.push(result.insertId);
      console.log(`✅ Employee ${emp.name} created`);
    }
  }

  // 4. Create Service Categories
  console.log('\n📂 Creating service categories...');
  
  const categories = [
    { name: 'Hårklipp', description: 'Alle typer hårklipp', displayOrder: 1 },
    { name: 'Skjegg', description: 'Skjeggtrim og styling', displayOrder: 2 },
    { name: 'Farge', description: 'Hårfarge og highlights', displayOrder: 3 },
  ];

  const categoryIds = [];
  for (const cat of categories) {
    const existing = await db
      .select()
      .from(serviceCategories)
      .where(and(
        eq(serviceCategories.tenantId, DEMO_TENANT_ID),
        eq(serviceCategories.name, cat.name)
      ))
      .limit(1);

    if (existing.length > 0) {
      categoryIds.push(existing[0].id);
      console.log(`⚠️  Category ${cat.name} already exists, skipping...`);
    } else {
      const [result] = await db.insert(serviceCategories).values({
        tenantId: DEMO_TENANT_ID,
        name: cat.name,
        description: cat.description,
        displayOrder: cat.displayOrder,
      });
      categoryIds.push(result.insertId);
      console.log(`✅ Category ${cat.name} created`);
    }
  }

  // 5. Create Services
  console.log('\n✂️  Creating services...');
  
  const servicesData = [
    {
      categoryId: categoryIds[0],
      name: 'Herreklipp',
      description: 'Klassisk herreklipp med maskin og saks',
      duration: 30,
      price: '350.00',
      color: '#3B82F6',
    },
    {
      categoryId: categoryIds[0],
      name: 'Fade',
      description: 'Moderne fade med overgang',
      duration: 45,
      price: '450.00',
      color: '#8B5CF6',
    },
    {
      categoryId: categoryIds[1],
      name: 'Skjeggtrim',
      description: 'Trim og styling av skjegg',
      duration: 20,
      price: '200.00',
      color: '#10B981',
    },
    {
      categoryId: categoryIds[1],
      name: 'Herreklipp + Skjegg',
      description: 'Komplett pakke med hårklipp og skjeggtrim',
      duration: 50,
      price: '500.00',
      color: '#F59E0B',
    },
    {
      categoryId: categoryIds[2],
      name: 'Hårfarge',
      description: 'Full hårfarge',
      duration: 90,
      price: '800.00',
      color: '#EF4444',
    },
  ];

  const serviceIds = [];
  for (const svc of servicesData) {
    const existing = await db
      .select()
      .from(services)
      .where(and(
        eq(services.tenantId, DEMO_TENANT_ID),
        eq(services.name, svc.name)
      ))
      .limit(1);

    if (existing.length > 0) {
      serviceIds.push(existing[0].id);
      console.log(`⚠️  Service ${svc.name} already exists, skipping...`);
    } else {
      const [result] = await db.insert(services).values({
        tenantId: DEMO_TENANT_ID,
        categoryId: svc.categoryId,
        name: svc.name,
        description: svc.description,
        duration: svc.duration,
        price: svc.price,
        color: svc.color,
        isActive: true,
      });
      serviceIds.push(result.insertId);
      console.log(`✅ Service ${svc.name} created`);
    }
  }

  // 6. Create Sample Customers
  console.log('\n👨‍💼 Creating sample customers...');
  
  const customersData = [
    {
      firstName: 'Ole',
      lastName: 'Nordmann',
      phone: '+47 91 23 45 67',
      email: 'ole@example.no',
    },
    {
      firstName: 'Kari',
      lastName: 'Svendsen',
      phone: '+47 91 23 45 68',
      email: 'kari@example.no',
    },
    {
      firstName: 'Per',
      lastName: 'Hansen',
      phone: '+47 91 23 45 69',
      email: 'per@example.no',
    },
    {
      firstName: 'Lise',
      lastName: 'Johansen',
      phone: '+47 91 23 45 70',
      email: 'lise@example.no',
    },
    {
      firstName: 'Erik',
      lastName: 'Berg',
      phone: '+47 91 23 45 71',
      email: 'erik@example.no',
    },
  ];

  const customerIds = [];
  for (const cust of customersData) {
    const existing = await db
      .select()
      .from(customers)
      .where(and(
        eq(customers.tenantId, DEMO_TENANT_ID),
        eq(customers.email, cust.email)
      ))
      .limit(1);

    if (existing.length > 0) {
      customerIds.push(existing[0].id);
      console.log(`⚠️  Customer ${cust.firstName} ${cust.lastName} already exists, skipping...`);
    } else {
      const [result] = await db.insert(customers).values({
        tenantId: DEMO_TENANT_ID,
        firstName: cust.firstName,
        lastName: cust.lastName,
        phone: cust.phone,
        email: cust.email,
        marketingSmsConsent: true,
        marketingEmailConsent: true,
        totalVisits: Math.floor(Math.random() * 10) + 1,
        totalRevenue: (Math.random() * 5000 + 1000).toFixed(2),
      });
      customerIds.push(result.insertId);
      console.log(`✅ Customer ${cust.firstName} ${cust.lastName} created`);
    }
  }

  // 7. Create Sample Appointments
  console.log('\n📅 Creating sample appointments...');
  
  const today = new Date();
  const appointmentsData = [
    // Past appointments
    {
      customerId: customerIds[0],
      employeeId: employeeIds[0],
      serviceId: serviceIds[0],
      date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      startTime: '10:00:00',
      endTime: '10:30:00',
      status: 'completed',
    },
    {
      customerId: customerIds[1],
      employeeId: employeeIds[1],
      serviceId: serviceIds[1],
      date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      startTime: '14:00:00',
      endTime: '14:45:00',
      status: 'completed',
    },
    // Today's appointments
    {
      customerId: customerIds[2],
      employeeId: employeeIds[0],
      serviceId: serviceIds[0],
      date: today,
      startTime: '09:00:00',
      endTime: '09:30:00',
      status: 'confirmed',
    },
    {
      customerId: customerIds[3],
      employeeId: employeeIds[1],
      serviceId: serviceIds[3],
      date: today,
      startTime: '11:00:00',
      endTime: '11:50:00',
      status: 'confirmed',
    },
    // Future appointments
    {
      customerId: customerIds[4],
      employeeId: employeeIds[0],
      serviceId: serviceIds[0],
      date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      startTime: '15:00:00',
      endTime: '15:30:00',
      status: 'confirmed',
    },
    {
      customerId: customerIds[0],
      employeeId: employeeIds[1],
      serviceId: serviceIds[2],
      date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      startTime: '10:00:00',
      endTime: '10:20:00',
      status: 'pending',
    },
  ];

  for (const apt of appointmentsData) {
    const dateStr = apt.date.toISOString().split('T')[0];
    const existing = await db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.tenantId, DEMO_TENANT_ID),
        eq(appointments.customerId, apt.customerId),
        sql`DATE(${appointments.appointmentDate}) = ${dateStr}`,
        eq(appointments.startTime, apt.startTime)
      ))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(appointments).values({
        tenantId: DEMO_TENANT_ID,
        customerId: apt.customerId,
        employeeId: apt.employeeId,
        appointmentDate: apt.date,
        startTime: apt.startTime,
        endTime: apt.endTime,
        status: apt.status,
        notes: 'Demo appointment',
      });
      console.log(`✅ Appointment for ${dateStr} ${apt.startTime} created`);
    } else {
      console.log(`⚠️  Appointment for ${dateStr} ${apt.startTime} already exists, skipping...`);
    }
  }

  console.log('\n✨ Demo account seed completed successfully!\n');
  console.log('📧 Demo Login:');
  console.log(`   Email: ${DEMO_USER_EMAIL}`);
  console.log(`   Password: ${DEMO_PASSWORD}`);
  console.log('\n🎉 Users can now explore all features!\n');

} catch (error) {
  console.error('❌ Error seeding demo account:', error);
  process.exit(1);
} finally {
  await connection.end();
}

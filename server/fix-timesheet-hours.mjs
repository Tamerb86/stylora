/**
 * Script to recalculate totalHours for all timesheets
 * Run with: node server/fix-timesheet-hours.mjs
 */

import mysql from 'mysql2/promise';

async function fixTimesheetHours() {
  // Create database connection
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  console.log('🔍 Fetching all timesheets with clockOut...');

  // Get all timesheets that have both clockIn and clockOut
  const [timesheets] = await connection.execute(
    'SELECT id, employeeId, workDate, clockIn, clockOut, totalHours FROM timesheets WHERE clockOut IS NOT NULL'
  );

  console.log(`📊 Found ${timesheets.length} timesheets to process`);

  let fixed = 0;
  let errors = 0;

  for (const timesheet of timesheets) {
    try {
      const clockIn = new Date(timesheet.clockIn);
      const clockOut = new Date(timesheet.clockOut);

      // Calculate hours difference
      const diffMs = clockOut.getTime() - clockIn.getTime();
      const hours = Math.abs(diffMs / (1000 * 60 * 60));
      const newTotalHours = hours.toFixed(2);

      // Check if current value is different
      const currentHours = parseFloat(timesheet.totalHours || '0');
      const calculatedHours = parseFloat(newTotalHours);

      if (Math.abs(currentHours - calculatedHours) > 0.01) {
        console.log(`\n🔧 Fixing timesheet #${timesheet.id}:`);
        console.log(`   Employee ID: ${timesheet.employeeId}`);
        console.log(`   Date: ${timesheet.workDate}`);
        console.log(`   Clock In: ${clockIn.toISOString()}`);
        console.log(`   Clock Out: ${clockOut.toISOString()}`);
        console.log(`   Old Hours: ${currentHours}`);
        console.log(`   New Hours: ${calculatedHours}`);

        // Update the timesheet
        await connection.execute(
          'UPDATE timesheets SET totalHours = ? WHERE id = ?',
          [newTotalHours, timesheet.id]
        );

        fixed++;
      }
    } catch (error) {
      console.error(`❌ Error processing timesheet #${timesheet.id}:`, error.message);
      errors++;
    }
  }

  console.log(`\n✅ Processing complete!`);
  console.log(`   Fixed: ${fixed} timesheets`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Unchanged: ${timesheets.length - fixed - errors}`);

  await connection.end();
}

// Run the script
fixTimesheetHours()
  .then(() => {
    console.log('\n🎉 Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

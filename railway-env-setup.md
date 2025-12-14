# Railway Environment Variables Setup

## Supabase Configuration

Add these environment variables to your Railway project:

```bash
SUPABASE_URL=https://glctudwajewwgnztaqbe.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsY3R1ZHdhamV3d2duenRhcWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MDgwODIsImV4cCI6MjA4MTI4NDA4Mn0.JZqZhbyJE28pK5qun-tuLQ3dF4jS-8gx45bBfEyA5NA
```

## Service Role Key (Required for full functionality)

**You need to add this manually from Supabase Dashboard:**

1. Go to: https://supabase.com/dashboard/project/glctudwajewwgnztaqbe/settings/api
2. Copy the `service_role` key (under "Project API keys" section)
3. Add to Railway:

```bash
SUPABASE_SERVICE_KEY=sb_secret_Ic4IG8WudChXZT4e0l_byQ_uH7CUwv1
```

## How to Add to Railway

### Option 1: Railway Dashboard (Recommended)
1. Go to: https://railway.app/project/<your-project-id>
2. Click on your service (barbertime)
3. Go to "Variables" tab
4. Click "New Variable"
5. Add each variable one by one

### Option 2: Railway CLI
```bash
railway variables set SUPABASE_URL=https://glctudwajewwgnztaqbe.supabase.co
railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsY3R1ZHdhamV3d2duenRhcWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MDgwODIsImV4cCI6MjA4MTI4NDA4Mn0.JZqZhbyJE28pK5qun-tuLQ3dF4jS-8gx45bBfEyA5NA
railway variables set SUPABASE_SERVICE_KEY=sb_secret_Ic4IG8WudChXZT4e0l_byQ_uH7CUwv1
```

## After Adding Variables

1. Railway will automatically redeploy your service
2. Wait 2-3 minutes for deployment to complete
3. Test the login/register pages:
   - Login: https://barbertime-production-5d35.up.railway.app/login
   - Register: https://barbertime-production-5d35.up.railway.app/register

## Notes

- **SUPABASE_URL**: Your Supabase project URL
- **SUPABASE_ANON_KEY**: Public key for client-side operations (safe to expose)
- **SUPABASE_SERVICE_KEY**: Secret key for server-side admin operations (NEVER expose to client)

## Troubleshooting

If authentication doesn't work:
1. Check that all 3 variables are set in Railway
2. Check Railway logs for errors
3. Verify the keys are correct (no extra spaces)
4. Make sure the service has redeployed after adding variables

# 📊 Monitoring System Guide - Stylora

**Version:** 1.0  
**Last Updated:** December 29, 2025

---

## 🎯 Overview

The Stylora monitoring system provides comprehensive real-time tracking of:
- **Unimicro Sync Performance** - Track invoice/customer sync success rates
- **Email Delivery** - Monitor AWS SES and SMTP fallback performance
- **SMS Delivery** - Track PSWinCom/LinkMobility/Twilio delivery rates
- **System Health** - Overall health score and component status
- **Automated Alerts** - Proactive notifications for critical issues

---

## 🚀 Quick Start

### Accessing the Monitoring Dashboard

1. **Login to Admin Panel**
   ```
   https://your-salon.stylora.app/dashboard
   ```

2. **Navigate to Monitoring**
   ```
   Menu → Monitoring (or visit /monitoring)
   ```

3. **View System Health**
   - Health Score (0-100)
   - Component Status (Unimicro, Email, SMS, API)
   - Active Alerts

---

## 📈 Key Metrics

### System Health Score
- **90-100:** 🟢 Healthy
- **70-89:** 🟡 Warning
- **0-69:** 🔴 Critical

### Success Rate Targets
- **Unimicro Sync:** > 95%
- **Email Delivery:** > 95%
- **SMS Delivery:** > 95%

---

## 🔍 Monitoring Unimicro Sync (24-Hour Watch)

### What to Monitor

**Every 4 Hours (First 24 Hours):**
- ✅ Check sync success rate (should be > 95%)
- ✅ Review any failed syncs
- ✅ Verify average sync duration < 60s
- ✅ Check for consecutive failures

**SQL Queries for Manual Monitoring:**

```sql
-- Check sync status (last 24 hours)
SELECT 
  DATE(syncStartedAt) as date,
  COUNT(*) as total_syncs,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
  ROUND(AVG(TIMESTAMPDIFF(SECOND, syncStartedAt, syncCompletedAt)), 2) as avg_duration_sec
FROM unimicroSyncLog
WHERE syncStartedAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY DATE(syncStartedAt);

-- Get recent failures
SELECT 
  id,
  syncType,
  syncStartedAt,
  errorMessage,
  recordsSynced
FROM unimicroSyncLog
WHERE status = 'failed'
  AND syncStartedAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY syncStartedAt DESC
LIMIT 10;
```

### Alert Thresholds

**Critical (Immediate Action):**
- 3+ consecutive sync failures
- Success rate < 70%
- No syncs in 6+ hours

**Warning (Monitor Closely):**
- 2 consecutive failures
- Success rate 70-90%
- Average duration > 90s

---

## 📧 Email/SMS Delivery Monitoring

### SQL Queries

```sql
-- Email delivery rates (last 24 hours)
SELECT 
  notificationType,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
  ROUND(SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as success_rate
FROM notifications
WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY notificationType;

-- Failed notifications (last 24 hours)
SELECT 
  notificationType,
  recipient,
  errorMessage,
  createdAt,
  retryCount
FROM notifications
WHERE status = 'failed'
  AND createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY createdAt DESC
LIMIT 20;
```

### Success Rate Targets
- **> 95%:** Excellent ✅
- **90-95%:** Good ⚠️
- **< 90%:** Needs Investigation 🚨

---

## 🚨 Common Issues & Solutions

### Issue: Unimicro Sync Failing

**Symptoms:**
- Multiple consecutive failures
- Error: "Authentication failed"

**Solution:**
1. Go to Settings → Integrations → Unimicro
2. Verify Client ID and Client Secret
3. Test connection
4. Trigger manual sync

### Issue: Low Email Delivery Rate

**Symptoms:**
- Success rate < 90%
- Error: "Invalid credentials"

**Solution:**
1. Check AWS SES credentials in environment
2. Verify sender email is verified in AWS SES
3. Check SMTP fallback configuration

### Issue: Low SMS Delivery Rate

**Symptoms:**
- Success rate < 90%
- Error: "Invalid phone number format"

**Solution:**
1. Verify phone numbers use +47 format
2. Check SMS provider credentials
3. Verify provider balance

---

## 📊 Performance Baselines

### Expected Performance (Healthy System)

**Unimicro Sync:**
- Success Rate: > 95%
- Average Duration: < 30 seconds
- Failures: < 1 per day

**Email Delivery:**
- Success Rate: > 95%
- Average Delivery Time: < 10 seconds
- Failed: < 5% of total

**SMS Delivery:**
- Success Rate: > 95%
- Average Delivery Time: < 30 seconds
- Failed: < 5% of total

---

## 📞 Emergency Contacts

**Technical Support:** support@stylora.app  
**Emergency Hotline:** [To be configured]

---

**Last Updated:** December 29, 2025

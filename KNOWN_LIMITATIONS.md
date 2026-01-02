# Known Limitations

This document lists the current known limitations and areas that may need attention.

## 1. External Service Dependencies

| Service                   | Status     | Notes                                                |
| ------------------------- | ---------- | ---------------------------------------------------- |
| **Stripe**                | ✅ Ready   | Requires API keys configuration                      |
| **Vipps**                 | ✅ Ready   | Requires merchant credentials                        |
| **iZettle/PayPal Reader** | ⚠️ Limited | Only works with PayPal Reader (not iZettle Reader 2) |
| **Google Maps**           | ✅ Ready   | Requires Google Maps API key                         |
| **OpenAI**                | ✅ Ready   | Requires API key for image/voice features            |

## 2. iZettle/PayPal Reader Limitation

**Issue:** The iZettle Reader 2 (older model) is NOT compatible with the Reader Connect API.

**Solution:** Users must purchase a PayPal Reader (~€29-49) for card terminal integration.

**Workaround:** Use Stripe Terminal with compatible readers instead.

## 3. SMS Provider Configuration

**Issue:** SMS notifications require external provider setup.

**Supported Providers:**

- Twilio (recommended)
- PSWinCom
- LinkMobility

**Note:** SMS costs are billed directly by the provider.

## 4. Email Delivery

**Issue:** Email delivery depends on SMTP configuration.

**Recommendations:**

- Use AWS SES for production (high deliverability)
- Use Gmail SMTP for testing only (rate limits apply)
- Configure SPF/DKIM records for best deliverability

## 5. Database Backups

**Issue:** Automated backups require S3-compatible storage.

**Options:**

- AWS S3
- Backblaze B2 (free 10GB)
- DigitalOcean Spaces

**Note:** Without backup configuration, manual backups are required.

## 6. Multi-Language Support

**Current Languages:**

- Norwegian (default)
- Arabic (RTL supported)
- English
- Ukrainian

**Limitation:** Some admin pages may have untranslated strings.

## 7. Performance Considerations

- Large image uploads should be optimized before upload
- Calendar view may be slow with 1000+ appointments
- Reports generation for large date ranges may timeout

---

**Last Updated:** January 2025

**For questions or issues, contact:** support@stylora.no

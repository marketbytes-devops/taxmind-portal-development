# Payment Reminder System

## Overview

Automated payment reminder system that sends email notifications to users who have pending payments for completed tax refund applications.

## Features

### 1. **Database Schema Changes**

- Added `lastPaymentReminderSentAt` field to `applications` table
- Migration file: `0032_add_last_payment_reminder_sent_at_field.sql`

### 2. **Reminder Logic**

The system sends reminders for applications where:

- Application status is `refund_completed`
- Payment status is `pending`
- User account is active (not soft-deleted)
- Either:
  - No offline payment request exists, OR
  - Latest offline payment request was rejected
- Reminder conditions:
  - No previous reminder sent AND application is more than 2 days old, OR
  - Last reminder was sent more than 2 days ago

### 3. **Email Template**

- Uses `payment_reminder.hbs` template
- Replacement variables: `{ name: string }` (user name)
- Subject: "Payment Reminder for Your Recent Tax Filing"

### 4. **Cron Job Scheduling**

- Runs daily at 10:00 AM Dublin time (`0 10 * * *`)
- Integrated with existing cron scheduler in `src/scripts/cronScheduler.ts`
- Proper error handling and logging

### Manual Execution

```bash
# Local environment
npm run script:payment-reminder:local

```

### Reminder Frequency

- **2-day interval**: Prevents spam while maintaining engagement
- **Daily check**: Ensures timely processing of newly eligible applications

### Eligibility Criteria

1. **Application Status**: Must be `refund_completed` (refund amount calculated and ready)
2. **Payment Status**: Must be `pending` (payment not yet made)
3. **User Status**: User account must be active (not deleted)
4. **Payment Request Status**: Either no offline payment request OR latest request rejected
5. **Time Constraints**: Respects 2-day cooling period between reminders

### Tracking

- `lastPaymentReminderSentAt` field updated after each successful email
- Enables accurate calculation of next reminder due date
- Prevents duplicate reminders within 2-day window

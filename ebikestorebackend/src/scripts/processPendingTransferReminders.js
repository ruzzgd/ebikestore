import { getPool } from '../db/connection.js';
import { getRecipientsForLocation, createForUsers } from '../features/notifications/notificationService.js';

async function processReminders() {
  const pool = getPool();
  try {
    const [requests] = await pool.execute(
      `SELECT id, request_reference, source_location_id, destination_location_id 
       FROM inter_branch_requests 
       WHERE status = 'pending' 
         AND requested_at < DATE_SUB(NOW(), INTERVAL 24 HOUR) 
         AND pending_reminder_sent_at IS NULL`
    );

    if (requests.length === 0) {
      console.log('No pending requests require reminders at this time.');
      return;
    }

    console.log(`Found ${requests.length} pending requests to remind.`);

    for (const request of requests) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const recipients = await getRecipientsForLocation(connection, request.source_location_id, { includeAdmins: true });
        
        await createForUsers(connection, recipients, {
          type: 'transfer_requested',
          title: 'Pending Transfer Reminder',
          message: `Reminder: Transfer request ${request.request_reference} has been pending for over 24 hours.`,
          referenceType: 'inter_branch_request',
          referenceId: String(request.id),
        });

        await connection.execute(
          `UPDATE inter_branch_requests SET pending_reminder_sent_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [request.id]
        );

        await connection.commit();
        console.log(`Sent reminder for request ${request.request_reference}`);
      } catch (error) {
        await connection.rollback();
        console.error(`Failed to process reminder for request ${request.request_reference}:`, error);
      } finally {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Error fetching pending requests:', error);
  } finally {
    await pool.end();
  }
}

processReminders();

import { Resend } from 'resend';
import type { Issue } from '@shared/schema';
import { getIssueTypeById } from '../client/src/data/issueTypes';
import { differenceInDays } from 'date-fns';

// Initialize Resend with the API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Default recipient email addresses
const defaultRecipients = ['waltstrydom@gmail.com'];

// Track issues that have already received reminder emails to avoid duplicates
const reminderSentTracker = new Map<number, Date>();

/**
 * Format date for email display
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Get issue type name from ID
 */
function getIssueTypeName(type: string): string {
  const issueType = getIssueTypeById(type);
  
  if (issueType) {
    return `${issueType.categoryName} > ${issueType.name}`;
  }
  
  // Fallback for older issue types
  switch (type) {
    case 'pothole':
      return 'Roads & Traffic > Pothole';
    case 'streetlight':
      return 'Street Lighting > Non-functional Streetlight';
    case 'trafficlight':
      return 'Roads & Traffic > Malfunctioning Traffic Light';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ');
  }
}

/**
 * Send an email notification for a new issue report
 */
export async function sendNewIssueEmail(issue: Issue): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    // Format issue details for email
    const issueType = getIssueTypeName(issue.type);
    const reportDate = formatDate(issue.createdAt);
    const photoSection = issue.photoUrl 
      ? `<p style="margin-bottom: 20px;"><strong>Photo:</strong> <a href="${process.env.BASE_URL || 'https://reportr.app'}${issue.photoUrl}" target="_blank">View photo</a></p>`
      : '<p style="margin-bottom: 20px;"><strong>Photo:</strong> None provided</p>';
    
    // Create email content
    const emailContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1f2937; color: white; padding: 15px; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 5px 5px; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
            .detail-row { margin-bottom: 10px; }
            .label { font-weight: bold; }
            .map-link { color: #2563eb; text-decoration: none; }
            .warning { color: #ef4444; font-weight: bold; }
            .highlight { background-color: #f8fafc; border-left: 3px solid #2563eb; padding: 10px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">New Infrastructure Issue Report</h1>
            </div>
            <div class="content">
              <p>A new infrastructure issue has been reported in Pretoria. Details are as follows:</p>
              
              <div class="highlight">
                <p class="detail-row"><span class="label">Report ID:</span> ${issue.reportId}</p>
                <p class="detail-row"><span class="label">Issue Type:</span> ${issueType}</p>
                <p class="detail-row"><span class="label">Status:</span> ${issue.status.toUpperCase()}</p>
              </div>
              
              <h3>Location Details</h3>
              <p class="detail-row"><span class="label">Address:</span> ${issue.address}</p>
              <p class="detail-row"><span class="label">GPS Coordinates:</span> ${issue.latitude.toFixed(6)}, ${issue.longitude.toFixed(6)}</p>
              <p class="detail-row"><span class="label">Google Maps:</span> <a href="https://www.google.com/maps?q=${issue.latitude},${issue.longitude}" class="map-link" target="_blank">View on Google Maps</a></p>
              
              <h3>Additional Details</h3>
              <p class="detail-row"><span class="label">Reported:</span> ${reportDate}</p>
              <p class="detail-row"><span class="label">Notes:</span> ${issue.notes || 'No additional notes provided.'}</p>
              ${photoSection}
              
              <p class="warning">Please address this issue promptly. This report was anonymously submitted through the CitiReport app.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from the port Infrastructure Reporting System. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Send the email
    const data = await resend.emails.send({
      from: 'Reportr Infrastructure Reports <reports@resend.dev>',
      to: defaultRecipients,
      subject: `New Report [${issue.reportId}]: ${issueType} at ${issue.address}`,
      html: emailContent,
    });
    
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

/**
 * Send an email notification for an issue that received support
 */
export async function sendSupportEmail(issue: Issue): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    // Format issue details for email
    const issueType = getIssueTypeName(issue.type);
    const reportDate = formatDate(issue.createdAt);
    
    // Create email content
    const emailContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ef4444; color: white; padding: 15px; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 5px 5px; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
            .detail-row { margin-bottom: 10px; }
            .label { font-weight: bold; }
            .map-link { color: #2563eb; text-decoration: none; }
            .warning { color: #ef4444; font-weight: bold; }
            .highlight { background-color: #f8fafc; border-left: 3px solid #ef4444; padding: 10px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">⚠️ URGENT: Additional Support Received</h1>
            </div>
            <div class="content">
              <p><strong>This issue now has ${issue.upvotes} ${issue.upvotes === 1 ? 'supporter' : 'supporters'}</strong> from different citizens in Pretoria. Details are as follows:</p>
              
              <div class="highlight">
                <p class="detail-row"><span class="label">Report ID:</span> ${issue.reportId}</p>
                <p class="detail-row"><span class="label">Issue Type:</span> ${issueType}</p>
                <p class="detail-row" style="color: #ef4444; font-weight: bold; font-size: 16px;"><span class="label">TOTAL SUPPORTERS:</span> ${issue.upvotes}</p>
              </div>
              
              <h3>Location Details</h3>
              <p class="detail-row"><span class="label">Address:</span> ${issue.address}</p>
              <p class="detail-row"><span class="label">GPS Coordinates:</span> ${issue.latitude.toFixed(6)}, ${issue.longitude.toFixed(6)}</p>
              <p class="detail-row"><span class="label">Google Maps:</span> <a href="https://www.google.com/maps?q=${issue.latitude},${issue.longitude}" class="map-link" target="_blank">View on Google Maps</a></p>
              
              <h3>Issue History</h3>
              <p class="detail-row"><span class="label">First Reported:</span> ${reportDate}</p>
              <p class="detail-row"><span class="label">Status:</span> ${issue.status.toUpperCase()}</p>
              
              <p style="background-color: #fef2f2; border: 1px solid #ef4444; padding: 10px; font-weight: bold; color: #b91c1c; text-align: center; margin-top: 20px;">
                THIS ISSUE HAS BEEN REPORTED BY MULTIPLE CITIZENS AND REQUIRES IMMEDIATE ATTENTION.<br>
                Please prioritize this report (ID: ${issue.reportId}) for resolution.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated message from the Reportr Infrastructure Reporting System. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Send the email with exactly the same subject line as the initial report
    // This ensures municipal staff can easily match issues without scanning through different formats
    const data = await resend.emails.send({
      from: 'Reportr Infrastructure Reports <reports@resend.dev>',
      to: defaultRecipients,
      subject: `New Report [${issue.reportId}]: ${issueType} at ${issue.address}`,
      html: emailContent,
    });
    
    return { success: true, data };
  } catch (error) {
    console.error('Error sending support email:', error);
    return { success: false, error };
  }
}

/**
 * Send a reminder email for an unresolved issue after 45 days
 */
export async function sendReminderEmail(issue: Issue): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    // Check if we've already sent a reminder for this issue recently
    const lastReminder = reminderSentTracker.get(issue.id);
    if (lastReminder && differenceInDays(new Date(), lastReminder) < 14) {
      // Don't send another reminder if one was sent less than 14 days ago
      return { success: false, error: 'Reminder already sent recently' };
    }
    
    // Format issue details for email
    const issueType = getIssueTypeName(issue.type);
    const reportDate = formatDate(issue.createdAt);
    const daysOpen = differenceInDays(new Date(), new Date(issue.createdAt));
    
    // Create email content
    const emailContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f59e0b; color: white; padding: 15px; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 5px 5px; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
            .detail-row { margin-bottom: 10px; }
            .label { font-weight: bold; }
            .map-link { color: #2563eb; text-decoration: none; }
            .warning { color: #f59e0b; font-weight: bold; }
            .highlight { background-color: #fff7ed; border-left: 3px solid #f59e0b; padding: 10px; margin: 15px 0; }
            .timer { font-size: 28px; font-weight: bold; color: #f59e0b; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">⏰ Reminder: Unresolved Issue</h1>
            </div>
            <div class="content">
              <p>This is a reminder about an infrastructure issue that has remained <strong>unresolved for ${daysOpen} days</strong>.</p>
              
              <div class="timer">45+ DAYS ELAPSED</div>
              
              <div class="highlight">
                <p class="detail-row"><span class="label">Report ID:</span> ${issue.reportId}</p>
                <p class="detail-row"><span class="label">Issue Type:</span> ${issueType}</p>
                <p class="detail-row"><span class="label">Supporters:</span> ${issue.upvotes}</p>
                <p class="detail-row"><span class="label">Status:</span> ${issue.status.toUpperCase()}</p>
              </div>
              
              <h3>Location Details</h3>
              <p class="detail-row"><span class="label">Address:</span> ${issue.address}</p>
              <p class="detail-row"><span class="label">GPS Coordinates:</span> ${issue.latitude.toFixed(6)}, ${issue.longitude.toFixed(6)}</p>
              <p class="detail-row"><span class="label">Google Maps:</span> <a href="https://www.google.com/maps?q=${issue.latitude},${issue.longitude}" class="map-link" target="_blank">View on Google Maps</a></p>
              
              <h3>Issue History</h3>
              <p class="detail-row"><span class="label">First Reported:</span> ${reportDate} (${daysOpen} days ago)</p>
              
              <p style="background-color: #fff7ed; border: 1px solid #f59e0b; padding: 10px; font-weight: bold; color: #b45309; text-align: center; margin-top: 20px;">
                THIS ISSUE HAS BEEN OPEN FOR OVER 45 DAYS AND REQUIRES ATTENTION.<br>
                Please update status or provide resolution for report ID: ${issue.reportId}.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated reminder from the Reportr Infrastructure Reporting System. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Send the email with a reminder-specific subject line
    const data = await resend.emails.send({
      from: 'Reportr Infrastructure Reports <reports@resend.dev>',
      to: defaultRecipients,
      subject: `REMINDER [${issue.reportId}]: ${issueType} at ${issue.address} - Open for ${daysOpen} days`,
      html: emailContent,
    });
    
    // Track that we've sent a reminder for this issue
    reminderSentTracker.set(issue.id, new Date());
    
    return { success: true, data };
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return { success: false, error };
  }
}
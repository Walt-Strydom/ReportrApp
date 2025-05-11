import { Resend } from 'resend';
import type { Issue } from '@shared/schema';
import { getIssueTypeById } from '../client/src/data/issueTypes';

// Initialize Resend with the API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Default recipient email addresses
const defaultRecipients = ['waltstrydom@gmail.com'];

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
      ? `<p style="margin-bottom: 20px;"><strong>Photo:</strong> <a href="https://lokisa.replit.app${issue.photoUrl}" target="_blank">View photo</a></p>`
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
              
              <p class="warning">Please address this issue promptly. This report was anonymously submitted through the Lokisa app.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from the Lokisa Infrastructure Reporting System. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Send the email
    const data = await resend.emails.send({
      from: 'Lokisa Infrastructure Reports <reports@resend.dev>',
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
export async function sendUpvoteEmail(issue: Issue): Promise<{ success: boolean; data?: any; error?: any }> {
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
              <h1 style="margin: 0; font-size: 24px;">⚠️ Issue Support - Additional Confirmation</h1>
            </div>
            <div class="content">
              <p><strong>Another citizen has supported</strong> an existing infrastructure issue in Pretoria. Details are as follows:</p>
              
              <div class="highlight">
                <p class="detail-row"><span class="label">Original Report ID:</span> ${issue.reportId}</p>
                <p class="detail-row"><span class="label">Issue Type:</span> ${issueType}</p>
                <p class="detail-row"><span class="label">Current Supporters:</span> ${issue.upvotes}</p>
              </div>
              
              <h3>Location Details</h3>
              <p class="detail-row"><span class="label">Address:</span> ${issue.address}</p>
              <p class="detail-row"><span class="label">GPS Coordinates:</span> ${issue.latitude.toFixed(6)}, ${issue.longitude.toFixed(6)}</p>
              <p class="detail-row"><span class="label">Google Maps:</span> <a href="https://www.google.com/maps?q=${issue.latitude},${issue.longitude}" class="map-link" target="_blank">View on Google Maps</a></p>
              
              <h3>Issue History</h3>
              <p class="detail-row"><span class="label">First Reported:</span> ${reportDate}</p>
              <p class="detail-row"><span class="label">Status:</span> ${issue.status.toUpperCase()}</p>
              
              <p class="warning">Multiple reports suggest this issue requires immediate attention. Please prioritize accordingly.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from the Lokisa Infrastructure Reporting System. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Send the email
    const data = await resend.emails.send({
      from: 'Lokisa Infrastructure Reports <reports@resend.dev>',
      to: defaultRecipients,
      subject: `SUPPORTED [${issue.reportId}]: ${issueType} at ${issue.address} (${issue.upvotes} ${issue.upvotes === 1 ? 'supporter' : 'supporters'})`,
      html: emailContent,
    });
    
    return { success: true, data };
  } catch (error) {
    console.error('Error sending upvote email:', error);
    return { success: false, error };
  }
}
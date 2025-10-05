
/**
 * Google Apps Script Web App to accept form POSTs and write to Google Sheets,
 * email the admin & student, then redirect.
 */
const SHEET_ID = 'YOUR_SHEET_ID_HERE';              // ← paste your Sheet ID
const SHEET_NAME = 'Registrations';
const ADMIN_EMAIL = 'ernsconsultantllc@gmail.com';
const THANK_YOU_URL = 'https://your-site.example/thankyou.html';

function doPost(e) {
  try {
    var p = e.parameter || {};
    if (p.company) {
      return HtmlService.createHtmlOutput('<!doctype html><h2>Thank you!</h2><p>Your submission was received.</p>');
    }
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp','Full Name','Email','Phone',
        'Street Address','Address Line 2','City','State/Province','ZIP/Postal Code','Country',
        'Course','Notes','Agree','Payment Status','Email Sent'
      ]);
    }

    var row = [
      new Date(),
      p.fullName || '', p.email || '', p.phone || '',
      p.address_street || '', p.address_line2 || '', p.address_city || '', p.address_state || '',
      p.address_zip || '', p.address_country || '', p.course || '', p.notes || '',
      p.agree ? 'Yes' : 'No', 'Pending', ''
    ];
    sheet.appendRow(row);
    var lastRow = sheet.getLastRow();

    var adminHtml =
      'New Student Registration:<br><br>' +
      '<b>Name:</b> ' + esc(p.fullName) + '<br>' +
      '<b>Email:</b> ' + esc(p.email) + '<br>' +
      '<b>Phone:</b> ' + esc(p.phone) + '<br>' +
      '<b>Address:</b> ' + esc(p.address_street) + ' ' + esc(p.address_line2) + ', ' +
        esc(p.address_city) + ', ' + esc(p.address_state) + ' ' + esc(p.address_zip) + ', ' + esc(p.address_country) + '<br>' +
      '<b>Course:</b> ' + esc(p.course) + '<br>' +
      '<b>Notes:</b> ' + esc(p.notes) + '<br>' +
      '<b>Agree to terms:</b> ' + (p.agree ? 'Yes' : 'No') + '<br>';

    MailApp.sendEmail({ to: ADMIN_EMAIL, subject: 'New Student Registration — Erns Consultant', htmlBody: adminHtml });

    var emailSent = false;
    if (p.email) {
      var studentHtml =
        'Hello ' + esc(p.fullName || 'Student') + ',<br><br>' +
        'We received your registration for <b>' + esc(p.course || 'SPT Course') + '</b>.<br>' +
        'Next step: please pay <b>$200 (non-refundable)</b> via PayPal, Zelle, or CashApp to confirm your spot.<br>' +
        'Questions? Email <a href=\"mailto:ernsconsultantllc@gmail.com\">ernsconsultantllc@gmail.com</a>.<br><br>' +
        '— Erns Consultant';
      MailApp.sendEmail({ to: p.email, subject: 'Registration Received — Erns Consultant', htmlBody: studentHtml });
      emailSent = true;
    }

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var emailCol = headers.indexOf('Email Sent') + 1;
    if (emailSent && emailCol > 0) sheet.getRange(lastRow, emailCol).setValue('Yes');

    var redirect = (p.redirect_url && safeUrl(p.redirect_url)) || THANK_YOU_URL;
    var html = '<!doctype html><meta http-equiv=\"refresh\" content=\"0;url=' + redirect + '\">' +
               '<p>Thank you! If you are not redirected, <a href=\"' + redirect + '\">click here</a>.</p>';
    return HtmlService.createHtmlOutput(html);

  } catch (err) {
    return HtmlService.createHtmlOutput('<!doctype html><h2>Error</h2><pre>' + String(err) + '</pre>');
  }
}

function esc(s){ return String(s||'').replace(/[<>&]/g, (c)=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c])); }
function safeUrl(u){ return String(u||'').replace(/["<>]/g,''); }

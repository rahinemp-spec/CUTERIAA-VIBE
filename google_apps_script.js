
/**
 * CUTERIAA - CLOUD MASTER ENGINE V3.0.0
 * Rebranded and Updated
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();

function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === 'setup') return runSetup();
    if (action === 'getAuth') return getSheetData('Users');
    if (action === 'getProducts') return getSheetData('Products');
    if (action === 'getOrders') return getSheetData('Orders');
    if (action === 'getCategories') return getSheetData('Categories');
    if (action === 'getChats') return getSheetData('Chats');
    return createResponse({ status: 'online', timestamp: new Date() });
  } catch (error) {
    return createResponse({ error: error.toString() });
  }
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action || e.parameter.action;
    const data = params.data;

    if (action === 'logAuth') {
      appendData('Logs', [new Date(), data.userId, data.type, data.role]);
    } else if (action === 'saveProduct') {
      upsertData('Products', data, 'id');
    } else if (action === 'deleteProduct') {
      deleteRowById('Products', data.id, 'id');
    } else if (action === 'saveCategory') {
      upsertData('Categories', data, 'id');
    } else if (action === 'deleteCategory') {
      deleteRowById('Categories', data.id, 'id');
    } else if (action === 'addOrder' || action === 'updateOrder') {
      if (action === 'addOrder' && !data.date) {
        data.date = new Date().toISOString();
      }
      upsertData('Orders', data, 'id');
      if (action === 'addOrder') {
        try { sendOrderEmail(data); } catch(e) { console.warn("Email failed: " + e.toString()); }
      }
    } else if (action === 'saveChat') {
      upsertData('Chats', data, 'id');
    }

    return createResponse({ status: 'success' });
  } catch (error) {
    console.error("Script Error: " + error.toString());
    return createResponse({ error: error.toString(), stack: error.stack });
  }
}

function runSetup() {
  const requiredSheets = {
    'Users': ['id', 'pass', 'role', 'name'],
    'Products': ['id', 'name', 'price', 'category', 'anime', 'description', 'image', 'images', 'isFeatured', 'isComingSoon', 'color', 'colors', 'outOfStockColors', 'outOfStockImages', 'videoUrl'],
    'Categories': ['id', 'name'],
    'Orders': ['date', 'id', 'customer', 'total', 'status', 'items', 'subtotal', 'deliveryCharge', 'paymentMethod', 'transactionInfo'],
    'Chats': ['id', 'userName', 'userEmail', 'messages', 'lastMessageAt', 'status'],
    'Logs': ['timestamp', 'userId', 'type', 'role']
  };

  const results = [];
  for (const [name, headers] of Object.entries(requiredSheets)) {
    let sheet = SS.getSheetByName(name);
    if (!sheet) {
      sheet = SS.insertSheet(name);
      sheet.appendRow(headers);
      results.push(`Created sheet: ${name}`);
    } else {
      const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      if (existingHeaders.length < headers.length) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        results.push(`Headers updated: ${name}`);
      }
      results.push(`Verified: ${name}`);
    }
  }

  const usersSheet = SS.getSheetByName('Users');
  if (usersSheet.getLastRow() === 1) {
    usersSheet.appendRow(['admin01', 'cuteriaa2024', 'Admin', 'Primary Admin']);
  }
  
  SpreadsheetApp.flush();
  return createResponse({ status: 'Setup complete', details: results });
}

function getSheetData(name) {
  const sheet = SS.getSheetByName(name);
  if (!sheet) return createResponse([]);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createResponse([]);
  const headers = data.shift();
  const json = data.map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      // Robust Boolean Interpretation for various input styles
      if (val !== null && val !== undefined) {
        const strVal = String(val).trim().toLowerCase();
        if (strVal === 'true' || strVal === 'yes' || strVal === '1' || strVal === 'featured') {
           val = true;
        } else if (strVal === 'false' || strVal === 'no' || strVal === '0') {
           val = false;
        }
      }
      obj[h] = val;
    });
    return obj;
  });
  return createResponse(json);
}

function upsertData(sheetName, dataObj, keyName) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet '" + sheetName + "' not found. Run Initial Setup.");
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const keyIndex = headers.map(h => String(h).toLowerCase()).indexOf(keyName.toLowerCase());
  if (keyIndex === -1) throw new Error("Key '" + keyName + "' not found in headers of " + sheetName);

  // Robustly find the ID value in dataObj (case-insensitive key)
  const actualDataKey = Object.keys(dataObj).find(k => k.toLowerCase() === keyName.toLowerCase());
  const searchId = String(dataObj[actualDataKey] || '').trim().toUpperCase();
  
  if (!searchId) throw new Error("Operation failed: Missing unique identifier (" + keyName + ")");

  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][keyIndex]).trim().toUpperCase() === searchId) {
      rowIdx = i + 1;
      break;
    }
  }

  const rowData = headers.map(h => {
    const dataKey = Object.keys(dataObj).find(k => k.toLowerCase() === String(h).toLowerCase());
    let val = dataKey !== undefined ? dataObj[dataKey] : '';
    
    if (val === undefined || val === null) return '';
    // Handle array/object serialization
    if (typeof val === 'object' && !(val instanceof Date)) {
      try { return JSON.stringify(val); } catch(e) { return String(val); }
    }
    return val;
  });

  if (rowIdx > -1) {
    sheet.getRange(rowIdx, 1, 1, headers.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  SpreadsheetApp.flush();
}

function deleteRowById(sheetName, id, keyName) {
  const sheet = SS.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const keyIndex = headers.map(h => String(h).toLowerCase()).indexOf(keyName.toLowerCase());
  if (keyIndex === -1) return;

  const searchId = String(id).trim().toUpperCase();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][keyIndex]).trim().toUpperCase() === searchId) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  SpreadsheetApp.flush();
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function sendOrderEmail(order) {
  const customer = typeof order.customer === 'string' ? JSON.parse(order.customer) : order.customer;
  if (!customer || !customer.email) return;

  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
  
  let itemsHtml = '';
  if (Array.isArray(items)) {
    itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border: 1px solid #eee;">${item.name || item.productName || 'Custom Product'}</td>
        <td style="padding: 10px; border: 1px solid #eee; text-align: center;">${item.quantity || 1}</td>
        <td style="padding: 10px; border: 1px solid #eee; text-align: right;">${typeof item.price === 'number' ? '৳' + item.price : (item.price || 0)}</td>
      </tr>
    `).join('');
  }

  const hasPrebook = Array.isArray(items) && items.some(item => typeof item.price === 'string' && item.price.toLowerCase().includes('prebook'));
  const firstProductName = Array.isArray(items) && items.length > 0 ? (items[0].name || items[0].productName || 'Custom Product') : 'Custom Product';
  
  if (hasPrebook) {
    const subject = `Confirmed: Your pre-book order for ${firstProductName} is successful! 🎉`;
    const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Extra variant info
    const variants = items.map(i => {
      let variant = [];
      if (i.color) variant.push(i.color);
      if (i.size) variant.push(i.size);
      return variant.length > 0 ? variant.join(", ") : "Standard";
    }).join(" | ");

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p style="font-size: 16px;">Hi ${customer.name || 'Valued Customer'},</p>
        
        <p style="font-size: 16px;">Thank you for pre-booking with us! We are excited to let you know that your pre-book order has been successfully registered.</p>
        <p style="font-size: 16px;">Our team is currently processing your request and will contact you very soon to finalize the next steps and provide delivery details.</p>
        
        <p style="font-size: 16px;">Here are the details of your pre-booked item:</p>
        
        <h3 style="border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; margin-top: 30px; text-transform: uppercase; letter-spacing: 1px; font-size: 14px;">Order Summary</h3>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px;">
          <p style="margin: 5px 0;"><strong>Product Name:</strong> ${firstProductName}</p>
          <p style="margin: 5px 0;"><strong>Model/Variant:</strong> ${variants}</p>
          <p style="margin: 5px 0;"><strong>Pre-book Date:</strong> ${todayStr}</p>
          <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order.id}</p>
        </div>

        <h3 style="border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; margin-top: 30px; text-transform: uppercase; letter-spacing: 1px; font-size: 14px;">What happens next?</h3>
        <p style="font-size: 16px;">We will send you another update as soon as your order has shipped or when further steps are required. If you notice any errors in the information above, please reply to this email immediately.</p>
        
        <p style="font-size: 16px; margin-top: 30px;">Thanks for your order!</p>
        
        <p style="font-size: 16px; margin-top: 20px;">
          Best regards,<br>
          <strong>Cuteriaa</strong><br>
          <a href="https://wa.me/8801736346273" style="color: #25D366; text-decoration: none; font-weight: 500;">WhatsApp Us</a>
        </p>
      </div>
    `;

    const body = `Confirmed: Your pre-book order for ${firstProductName} is successful! 🎉

Hi ${customer.name || 'Valued Customer'},

Thank you for pre-booking with us! We are excited to let you know that your pre-book order has been successfully registered.

Our team is currently processing your request and will contact you very soon to finalize the next steps and provide delivery details.

Here are the details of your pre-booked item:

Order Summary
Product Name: ${firstProductName}
Model/Variant: ${variants}
Pre-book Date: ${todayStr}
Order ID: #${order.id}

What happens next?
We will send you another update as soon as your order has shipped.

Thanks for your order!

Best regards,
Cuteriaa`;

    MailApp.sendEmail({
      to: customer.email,
      subject: subject,
      body: body,
      htmlBody: htmlBody
    });
    return;
  }

  const subjectPrefix = 'Order Confirmation';
  const subject = `${subjectPrefix} - Your Order #${order.id} is being processed!`;
  
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
      <p style="font-size: 16px;">Hi ${customer.name || 'Valued Customer'},</p>
      
      <p style="font-size: 16px;">Thank you for your order! We're thrilled that you chose us for your custom needs. Our team is already getting started on preparing everything just for you.</p>
      <p style="font-size: 16px;">Please find your order details and delivery information summarized below.</p>
      
      <h3 style="border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; margin-top: 30px; text-transform: uppercase; letter-spacing: 1px; font-size: 14px;">Customer Information</h3>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px;">
        <p style="margin: 5px 0;"><strong>Name:</strong> ${customer.name || 'N/A'}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${customer.email}</p>
        <p style="margin: 5px 0;"><strong>Phone Number:</strong> ${customer.phone || 'N/A'}</p>
        <p style="margin: 5px 0;"><strong>Shipping Address:</strong> ${customer.address || 'N/A'}${customer.thana ? ', ' + customer.thana : ''}${customer.district ? ', ' + customer.district : ''}</p>
      </div>

      <h3 style="border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; margin-top: 30px; text-transform: uppercase; letter-spacing: 1px; font-size: 14px;">Order Summary</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 15px;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; border: 1px solid #eee; text-align: left;">Product Name</th>
            <th style="padding: 10px; border: 1px solid #eee; text-align: center;">Quantity</th>
            <th style="padding: 10px; border: 1px solid #eee; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 10px; border: 1px solid #eee; text-align: right; font-weight: bold;">Subtotal</td>
            <td style="padding: 10px; border: 1px solid #eee; text-align: right;">৳${order.subtotal || order.total}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 10px; border: 1px solid #eee; text-align: right; font-weight: bold;">Delivery Charge</td>
            <td style="padding: 10px; border: 1px solid #eee; text-align: right;">৳${order.deliveryCharge || 0}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 12px 10px; border: 1px solid #eee; text-align: right; font-weight: 900; font-size: 16px;">Total</td>
            <td style="padding: 12px 10px; border: 1px solid #eee; text-align: right; font-weight: 900; font-size: 16px;">৳${order.total}</td>
          </tr>
        </tfoot>
      </table>

      <h3 style="border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; margin-top: 30px; text-transform: uppercase; letter-spacing: 1px; font-size: 14px;">Next Steps</h3>
      <p style="font-size: 16px;">We will send you another update as soon as your order has shipped. If you notice any errors in the information above, please reply to this email immediately so we can make the necessary adjustments.</p>
      
      <p style="font-size: 16px; margin-top: 20px; background-color: #f0f0f0; padding: 15px; border-radius: 8px; font-weight: 600;">
        Order ID: #${order.id}
      </p>
      
      <p style="font-size: 16px; margin-top: 30px;">Thanks for your order!</p>
      
      <p style="font-size: 16px; margin-top: 20px;">
        Best regards,<br>
        <strong>Cuteriaa</strong><br>
        <a href="https://wa.me/8801736346273" style="color: #25D366; text-decoration: none; font-weight: 500;">WhatsApp Us</a>
      </p>
    </div>
  `;

  const body = `Order Confirmation - Your Order #${order.id} is being processed!
Hi ${customer.name || 'Valued Customer'},

Thank you for your order! We're thrilled that you chose us for your custom needs. Our team is already getting started on preparing everything just for you.
Please find your order details and delivery information summarized below.

Customer Information:
Name: ${customer.name || 'N/A'}
Email: ${customer.email}
Phone: ${customer.phone || 'N/A'}
Address: ${customer.address || 'N/A'}

Order Summary:
Total: ৳${order.total}

Next Steps:
We will send you another update as soon as your order has shipped. If you notice any errors in the information above, please reply to this email immediately so we can make the necessary adjustments.

Order ID: #${order.id}

Thanks for your order!

Best regards,
Cuteriaa`;

  MailApp.sendEmail({
    to: customer.email,
    subject: subject,
    body: body,
    htmlBody: htmlBody
  });
}

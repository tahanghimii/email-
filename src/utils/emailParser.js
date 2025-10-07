// Consolidated getFileType function
export const getFileType = (filename) => {
  if (!filename) return 'file';
  const ext = filename.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) return 'image';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'document';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spreadsheet';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
  return 'file';
};

// Function to decode quoted-printable encoding
const decodeQuotedPrintable = (text) => {
  if (!text) return '';
  
  return text
    .replace(/=\r?\n/g, '') // Remove soft line breaks
    .replace(/=([0-9A-F]{2})/gi, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    })
    .trim();
};

// Improved HTML to text extraction
const extractTextFromHTML = (html) => {
  if (!html) return '';
  
  let text = html
    // Remove scripts and styles
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Replace block elements with newlines
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/td>/gi, ' ')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/table>/gi, '\n')
    // Handle lists
    .replace(/<li>/gi, '\n• ')
    // Remove all other tags
    .replace(/<[^>]+>/g, '')
    // Replace HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
};

// Improved multipart content parsing
const parseMultipartContent = (text) => {
  // Find boundary - handle different boundary formats
  const boundaryMatch = text.match(/boundary=([^;\r\n]+)/i) || text.match(/boundary="([^"]+)"/i);
  if (!boundaryMatch) {
    // If no boundary found, try to extract the actual content directly
    return extractContentFromRawMultipart(text);
  }

  const boundary = boundaryMatch[1].replace(/"/g, '').trim();
  
  // Split by boundary
  const parts = text.split(`--${boundary}`);

  let plainText = '';
  let htmlText = '';

  for (let part of parts) {
    if (!part.trim() || part.includes('--') && part.trim().length < 10) continue;

    // Skip attachments in body parsing
    if (part.includes('Content-Disposition: attachment')) {
      continue;
    }

    const contentTypeMatch = part.match(/Content-Type:\s*([^;\r\n]+)/i);
    const encodingMatch = part.match(/Content-Transfer-Encoding:\s*([^;\r\n]+)/i);
    
    if (!contentTypeMatch) {
      continue;
    }

    const contentType = contentTypeMatch[1].toLowerCase().trim();
    const encoding = encodingMatch ? encodingMatch[1].toLowerCase().trim() : '7bit';

    // Find content start (after headers)
    const contentStart = part.indexOf('\r\n\r\n');
    let content = '';
    
    if (contentStart === -1) {
      // Try with double newlines
      const contentStartAlt = part.indexOf('\n\n');
      if (contentStartAlt === -1) {
        continue;
      }
      content = part.substring(contentStartAlt + 2);
    } else {
      content = part.substring(contentStart + 4);
    }

    // Clean content - remove trailing boundary markers
    content = content.split('--')[0].trim();

    // Decode content based on encoding
    if (encoding === 'quoted-printable') {
      content = decodeQuotedPrintable(content);
    } else if (encoding === 'base64' && contentType.includes('text/')) {
      try {
        content = atob(content.replace(/[\r\n\s]/g, ''));
      } catch (e) {
        console.warn('Failed to decode base64 content:', e);
      }
    }

    // Store content based on type
    if (contentType.includes('text/plain')) {
      plainText = content;
    } else if (contentType.includes('text/html')) {
      htmlText = content;
    }
  }

  // Prefer plain text, fall back to HTML, then original text
  if (plainText.trim()) {
    return plainText.trim();
  } else if (htmlText.trim()) {
    const extracted = extractTextFromHTML(htmlText);
    return extracted;
  }
  
  // If nothing found, try direct extraction
  return extractContentFromRawMultipart(text);
};

// Fallback function for direct multipart extraction
const extractContentFromRawMultipart = (text) => {
  // Try to find text content between boundaries
  const boundaries = text.match(/--_([A-Z0-9_]+)/g) || [];
  let bestContent = '';
  
  for (let i = 0; i < boundaries.length - 1; i++) {
    const currentBoundary = boundaries[i].replace(/^--/, '');
    const nextBoundary = boundaries[i + 1] ? boundaries[i + 1].replace(/^--/, '') : '--';
    
    const partStart = text.indexOf(currentBoundary) + currentBoundary.length;
    const partEnd = text.indexOf(nextBoundary, partStart);
    
    if (partStart === -1 || partEnd === -1) continue;
    
    let partContent = text.substring(partStart, partEnd);
    
    // Look for text content
    if (partContent.includes('text/plain') || partContent.includes('text/html')) {
      // Extract content after headers
      const contentMatch = partContent.match(/\r\n\r\n(.*?)(?=\r\n--|$)/s);
      if (contentMatch) {
        let content = contentMatch[1].trim();
        
        // Try quoted-printable decoding
        if (content.includes('=')) {
          content = decodeQuotedPrintable(content);
        }
        
        // Remove any remaining boundary artifacts
        content = content.replace(/--_([A-Z0-9_]+)/g, '').trim();
        
        if (content.length > bestContent.length) {
          bestContent = content;
        }
      }
    }
  }
  
  return bestContent || text;
};

// Clean email body
const cleanEmailBody = (body) => {
  if (!body) return '';

  let cleaned = body
    // Remove email headers that might be in body
    .replace(/^From:.*$/gmi, '')
    .replace(/^To:.*$/gmi, '')
    .replace(/^Subject:.*$/gmi, '')
    .replace(/^Date:.*$/gmi, '')
    .replace(/^Sent:.*$/gmi, '')
    // Remove boundary artifacts
    .replace(/--_([A-Z0-9_]+)/g, '')
    .replace(/Content-Type:.*?(\n|$)/gi, '')
    .replace(/Content-Transfer-Encoding:.*?(\n|$)/gi, '')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+/gm, '')
    .trim();

  return cleaned;
};

// Main function to extract and clean email body
const extractEmailBody = (fullText) => {
  let body = fullText;

  // Handle multipart emails
  if (fullText.includes('Content-Type: multipart/') || fullText.includes('--_')) {
    body = parseMultipartContent(fullText);
  }

  // If it looks like HTML, extract text
  if (body.includes('<html') || body.includes('<body') || body.includes('<div') || body.includes('<p>')) {
    body = extractTextFromHTML(body);
  }

  // Clean the body
  body = cleanEmailBody(body);

  return body || 'No readable content found.';
};

// Extract attachments
const extractAttachments = (text) => {
  const attachments = [];
  const boundaryMatch = text.match(/boundary=([^;\r\n]+)/i);
  
  if (!boundaryMatch) return attachments;

  const boundary = boundaryMatch[1].replace(/"/g, '');
  const parts = text.split(`--${boundary}`);

  for (let part of parts) {
    if (!part.trim() || part === '--') continue;

    // Check if this is an attachment
    const isAttachment = part.includes('Content-Disposition: attachment') || 
                        (part.includes('Content-Disposition:') && part.includes('filename='));

    if (!isAttachment) continue;

    // Extract filename
    const filenameMatch = part.match(/filename=([^;\r\n]+)/i);
    if (!filenameMatch) continue;

    let filename = filenameMatch[1].replace(/"/g, '').trim();

    // Extract content type
    const contentTypeMatch = part.match(/Content-Type:\s*([^;\r\n]+)/i);
    const contentType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';

    // Extract encoding
    const encodingMatch = part.match(/Content-Transfer-Encoding:\s*([^;\r\n]+)/i);
    const encoding = encodingMatch ? encodingMatch[1].toLowerCase().trim() : '7bit';

    // Extract content
    const contentStart = part.indexOf('\r\n\r\n');
    if (contentStart === -1) continue;

    let content = part.substring(contentStart + 4).trim();

    // Calculate size
    let size = 'Unknown';
    if (encoding === 'base64') {
      const cleanContent = content.replace(/[\r\n]/g, '');
      const bytes = (cleanContent.length * 3) / 4;
      if (bytes < 1024) {
        size = Math.round(bytes) + ' B';
      } else if (bytes < 1024 * 1024) {
        size = (bytes / 1024).toFixed(2) + ' KB';
      } else {
        size = (bytes / (1024 * 1024)).toFixed(2) + ' MB';
      }
    }

    attachments.push({
      name: filename,
      size: size,
      type: getFileType(filename),
      contentType: contentType,
      encoding: encoding,
      data: content
    });
  }

  return attachments;
};

// Parse EML files
export const parseEMLFile = async (file) => {
  try {
    const text = await file.text();
    const lines = text.split('\n');
    
    let from = '', to = '', subject = '', date = '';
    let headersParsed = false;
    let bodyStartIndex = 0;
    
    // Parse headers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim() === '' && !headersParsed) {
        headersParsed = true;
        bodyStartIndex = i + 1;
        break;
      }
      
      if (line.startsWith('From:')) from = line.replace('From:', '').trim();
      else if (line.startsWith('To:')) to = line.replace('To:', '').trim();
      else if (line.startsWith('Subject:')) subject = line.replace('Subject:', '').trim();
      else if (line.startsWith('Date:')) date = line.replace('Date:', '').trim();
    }
    
    // Get the body content
    const bodyText = lines.slice(bodyStartIndex).join('\n');
    
    // Extract and clean the body
    const body = extractEmailBody(bodyText);
    
    // Extract attachments
    const attachments = extractAttachments(text);
    
    return { 
      from: from || 'Unknown', 
      to: to || 'Unknown', 
      subject: subject || 'No Subject', 
      date: date || 'Unknown Date', 
      body: body, 
      attachments 
    };
  } catch (error) {
    console.error('Error parsing EML file:', error);
    throw new Error('Failed to parse EML file');
  }
};

// Parse MSG files
export const parseMSGFile = async (file) => {
  return {
    from: 'MSG file - conversion to EML recommended',
    to: 'Recipient information not available',
    subject: file.name.replace(/\.msg$/i, ''),
    date: new Date().toISOString(),
    body: 'For full MSG file parsing, please convert to EML format or use a specialized MSG parser library.',
    attachments: []
  };
};
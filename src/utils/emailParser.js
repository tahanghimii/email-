import MsgReader from "msgreader";

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
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/td>/gi, ' ')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/table>/gi, '\n')
    .replace(/<li>/gi, '\n• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
};

// Improved multipart content parsing
const parseMultipartContent = (text) => {
  const boundaryMatch = text.match(/boundary=([^;\r\n]+)/i) || text.match(/boundary="([^"]+)"/i);
  if (!boundaryMatch) return extractContentFromRawMultipart(text);

  const boundary = boundaryMatch[1].replace(/"/g, '').trim();
  const parts = text.split(`--${boundary}`);
  let plainText = '';
  let htmlText = '';

  for (let part of parts) {
    if (!part.trim() || (part.includes('--') && part.trim().length < 10)) continue;
    if (part.includes('Content-Disposition: attachment')) continue;

    const contentTypeMatch = part.match(/Content-Type:\s*([^;\r\n]+)/i);
    const encodingMatch = part.match(/Content-Transfer-Encoding:\s*([^;\r\n]+)/i);
    if (!contentTypeMatch) continue;

    const contentType = contentTypeMatch[1].toLowerCase().trim();
    const encoding = encodingMatch ? encodingMatch[1].toLowerCase().trim() : '7bit';
    const contentStart = part.indexOf('\r\n\r\n');
    let content = '';

    if (contentStart === -1) {
      const alt = part.indexOf('\n\n');
      if (alt === -1) continue;
      content = part.substring(alt + 2);
    } else {
      content = part.substring(contentStart + 4);
    }

    content = content.split('--')[0].trim();

    if (encoding === 'quoted-printable') {
      content = decodeQuotedPrintable(content);
    } else if (encoding === 'base64' && contentType.includes('text/')) {
      try {
        content = atob(content.replace(/[\r\n\s]/g, ''));
      } catch (e) {
        console.warn('Failed to decode base64 content:', e);
      }
    }

    if (contentType.includes('text/plain')) {
      plainText = content;
    } else if (contentType.includes('text/html')) {
      htmlText = content;
    }
  }

  if (plainText.trim()) return plainText.trim();
  if (htmlText.trim()) return extractTextFromHTML(htmlText);
  return extractContentFromRawMultipart(text);
};

// Fallback function for direct multipart extraction
const extractContentFromRawMultipart = (text) => {
  const boundaries = text.match(/--_([A-Z0-9_]+)/g) || [];
  let bestContent = '';

  for (let i = 0; i < boundaries.length - 1; i++) {
    const currentBoundary = boundaries[i].replace(/^--/, '');
    const nextBoundary = boundaries[i + 1] ? boundaries[i + 1].replace(/^--/, '') : '--';
    const partStart = text.indexOf(currentBoundary) + currentBoundary.length;
    const partEnd = text.indexOf(nextBoundary, partStart);
    if (partStart === -1 || partEnd === -1) continue;

    let partContent = text.substring(partStart, partEnd);

    if (partContent.includes('text/plain') || partContent.includes('text/html')) {
      const contentMatch = partContent.match(/\r\n\r\n(.*?)(?=\r\n--|$)/s);
      if (contentMatch) {
        let content = contentMatch[1].trim();
        if (content.includes('=')) content = decodeQuotedPrintable(content);
        content = content.replace(/--_([A-Z0-9_]+)/g, '').trim();
        if (content.length > bestContent.length) bestContent = content;
      }
    }
  }
  return bestContent || text;
};

// Clean email body
const cleanEmailBody = (body) => {
  if (!body) return '';
  return body
    .replace(/^From:.*$/gmi, '')
    .replace(/^To:.*$/gmi, '')
    .replace(/^Subject:.*$/gmi, '')
    .replace(/^Date:.*$/gmi, '')
    .replace(/^Sent:.*$/gmi, '')
    .replace(/--_([A-Z0-9_]+)/g, '')
    .replace(/Content-Type:.*?(\n|$)/gi, '')
    .replace(/Content-Transfer-Encoding:.*?(\n|$)/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+/gm, '')
    .trim();
};

// Main function to extract and clean email body
const extractEmailBody = (fullText) => {
  let body = fullText;
  if (fullText.includes('Content-Type: multipart/') || fullText.includes('--_')) {
    body = parseMultipartContent(fullText);
  }
  if (body.includes('<html') || body.includes('<body') || body.includes('<div') || body.includes('<p>')) {
    body = extractTextFromHTML(body);
  }
  return cleanEmailBody(body) || 'No readable content found.';
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

    const isAttachment = part.includes('Content-Disposition: attachment') || 
                         (part.includes('Content-Disposition:') && part.includes('filename='));
    if (!isAttachment) continue;

    const filenameMatch = part.match(/filename=([^;\r\n]+)/i);
    if (!filenameMatch) continue;

    let filename = filenameMatch[1].replace(/"/g, '').trim();
    const contentTypeMatch = part.match(/Content-Type:\s*([^;\r\n]+)/i);
    const contentType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';
    const encodingMatch = part.match(/Content-Transfer-Encoding:\s*([^;\r\n]+)/i);
    const encoding = encodingMatch ? encodingMatch[1].toLowerCase().trim() : '7bit';
    const contentStart = part.indexOf('\r\n\r\n');
    if (contentStart === -1) continue;

    let content = part.substring(contentStart + 4).trim();

    let size = 'Unknown';
    if (encoding === 'base64') {
      const cleanContent = content.replace(/[\r\n]/g, '');
      const bytes = (cleanContent.length * 3) / 4;
      if (bytes < 1024) size = Math.round(bytes) + ' B';
      else if (bytes < 1024 * 1024) size = (bytes / 1024).toFixed(2) + ' KB';
      else size = (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    attachments.push({
      name: filename,
      size,
      type: getFileType(filename),
      contentType,
      encoding,
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

    const bodyText = lines.slice(bodyStartIndex).join('\n');
    const body = extractEmailBody(bodyText);
    const attachments = extractAttachments(text);

    return { from, to, subject, date, body, attachments };
  } catch (error) {
    console.error('Error parsing EML file:', error);
    throw new Error('Failed to parse EML file');
  }
};

// ✅ Parse MSG files (real support)
export const parseMSGFile = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const msg = new MsgReader(arrayBuffer);
    const msgInfo = msg.getFileData();

    const attachments = msgInfo.attachments?.map(att => ({
      name: att.fileName,
      size: att.data.byteLength ? `${(att.data.byteLength / 1024).toFixed(2)} KB` : 'Unknown',
      type: getFileType(att.fileName),
      contentType: att.mimeType || 'application/octet-stream',
      encoding: 'base64',
      data: att.content ? btoa(String.fromCharCode(...new Uint8Array(att.content))) : null
    })) || [];

    return {
      from: msgInfo.senderEmail || 'Unknown',
      to: msgInfo.recipients?.map(r => r.email).join(', ') || 'Unknown',
      subject: msgInfo.subject || 'No Subject',
      date: msgInfo.messageDeliveryTime || new Date().toISOString(),
      body: msgInfo.body || msgInfo.bodyHTML || 'No message body',
      attachments
    };
  } catch (error) {
    console.error('Error parsing MSG file:', error);
    throw new Error('Failed to parse MSG file');
  }
};

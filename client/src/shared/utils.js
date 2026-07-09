/**
 * Converts a viewable Google Drive / Google Docs link into its direct download URL.
 * Supports standard Google Drive files, Google Docs, Sheets, and Slides.
 * 
 * @param {string} url - The original URL
 * @returns {string} The direct download URL
 */
export function getDirectDownloadLink(url) {
  if (!url) return '#';
  try {
    // 1. Google Drive file link: drive.google.com/file/d/FILE_ID/view...
    const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch && fileMatch[1]) {
      return `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`;
    }

    // 2. Google Drive open/uc link: drive.google.com/open?id=FILE_ID
    const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
    if (openMatch && openMatch[1]) {
      return `https://drive.google.com/uc?export=download&id=${openMatch[1]}`;
    }

    // 3. Google Docs link: docs.google.com/document/d/FILE_ID/...
    const docMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (docMatch && docMatch[1]) {
      return `https://docs.google.com/document/d/${docMatch[1]}/export?format=pdf`;
    }

    // 4. Google Sheets link: docs.google.com/spreadsheets/d/FILE_ID/...
    const sheetMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (sheetMatch && sheetMatch[1]) {
      return `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/export?format=pdf`;
    }

    // 5. Google Slides link: docs.google.com/presentation/d/FILE_ID/...
    const slideMatch = url.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
    if (slideMatch && slideMatch[1]) {
      return `https://docs.google.com/presentation/d/${slideMatch[1]}/export/pdf`;
    }
  } catch (e) {
    // Return original url if parsing fails
  }
  return url;
}

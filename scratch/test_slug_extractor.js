function extractProductQueryFromUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const urlStr = rawUrl.trim();
    const urlObj = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname;
    const segments = pathname.split('/').filter(Boolean);

    let slug = '';

    // 1. Amazon: Segment before /dp/ or /gp/product/
    if (hostname.includes('amazon')) {
      const dpIdx = segments.findIndex(s => s.toLowerCase() === 'dp');
      if (dpIdx > 0) {
        slug = segments[dpIdx - 1];
      } else {
        const gpIdx = segments.findIndex(s => s.toLowerCase() === 'product' || s.toLowerCase() === 'gp');
        if (gpIdx > 0) {
          if (segments[gpIdx].toLowerCase() === 'product' && segments[gpIdx - 1].toLowerCase() === 'gp' && gpIdx > 1) {
            slug = segments[gpIdx - 2];
          } else if (segments[gpIdx - 1].toLowerCase() !== 'gp') {
            slug = segments[gpIdx - 1];
          }
        }
      }
    }
    // 2. Flipkart: Segment before /p/
    else if (hostname.includes('flipkart')) {
      const pIdx = segments.findIndex(s => s.toLowerCase() === 'p');
      if (pIdx > 0) {
        slug = segments[pIdx - 1];
      }
    }
    // 3. Myntra / Other
    else if (hostname.includes('myntra') || hostname.includes('tatacliq')) {
      if (segments.length > 0) {
        slug = segments[segments.length - 1];
      }
    }

    // Fallback if specific platform pattern did not catch it
    if (!slug) {
      for (const seg of segments) {
        if (
          seg.length > 3 &&
          !['dp', 'p', 'gp', 'product', 'buy', 'item', 'itm', 'pd', 'ref', 's', 'd'].includes(seg.toLowerCase()) &&
          !/^[A-Z0-9]{10}$/i.test(seg)
        ) {
          slug = seg;
          break;
        }
      }
    }

    if (!slug && segments.length > 0) {
      slug = segments[0];
    }

    // Clean noise tokens and format
    let clean = decodeURIComponent(slug || '');
    // Remove noise tokens
    clean = clean.replace(/\b(ref|sr|dp|gp|product)\b/gi, ' ');
    // Separate attached numbers and units (e.g. toy20cm -> toy 20 cm, 40mm -> 40 mm)
    clean = clean.replace(/([a-zA-Z]+)(\d+)/g, '$1 $2');
    clean = clean.replace(/(\d+)([a-zA-Z]+)/g, '$1 $2');
    // Replace hyphens, underscores, pluses with spaces
    clean = clean.replace(/[-_+/.]/g, ' ');
    // Normalize spaces
    clean = clean.replace(/\s+/g, ' ').trim();

    return clean;
  } catch (err) {
    return '';
  }
}

const testUrls = [
  'https://www.amazon.in/GoSriKi-Women-Rayon-Viscose-Printed/dp/B0BXYZ123',
  'https://www.amazon.in/GoSriKi-Women-Kurta-Pant-Dupatta-Set/dp/B084GZ9M1Z?ref_=Oct_d_obs_m_1968253031',
  'https://www.amazon.in/something-else/GoSriKi-Women-Rayon-Viscose-Printed-Suit/dp/B012345678/ref=sr_1_1',
  'https://www.flipkart.com/collective-stitch-wool-embroidered-women-shawl/p/itm123456789?pid=SHW123',
  'https://www.amazon.in/SCOOBA-Fabric-Piggy-toy20cm-Height/dp/B08XYS1234',
];

for (const u of testUrls) {
  const q = extractProductQueryFromUrl(u);
  console.log('URL:', u);
  console.log('Extracted Query:', q);
  console.log('---');
}

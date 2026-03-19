const sharp = require('sharp');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

module.exports = async (req, res) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const {
      url, url2 = '',
      barh = '130', barcol = 'FFFFFF', sepcol = 'E8E2D9', sepw = '2',
      brand = '1', brandname = 'ACCESORIOS AVE MARÍA', brandsz = '20', brandcol = '2C2C2C',
      sub = '1', subtxt = 'Tienda Online Oficial', subcol = '888780',
      pname = '1', pnameval = '', pnamecol = '2C2C2C', pnamesz = '15',
      label = '0', labeltxt = '', lbgcol = 'C9A84C', ltxtcol = 'FFFFFF',
      urlshow = '1', urlval = 'accesoriosavemaria.com', urlcol = 'A8A9AD',
    } = req.query;

    if (!url) return res.status(400).json({ error: 'Missing url' });

    const SIZE = 1080;
    const barH = parseInt(barh);
    const sepW = parseInt(sepw);
    const photoH = SIZE - barH - sepW;

    try {
      // Fetch and process images
      const fetchImg = async (imgUrl) => {
  const r = await fetch(imgUrl);
  const buf = Buffer.from(await r.arrayBuffer());
  return sharp(buf, { failOn: 'none' })
    .toFormat('png')
    .toBuffer();
};

      const buf1 = await fetchImg(url);
      const buf2 = url2 ? await fetchImg(url2) : null;

      const gap = buf2 ? 4 : 0;
      const photoW = buf2 ? Math.floor((SIZE - gap) / 2) : SIZE;

const resizeSlot = async (buf, w, h) => {
  return sharp(buf)
    .resize(w, h, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
};

      const img1 = await resizeSlot(buf1, photoW, photoH);
      const img2 = buf2 ? await resizeSlot(buf2, photoW, photoH) : null;

      // Parse colors helper
      const hex = (h) => {
        const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
        return { r, g, b, css: `rgb(${r},${g},${b})` };
      };

      const barC = hex(barcol);
      const sepC = hex(sepcol);
      const brandC = hex(brandcol);
      const subC = hex(subcol);
      const pnameC = hex(pnamecol);
      const lbgC = hex(lbgcol);
      const ltxtC = hex(ltxtcol);
      const urlC = hex(urlcol);

      const brandSz = parseInt(brandsz);
      const pnameSz = parseInt(pnamesz);
      const decodedBrand = decodeURIComponent(brandname);
      const decodedSub = decodeURIComponent(subtxt);
      const decodedPname = decodeURIComponent(pnameval);
      const decodedLabel = decodeURIComponent(labeltxt);
      const decodedUrl = decodeURIComponent(urlval);

      // Build bar SVG
      const barY = photoH + sepW;
      const barCenterY = barH / 2;

      let svgContent = '';

      // Bar background
      svgContent += ``;

      // Separator
      if (sepW > 0) {
        svgContent += ``;
      }

      // Gap between photos
      if (buf2) {
        svgContent += ``;
      }

      // Brand name centered in bar
      if (brand === '1') {
        const subOffset = sub === '1' ? -brandSz * 0.45 : brandSz * 0.35;
        svgContent += `${decodedBrand}`;
      }

      // Sub text
      if (sub === '1') {
        const subSz = Math.round(brandSz * 0.62);
        const subOffset = brand === '1' ? brandSz * 0.95 : 0;
        svgContent += `${decodedSub}`;
      }

      // Product name — bottom left of bar
      if (pname === '1' && decodedPname) {
        svgContent += `${decodedPname}`;
      }

      // URL — top right of bar
      if (urlshow === '1') {
        const urlSz = Math.round(brandSz * 0.5);
        svgContent += `${decodedUrl}`;
      }

      // Label badge
      if (label === '1' && decodedLabel) {
        const lSz = Math.round(brandSz * 0.65);
        const lPad = 16, lH = lSz + lPad;
        const lW = decodedLabel.length * lSz * 0.6 + lPad * 2;
        svgContent += ``;
        svgContent += `${decodedLabel}`;
      }

      const svg = `${svgContent}`;

      // Compose final image
      const composites = [
        { input: img1, top: 0, left: 0 },
      ];
      if (img2) composites.push({ input: img2, top: 0, left: photoW + gap });
      composites.push({ input: Buffer.from(svg), top: 0, left: 0 });

      const base = await sharp({
        create: { width: SIZE, height: SIZE, channels: 4, background: { r: barC.r, g: barC.g, b: barC.b, alpha: 255 } }
      })
      .composite(composites)
      .png()
      .toBuffer();

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(base);

    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    const { action, accessToken, catalogId, items, after } = req.body;

    if (action === 'verify') {
      const r = await fetch(`https://graph.facebook.com/v19.0/${catalogId}?fields=name,product_count&access_token=${accessToken}`);
      return res.json(await r.json());
    }

    if (action === 'products') {
      const cursor = after ? `&after=${after}` : '';
      const r = await fetch(`https://graph.facebook.com/v19.0/${catalogId}/products?fields=id,name,retailer_id,image_url,price&limit=50${cursor}&access_token=${accessToken}`);
      return res.json(await r.json());
    }

    if (action === 'update') {
      const requests = (items || []).map(item => ({
        method: 'UPDATE',
        retailer_id: item.retailer_id,
        data: { image_url: item.image_url }
      }));
      const r = await fetch(`https://graph.facebook.com/v19.0/${catalogId}/items_batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken, item_type: 'PRODUCT_ITEM', requests })
      });
      return res.json(await r.json());
    }

    return res.status(400).json({ error: 'Unknown action' });
  }
};

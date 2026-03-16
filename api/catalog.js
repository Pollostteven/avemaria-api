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
    const { url, frame='C9A84C', style='solido', fw='3', fr='0', pad='28', grad='0', gc='2C2C2C', gopa='55', gs='bottom', logo='1', badge='0', price='', bg='FAF7F2' } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing url' });

    const SIZE = 1080, fwN = +fw, frN = +fr, padN = +pad, gopaF = +gopa/100;
    const fr_r = parseInt(frame.slice(0,2),16), fr_g = parseInt(frame.slice(2,4),16), fr_b = parseInt(frame.slice(4,6),16);
    const bg_r = parseInt(bg.slice(0,2),16), bg_g = parseInt(bg.slice(2,4),16), bg_b = parseInt(bg.slice(4,6),16);
    const gc_r = parseInt(gc.slice(0,2),16), gc_g = parseInt(gc.slice(2,4),16), gc_b = parseInt(gc.slice(4,6),16);
    const fc = `rgb(${fr_r},${fr_g},${fr_b})`;
    const barH = 60, prodH = SIZE - padN*2 - barH, imgArea = SIZE - padN*2;

    try {
      const imgRes = await fetch(url);
      const imgBuf = Buffer.from(await imgRes.arrayBuffer());
      const resized = await sharp(imgBuf).resize(imgArea, prodH, { fit:'inside', background:{r:bg_r,g:bg_g,b:bg_b,alpha:255} }).png().toBuffer();
      const meta = await sharp(resized).metadata();
      const rx = padN + Math.floor((imgArea - meta.width)/2);
      const ry = padN + Math.floor((prodH - meta.height)/2);

      let defs = '', svgBody = '';
      if (grad==='1') {
        if (gs==='bottom') defs += `<linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0.4" stop-color="rgb(${gc_r},${gc_g},${gc_b})" stop-opacity="0"/><stop offset="1" stop-color="rgb(${gc_r},${gc_g},${gc_b})" stop-opacity="${gopaF}"/></linearGradient>`;
        else if (gs==='top') defs += `<linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(${gc_r},${gc_g},${gc_b})" stop-opacity="${gopaF}"/><stop offset="0.6" stop-color="rgb(${gc_r},${gc_g},${gc_b})" stop-opacity="0"/></linearGradient>`;
        else defs += `<radialGradient id="g1" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="rgb(${gc_r},${gc_g},${gc_b})" stop-opacity="0"/><stop offset="100%" stop-color="rgb(${gc_r},${gc_g},${gc_b})" stop-opacity="${gopaF}"/></radialGradient>`;
        svgBody += `<rect width="${SIZE}" height="${SIZE}" fill="url(#g1)"/>`;
      }
      if (style==='solido') svgBody += `<rect x="${fwN/2}" y="${fwN/2}" width="${SIZE-fwN}" height="${SIZE-fwN}" rx="${frN}" fill="none" stroke="${fc}" stroke-width="${fwN}"/>`;
      else if (style==='doble') svgBody += `<rect x="${fwN/2}" y="${fwN/2}" width="${SIZE-fwN}" height="${SIZE-fwN}" rx="${frN}" fill="none" stroke="${fc}" stroke-width="${fwN}"/><rect x="${fwN+6}" y="${fwN+6}" width="${SIZE-fwN*2-12}" height="${SIZE-fwN*2-12}" rx="${Math.max(0,frN-6)}" fill="none" stroke="${fc}" stroke-width="1" opacity="0.6"/>`;
      else if (style==='esquinas') { const cl=Math.min(80,SIZE*.08); [[fwN/2,fwN/2,cl,0,0,cl],[SIZE-fwN/2,fwN/2,-cl,0,0,cl],[SIZE-fwN/2,SIZE-fwN/2,-cl,0,0,-cl],[fwN/2,SIZE-fwN/2,cl,0,0,-cl]].forEach(([x,y,dx,dy,dx2,dy2])=>{ svgBody+=`<polyline points="${x+dx},${y} ${x},${y} ${x},${y+dy2}" fill="none" stroke="${fc}" stroke-width="${fwN}" stroke-linecap="square"/>` }); }
      else if (style==='interno') { const ins=fwN+10; svgBody+=`<rect x="${ins}" y="${ins}" width="${SIZE-ins*2}" height="${SIZE-ins*2}" rx="${Math.max(0,frN-8)}" fill="none" stroke="${fc}" stroke-width="${fwN}"/>`; }

      defs += `<linearGradient id="bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(${bg_r},${bg_g},${bg_b})" stop-opacity="0"/><stop offset="1" stop-color="rgb(${bg_r},${bg_g},${bg_b})" stop-opacity="0.9"/></linearGradient>`;
      svgBody += `<rect x="0" y="${SIZE-barH-10}" width="${SIZE}" height="${barH+10}" fill="url(#bar)"/>`;
      if (logo!=='0') { svgBody+=`<text x="${fwN+22}" y="${SIZE-38}" font-family="sans-serif" font-size="22" font-weight="500" fill="${fc}">ACCESORIOS</text><text x="${fwN+22}" y="${SIZE-12}" font-family="sans-serif" font-size="22" font-weight="500" fill="white">AVE MARÍA</text>`; }
      if (price) svgBody+=`<text x="${SIZE-fwN-22}" y="${SIZE-20}" font-family="sans-serif" font-size="26" font-weight="500" fill="${fc}" text-anchor="end">$${price}</text>`;
      if (badge==='1') { const bw=210; svgBody+=`<rect x="${fwN+6}" y="${fwN+6}" width="${bw}" height="36" fill="${fc}"/><text x="${fwN+20}" y="${fwN+27}" font-family="sans-serif" font-size="16" font-weight="500" fill="white">NUEVA COLECCIÓN</text>`; }
      svgBody+=`<text x="${SIZE/2}" y="${SIZE-fwN-4}" font-family="sans-serif" font-size="14" fill="white" fill-opacity="0.35" text-anchor="middle">accesoriosavemaria.com</text>`;

      const svg = `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs><rect width="${SIZE}" height="${SIZE}" fill="rgb(${bg_r},${bg_g},${bg_b})"/>${svgBody}</svg>`;
      const final = await sharp({create:{width:SIZE,height:SIZE,channels:4,background:{r:bg_r,g:bg_g,b:bg_b,alpha:255}}}).composite([{input:resized,top:ry,left:rx},{input:Buffer.from(svg),top:0,left:0}]).png().toBuffer();
      res.setHeader('Content-Type','image/png');
      res.setHeader('Cache-Control','public, max-age=86400');
      return res.send(final);
    } catch(e) { return res.status(500).json({error:e.message}); }
  }

  if (req.method === 'POST') {
    const { action, accessToken, catalogId, items } = req.body;
    if (action==='verify') { const r=await fetch(`https://graph.facebook.com/v19.0/${catalogId}?fields=name,product_count&access_token=${accessToken}`); return res.json(await r.json()); }
    if (action==='products') { const r=await fetch(`https://graph.facebook.com/v19.0/${catalogId}/products?fields=id,name,retailer_id,image_url,price&limit=50&access_token=${accessToken}`); return res.json(await r.json()); }
    if (action==='update') { const requests=(items||[]).map(i=>({method:'UPDATE',retailer_id:i.retailer_id,data:{image_url:i.image_url}})); const r=await fetch(`https://graph.facebook.com/v19.0/${catalogId}/items_batch`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({access_token:accessToken,item_type:'PRODUCT_ITEM',requests})}); return res.json(await r.json()); }
    return res.status(400).json({error:'Unknown action'});
  }
};

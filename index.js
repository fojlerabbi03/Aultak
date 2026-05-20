const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { generateMetadata } = require('./services/aiSeoService');
const { sendInvoice } = require('./services/emailService');

const app = express();
app.use(cors());
app.use(express.json());

// Supabase Init
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 1. AI Auto-Tag & Create Product
app.post('/api/products', async (req, res) => {
  const { name, category, price, image_url } = req.body;
  
  // Run AI Logic
  const aiData = generateMetadata(name, category);
  
  const { data, error } = await supabase
    .from('products')
    .insert([{ 
      name, category, price, image_url, 
      meta_title: aiData.meta_title,
      meta_desc: aiData.meta_desc,
      tags: aiData.tags
    }]);

  if (error) return res.status(500).json(error);
  res.json({ message: "Product SEO Optimized & Saved", data });
});

// 2. Instant Checkout & Email
app.post('/api/checkout', async (req, res) => {
  const { email, items, total, payment_method } = req.body;

  // Save Order
  const { data: order, error } = await supabase
    .from('orders')
    .insert([{ customer_email: email, items, total, payment_method }]);

  if (error) return res.status(500).json(error);

  // Send Instant Email Invoice
  await sendInvoice({ items, total, payment_method, customer_email: email });

  res.json({ success: true, orderId: order[0].id });
});

app.listen(3001, () => console.log('Aultak Server running on port 3001'));
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

function splitName(fullName) {
  const [first_name, ...rest] = fullName.trim().split(' ');
  const last_name = rest.join(' ') || '';
  return { first_name, last_name };
}

app.post('/webflow-hook', async (req, res) => {
  const { name, email, phone, zip_code, address, location, message } = req.body;
  const { first_name, last_name } = splitName(name);

  // Track submission in CallRail
  try {
    const callrailRes = await axios.post(
      'https://api.callrail.com/v3/a/214552196/form_submissions.json',
      {
        form_submission: {
      name,
      email,
      phone_number: phone,
      submitted_at: new Date().toISOString(),
      form_url: 'https://jarvis-tree-experts.webflow.io/contact',
      referrer: 'https://jarvis-tree-experts.webflow.io/contact' // ✅ Correct key for CallRail
      }
      },
      {
        headers: {
          Authorization: 'Token token=6a7c51cc3ec13c42f627c74941dff8e0',
          'Content-Type': 'application/json',
        }
      }
    );
    console.log('✅ CallRail response:', callrailRes.data);
  } catch (err) {
    console.error('❌ CallRail Error:', err.response?.data || err.message);
  }

  // Submit as a lead to SingleOps
  try {
    const singleOpsRes = await axios.post(
  'https://app.singleops.com/api/v1/jobs',
  {
    job: {
      client_id: null,
      portal_lead: {
        first_name,
        last_name,
        email,
        phone,
        mobile: phone,
        address_1: address,
        zip: zip_code,
        custom_fields: {
          location,
          message
        }
      }
    }
  },
  {
    headers: {
      'api-token': 'cfckGC3u6h_uhEnzdDW7',  // 🔐 Replace with your actual token
      'api-user': 'jarvistreeexperts+apiuser@singleops.com',
      'Content-Type': 'application/json'
    }
  }
    );
    console.log('✅ SingleOps response:', singleOpsRes.data);
  } catch (err) {
    console.error('❌ SingleOps Error:', err.response?.data || err.message);
  }

  res.status(200).json({ success: true, message: 'Form submitted to CallRail & SingleOps' });
});

app.listen(port, () => {
  console.log(`Webhook running at http://localhost:${port}`);
});

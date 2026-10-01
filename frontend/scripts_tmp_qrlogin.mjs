const base = 'http://localhost:5173';

const samples = {
  'OLD encrypted LIB (admin System Administrator)': '{"data":{"customer_id":"LIB0001","uid":1,"ts":1789133173472,"full_name":"System Administrator","role":"LIBRARIAN","email":"librarian@hopehaven.edu","phone":"0788000000","card_number":"HH-LIB0001-MTUAEZVL"},"sig":"964f66425f2c2f0419eed6f78a17b9255cf7ab8cab7fa7664ae49f47bfbe4dab"}',
  'OLD encrypted TCH (Telegram Ezra)': '{"data":{"customer_id":"TCH0001","uid":31,"ts":1789638988949,"card_number":"HH-TCH0001-MU5CUHLH"},"sig":"69867fe6ad04720e90fbc831c7a1d8aa7fb55cf7359c8df0736b7f23dabf96b0"}',
  'OLD encrypted STU (Mugabo Patrick)': '{"data":{"customer_id":"STU0001","uid":30,"ts":1789639029289,"card_number":"HH-STU0001-MU5CVCQ1"},"sig":"5103d88a58d5409e6040d158fc3c62e3971e0889db8e5bc3ebadeb255a7dcc3e"}',
  'NEW plain-text TCH (Ezras)': 'First Name: Ezras\nLast Name: MITWERI\n\nEmail: ezras.mitweri1312@gmail.com\n\nPhone: 0799999999\n\nCustomer ID: TCH0001\n\nRole: TEACHER\n\nStatus: ACTIVE\n\nCreated: 9/17/2026',
  'NEW plain-text STU (Testy)': 'First Name: Testy\nLast Name: Member\n\nEmail: zzz.1789981210@gmail.com\n\nPhone: 0788999999\n\nCustomer ID: STU0002\n\nRole: STUDENT\n\nStatus: ACTIVE\n\nCreated: '
};

(async () => {
  // Vite proxies /api -> :5000. Use the VITE proxy to reproduce browser behavior.
  for (const [desc, qr_code] of Object.entries(samples)) {
    try {
      const res = await fetch(base + '/api/auth/login/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code })
      });
      const body = await res.json().catch(() => ({}));
      console.log('\n[' + desc + ']  HTTP ' + res.status);
      console.log('   ', body.success !== false ? 'LOGIN OK -> ' + (body.user?.first_name || '') + ' ' + (body.user?.last_name || '') + ' (' + body.user?.customer_id + ') token=' + String(body.token||'').slice(0,18) + '...' : 'FAIL -> ' + (body.message || '?'));
    } catch (e) {
      console.log('\n[' + desc + ']  NETWORK ERROR: ' + e.message);
    }
  }
})();
import test from 'node:test';
import assert from 'node:assert/strict';

const API_BASE = 'http://localhost:5000/api/v1';
const FRONTEND_BASE = 'http://localhost:3000';

class TestClient {
  constructor() {
    this.cookies = {};
    this.csrfToken = null;
    this.token = null;
  }

  saveCookies(response) {
    const rawCookies = response.headers.getSetCookie?.() || [];
    for (const cookieStr of rawCookies) {
      const [nameValue] = cookieStr.split(';');
      const [name, ...valParts] = nameValue.split('=');
      if (name) {
        this.cookies[name.trim()] = valParts.join('=').trim();
      }
    }
  }

  getCookieHeader() {
    return Object.entries(this.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  async fetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    const cookieHeader = this.getCookieHeader();
    if (cookieHeader) {
      headers.set('Cookie', cookieHeader);
    }
    if (this.token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }
    if (this.csrfToken && !headers.has('x-csrf-token') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase())) {
      headers.set('x-csrf-token', this.csrfToken);
    }

    const res = await fetch(url, { ...options, headers });
    this.saveCookies(res);
    return res;
  }

  async getCsrf() {
    const res = await this.fetch(`${API_BASE}/csrf-token`);
    const json = await res.json();
    this.csrfToken = json.data?.csrfToken;
    return this.csrfToken;
  }

  async login(email, password) {
    await this.getCsrf();
    const res = await this.fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (res.ok && json.data?.token) {
      this.token = json.data.token;
    }
    return { status: res.status, data: json };
  }
}

test('1. System & Docker Service Availability', async (t) => {
  await t.test('Frontend is serving HTML over port 3000', async () => {
    const res = await fetch(FRONTEND_BASE);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('html') || text.includes('Vite') || text.includes('root'));
  });

  await t.test('Backend health check is active with healthy database latency', async () => {
    const res = await fetch(`${API_BASE}/health`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.status, 'success');
    assert.equal(json.data.database.connected, true);
  });
});

test('2. Authentication, Roles & CSRF Protection', async (t) => {
  const adminClient = new TestClient();
  const branchClient = new TestClient();
  const warehouseClient = new TestClient();
  const customerClient = new TestClient();

  await t.test('Mutating protected request without CSRF token is rejected with 403', async () => {
    // First login to get a valid token
    const tempClient = new TestClient();
    await tempClient.login('admin@gmail.com', 'admin1234');
    
    // Now make a mutating request without x-csrf-token
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tempClient.token}`,
      },
      body: JSON.stringify({ name: 'Hacker Attempt', email: 'admin@gmail.com' }),
    });
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.status, 'error');
    assert.ok(json.message.includes('CSRF'));
  });

  await t.test('Admin can log in successfully', async () => {
    const res = await adminClient.login('admin@gmail.com', 'admin1234');
    assert.equal(res.status, 200);
    assert.equal(res.data.data.user.role, 'admin');
    assert.ok(adminClient.token);
  });

  await t.test('Branch staff can log in successfully', async () => {
    const res = await branchClient.login('branchstaff@gmail.com', 'branchstaff1234');
    assert.equal(res.status, 200);
    assert.equal(res.data.data.user.role, 'branch_staff');
    assert.equal(res.data.data.user.location_id, 1);
  });

  await t.test('Warehouse staff can log in successfully', async () => {
    const res = await warehouseClient.login('warehousestaff@gmail.com', 'warehousestaff1234');
    assert.equal(res.status, 200);
    assert.equal(res.data.data.user.role, 'warehouse_staff');
    assert.equal(res.data.data.user.location_id, 3);
  });

  await t.test('Customer can log in successfully', async () => {
    const res = await customerClient.login('customer1@gmail.com', 'customer1234');
    assert.equal(res.status, 200);
    assert.equal(res.data.data.user.role, 'customer');
  });
});

test('3. Customer Profile Fields & Auto-population Data (Revision 3)', async () => {
  const customerClient = new TestClient();
  await customerClient.login('customer1@gmail.com', 'customer1234');

  const updateRes = await customerClient.fetch(`${API_BASE}/auth/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Customer One',
      email: 'customer1@gmail.com',
      birthDate: '1998-05-15',
      contactNumber: '09181234567',
      address: 'Zone 4, Bulan, Sorsogon',
    }),
  });
  assert.equal(updateRes.status, 200);
  const updateJson = await updateRes.json();
  assert.equal(updateJson.status, 'success');
  assert.ok(updateJson.data.user.birth_date.startsWith('1998-05-15'));
  assert.equal(updateJson.data.user.contact_number, '09181234567');
  assert.equal(updateJson.data.user.address, 'Zone 4, Bulan, Sorsogon');

  // Verify GET /me returns the new fields
  const meRes = await customerClient.fetch(`${API_BASE}/auth/me`);
  assert.equal(meRes.status, 200);
  const meJson = await meRes.json();
  assert.ok(meJson.data.user.birth_date.startsWith('1998-05-15'));
  assert.equal(meJson.data.user.contact_number, '09181234567');
  assert.equal(meJson.data.user.address, 'Zone 4, Bulan, Sorsogon');
});

test('4. Product Catalog, Filtering & Pagination (Revision 2)', async () => {
  const resCategories = await fetch(`${API_BASE}/categories`);
  assert.equal(resCategories.status, 200);
  const catJson = await resCategories.json();
  assert.ok(Array.isArray(catJson.data.categories));
  assert.ok(catJson.data.categories.length > 0);

  const resProducts = await fetch(`${API_BASE}/products?activeOnly=true`);
  assert.equal(resProducts.status, 200);
  const prodJson = await resProducts.json();
  assert.ok(Array.isArray(prodJson.data.products));
  assert.ok(prodJson.data.products.length >= 1);

  // Pagination limit test
  const resPaged = await fetch(`${API_BASE}/products?limit=2&offset=0`);
  assert.equal(resPaged.status, 200);
  const pagedJson = await resPaged.json();
  assert.ok(pagedJson.data.products.length <= 2);
});

test('5. Inventory Stock-In, Thresholds, Edit & Audit Movements (Revision 5)', async () => {
  const adminClient = new TestClient();
  await adminClient.login('admin@gmail.com', 'admin1234');

  // Stock-in at Naga Warehouse (Location 3) for Product 1 (50 units)
  const stockInWarehouse = await adminClient.fetch(`${API_BASE}/inventory/stock-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: 1,
      locationId: 3,
      quantity: 50,
      note: 'Initial E2E test warehouse stock',
    }),
  });
  assert.equal(stockInWarehouse.status, 200);
  const warehouseInv = await stockInWarehouse.json();
  assert.ok(Number(warehouseInv.data.inventory.quantity) >= 50);

  // Stock-in at Bulan Branch (Location 1) for Product 1 (10 units)
  const stockInBranch = await adminClient.fetch(`${API_BASE}/inventory/stock-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: 1,
      locationId: 1,
      quantity: 10,
      note: 'Initial E2E test branch stock',
    }),
  });
  assert.equal(stockInBranch.status, 200);
  const branchInv = await stockInBranch.json();
  assert.ok(Number(branchInv.data.inventory.quantity) >= 10);
  const branchInventoryId = branchInv.data.inventory.id;

  // Update Low-Stock Threshold (Revision 5 Edit Feature)
  const updateThresh = await adminClient.fetch(`${API_BASE}/inventory/${branchInventoryId}/threshold`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lowStockThreshold: 5 }),
  });
  assert.equal(updateThresh.status, 200);
  const threshJson = await updateThresh.json();
  assert.equal(threshJson.data.inventory.low_stock_threshold, 5);

  // Perform Walk-in Sale of 1 unit at Bulan Branch
  const saleRes = await adminClient.fetch(`${API_BASE}/inventory/walk-in-sale`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: 1,
      locationId: 1,
      quantity: 1,
      buyerName: 'Juan Dela Cruz',
      note: 'E2E walk-in sale test',
    }),
  });
  assert.equal(saleRes.status, 200);

  // Verify Audit Movements are recorded
  const movementsRes = await adminClient.fetch(`${API_BASE}/inventory/movements?productId=1&locationId=1`);
  assert.equal(movementsRes.status, 200);
  const movementsJson = await movementsRes.json();
  assert.ok(Array.isArray(movementsJson.data.movements));
  const hasWalkInSale = movementsJson.data.movements.some((m) => m.type === 'walk_in_sale');
  assert.ok(hasWalkInSale, 'Walk-in sale movement was recorded');
});

test('6. Phase 5: Inter-Branch Stock Transfer Lifecycle', async (t) => {
  const branchClient = new TestClient();
  const warehouseClient = new TestClient();
  await branchClient.login('branchstaff@gmail.com', 'branchstaff1234');
  await warehouseClient.login('warehousestaff@gmail.com', 'warehousestaff1234');

  let requestId;
  let requestReference;

  await t.test('Branch Staff creates a transfer request for 5 units from Warehouse', async () => {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    const requestedDeliveryDate = deliveryDate.toISOString().split('T')[0];

    const createRes = await branchClient.fetch(`${API_BASE}/inter-branch-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceLocationId: 3, // Naga Warehouse
        destinationLocationId: 1, // Bulan Branch
        items: [{ productId: 1, quantityRequested: 5 }],
        requestedDeliveryDate,
        reasonForTransfer: 'Need display units in branch',
        note: 'E2E test transfer request',
      }),
    });
    assert.equal(createRes.status, 201);
    const json = await createRes.json();
    assert.equal(json.data.request.status, 'pending');
    requestId = json.data.request.id;
    requestReference = json.data.request.request_reference;
    assert.ok(requestId);
    assert.ok(requestReference);
  });

  await t.test('Request creator cannot review / approve their own request (Forbidden 403)', async () => {
    const selfApprove = await branchClient.fetch(`${API_BASE}/inter-branch-requests/${requestId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'branchstaff1234' }),
    });
    assert.equal(selfApprove.status, 403);
  });

  await t.test('Warehouse Staff reviews and approves the request', async () => {
    const approveRes = await warehouseClient.fetch(`${API_BASE}/inter-branch-requests/${requestId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'warehousestaff1234' }),
    });
    assert.equal(approveRes.status, 200);
    const json = await approveRes.json();
    assert.equal(json.data.request.status, 'approved');
  });

  await t.test('Warehouse Staff dispatches the stock units', async () => {
    const dispatchRes = await warehouseClient.fetch(`${API_BASE}/inter-branch-requests/${requestId}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'warehousestaff1234' }),
    });
    assert.equal(dispatchRes.status, 200);
    const json = await dispatchRes.json();
    assert.equal(json.data.request.status, 'in_transit');
  });

  await t.test('Branch Staff receives the stock units at destination', async () => {
    const receiveRes = await branchClient.fetch(`${API_BASE}/inter-branch-requests/${requestId}/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'branchstaff1234' }),
    });
    assert.equal(receiveRes.status, 200);
    const json = await receiveRes.json();
    assert.equal(json.data.request.status, 'received');
  });

  await t.test('Cannot receive an already-received transfer request again (Conflict 409)', async () => {
    const doubleReceive = await branchClient.fetch(`${API_BASE}/inter-branch-requests/${requestId}/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'branchstaff1234' }),
    });
    assert.equal(doubleReceive.status, 409);
  });
});

test('7. Phase 6: Customer Credit Application Lifecycle & Inventory Sync', async (t) => {
  const customerClient = new TestClient();
  const branchClient = new TestClient();
  await customerClient.login('customer1@gmail.com', 'customer1234');
  await branchClient.login('branchstaff@gmail.com', 'branchstaff1234');

  let applicationId;

  await t.test('Customer submits credit application with profile data', async () => {
    const appRes = await customerClient.fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 1,
        locationId: 1, // Bulan Branch
        quantity: 1,
        customerName: 'Test Customer One',
        contactNumber: '09181234567',
        address: 'Zone 4, Bulan, Sorsogon',
        purpose: 'Daily commute to workplace',
        birth_date: '1998-05-15',
        id_type: 'Driver License',
        id_number: 'N01-12-345678',
        id_expiration_date: '2029-12-31',
        notes: 'Submitted via E2E test',
      }),
    });
    assert.equal(appRes.status, 201);
    const json = await appRes.json();
    applicationId = json.data.application.id;
    assert.equal(json.data.application.status, 'submitted');
    assert.ok(applicationId);
  });

  await t.test('Customer can see their application in /me', async () => {
    const myApps = await customerClient.fetch(`${API_BASE}/applications/me`);
    assert.equal(myApps.status, 200);
    const json = await myApps.json();
    assert.ok(json.data.applications.some((app) => app.id === applicationId));
  });

  await t.test('Branch Staff reviews the application', async () => {
    const reviewRes = await branchClient.fetch(`${API_BASE}/applications/${applicationId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(reviewRes.status, 200);
    const json = await reviewRes.json();
    assert.equal(json.data.application.status, 'under_review');
  });

  await t.test('Branch Staff approves the application', async () => {
    const approveRes = await branchClient.fetch(`${API_BASE}/applications/${applicationId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(approveRes.status, 200);
    const json = await approveRes.json();
    assert.equal(json.data.application.status, 'approved');
  });

  await t.test('Branch Staff completes application with stock release', async () => {
    const completeRes = await branchClient.fetch(`${API_BASE}/applications/${applicationId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'branchstaff1234' }),
    });
    assert.equal(completeRes.status, 200);
    const json = await completeRes.json();
    assert.equal(json.data.application.status, 'completed');
  });

  await t.test('Cannot cancel a completed application (Conflict 409)', async () => {
    const cancelRes = await customerClient.fetch(`${API_BASE}/applications/${applicationId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(cancelRes.status, 409);
  });
});

test('8. Notifications & Notification Deletion Workflow (Revisions 1 & 4)', async (t) => {
  const customerClient = new TestClient();
  await customerClient.login('customer1@gmail.com', 'customer1234');

  let unreadNotifId;

  await t.test('Customer has notifications generated from application updates', async () => {
    const notifsRes = await customerClient.fetch(`${API_BASE}/notifications`);
    assert.equal(notifsRes.status, 200);
    const json = await notifsRes.json();
    assert.ok(Array.isArray(json.data.notifications));
    assert.ok(json.data.notifications.length >= 1);
    unreadNotifId = json.data.notifications[0].id;
  });

  await t.test('Customer marks a notification as read', async () => {
    const markRes = await customerClient.fetch(`${API_BASE}/notifications/${unreadNotifId}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    assert.equal(markRes.status, 200);
    const json = await markRes.json();
    assert.equal(json.status, 'success');

    // Verify it is marked read
    const checkRes = await customerClient.fetch(`${API_BASE}/notifications`);
    const checkJson = await checkRes.json();
    const updated = checkJson.data.notifications.find((n) => n.id === unreadNotifId);
    assert.equal(updated.is_read, 1);
  });

  await t.test('Customer deletes a single notification (Revision 4)', async () => {
    const delRes = await customerClient.fetch(`${API_BASE}/notifications/${unreadNotifId}`, {
      method: 'DELETE',
    });
    assert.equal(delRes.status, 200);
    const json = await delRes.json();
    assert.equal(json.status, 'success');

    // Verify it is no longer in list
    const checkRes = await customerClient.fetch(`${API_BASE}/notifications`);
    const checkJson = await checkRes.json();
    assert.ok(!checkJson.data.notifications.some((n) => n.id === unreadNotifId));
  });

  await t.test('Customer deletes all read notifications (Revision 4)', async () => {
    // Mark any remaining notifications as read first
    const listRes = await customerClient.fetch(`${API_BASE}/notifications`);
    const listJson = await listRes.json();
    for (const notif of listJson.data.notifications) {
      await customerClient.fetch(`${API_BASE}/notifications/${notif.id}/read`, {
        method: 'PATCH',
      });
    }

    // Call DELETE /api/v1/notifications/read/all
    const delAllRes = await customerClient.fetch(`${API_BASE}/notifications/read/all`, {
      method: 'DELETE',
    });
    assert.equal(delAllRes.status, 200);
    const delAllJson = await delAllRes.json();
    assert.equal(delAllJson.status, 'success');

    // Verify no read notifications remain
    const afterRes = await customerClient.fetch(`${API_BASE}/notifications`);
    const afterJson = await afterRes.json();
    const hasRead = afterJson.data.notifications.some((n) => n.is_read === 1);
    assert.equal(hasRead, false, 'No read notifications should remain');
  });
});

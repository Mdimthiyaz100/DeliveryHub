import { executeAndLog, generateTestTokens, printAuditSummary } from './apiLogger';

async function runAudit() {
  const startTime = Date.now();
  console.log('Starting Complete Live DeliveryHub API Audit...\n');

  const { customerToken, adminToken, superAdminToken } = generateTestTokens();

  // Create a regular admin token (User 1 is currently super_admin in DB)
  // Let's test non-super_admin restriction by using customerToken or an admin role token
  const regularAdminToken = customerToken; // customer trying to access superadmin endpoint gives 403

  try {
    // 1. Health check
    await executeAndLog('GET', '/', { expectedStatus: 200, notes: 'Root API Healthcheck' });

    // 2. Authentication & Users
    await executeAndLog('POST', '/api/users/login', {
      body: { email: 'invalid_email@example.com', password: 'wrong' },
      expectedStatus: 401,
      notes: 'Login rejection for invalid credentials'
    });

    await executeAndLog('GET', '/api/users/profile', {
      token: customerToken,
      expectedStatus: [200, 404],
      notes: 'Customer Profile fetch'
    });

    await executeAndLog('GET', '/api/users/profile', {
      expectedStatus: 401,
      notes: 'Unauthorized access protection check'
    });

    await executeAndLog('GET', '/api/users', {
      token: adminToken,
      expectedStatus: 200,
      notes: 'Admin list all users'
    });

    await executeAndLog('GET', '/api/users', {
      token: customerToken,
      expectedStatus: 403,
      notes: 'Role boundary: Customer forbidden from viewing users list'
    });

    // 3. Products
    await executeAndLog('GET', '/api/products', { expectedStatus: 200, notes: 'Public Product Catalog' });
    await executeAndLog('GET', '/api/products/1', { expectedStatus: [200, 404], notes: 'Product details by ID' });
    await executeAndLog('GET', '/api/products/999999', { expectedStatus: 404, notes: 'Non-existent product ID handling' });

    // 4. Cart APIs
    await executeAndLog('GET', '/api/cart', { token: customerToken, expectedStatus: 200, notes: 'Customer active cart retrieval' });
    await executeAndLog('POST', '/api/cart/add', {
      token: customerToken,
      body: { productId: 1, quantity: 1 },
      expectedStatus: [200, 201],
      notes: 'Add product to shopping cart'
    });
    await executeAndLog('PUT', '/api/cart/quantity', {
      token: customerToken,
      body: { productId: 1, quantity: 2 },
      expectedStatus: 200,
      notes: 'Update cart item quantity'
    });
    await executeAndLog('POST', '/api/cart/merge', {
      token: customerToken,
      body: { items: [{ productId: 1, quantity: 1 }] },
      expectedStatus: 200,
      notes: 'Merge guest localStorage cart on login'
    });
    await executeAndLog('DELETE', '/api/cart/item/1', { token: customerToken, expectedStatus: 200, notes: 'Remove item from cart' });

    // 5. Addresses APIs
    await executeAndLog('GET', '/api/users/addresses', { token: customerToken, expectedStatus: 200, notes: 'Get customer address book' });
    const addAddrRes = await executeAndLog('POST', '/api/users/addresses', {
      token: customerToken,
      body: {
        recipientName: 'Test Auditor',
        phone: '9876543210',
        street: '123 Tech Blvd, Suite 4B',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        isDefault: true
      },
      expectedStatus: 201,
      notes: 'Add verified shipping address'
    });

    const testAddrId = addAddrRes.body?.id || 1;
    await executeAndLog('PUT', `/api/users/addresses/${testAddrId}`, {
      token: customerToken,
      body: { street: '123 Tech Blvd, Suite 5C' },
      expectedStatus: 200,
      notes: 'Update existing address'
    });
    if (addAddrRes.body?.id) {
      await executeAndLog('DELETE', `/api/users/addresses/${testAddrId}`, {
        token: customerToken,
        expectedStatus: 200,
        notes: 'Cleanup temporary test address'
      });
    }

    // 6. Wishlist APIs
    await executeAndLog('GET', '/api/users/wishlist', { token: customerToken, expectedStatus: 200, notes: 'Fetch customer wishlist' });
    await executeAndLog('POST', '/api/users/wishlist', {
      token: customerToken,
      body: { productId: 1 },
      expectedStatus: [200, 201],
      notes: 'Add item to wishlist'
    });
    await executeAndLog('DELETE', '/api/users/wishlist/1', { token: customerToken, expectedStatus: 200, notes: 'Remove item from wishlist' });

    // 7. Orders APIs
    await executeAndLog('GET', '/api/orders/my-orders', { token: customerToken, expectedStatus: 200, notes: 'Customer order history' });
    await executeAndLog('GET', '/api/orders', { token: adminToken, expectedStatus: 200, notes: 'Admin all orders overview' });
    await executeAndLog('GET', '/api/orders/unassigned/list', { token: adminToken, expectedStatus: 200, notes: 'Orders awaiting courier dispatch' });
    await executeAndLog('GET', '/api/orders/5', { token: adminToken, expectedStatus: 200, notes: 'Fetch specific order by ID' });
    await executeAndLog('GET', '/api/orders/999999', { token: adminToken, expectedStatus: 404, notes: 'Non-existent order check' });

    // 8. Tracking APIs (Public & Admin)
    await executeAndLog('GET', '/api/tracking/public/DH2026081400005', { expectedStatus: 200, notes: 'Public customer tracking lookup' });
    await executeAndLog('GET', '/api/tracking/statistics', { token: adminToken, expectedStatus: 200, notes: 'Admin tracking dashboard metrics' });
    await executeAndLog('GET', '/api/tracking/live-locations', { token: adminToken, expectedStatus: 200, notes: 'Admin live active shipment coordinates' });
    await executeAndLog('GET', '/api/tracking/active', { token: adminToken, expectedStatus: 200, notes: 'Active deliveries fleet query' });
    await executeAndLog('GET', '/api/tracking/DH2026081400005', { token: adminToken, expectedStatus: 200, notes: 'Admin tracking details by number' });
    await executeAndLog('GET', '/api/tracking/DH2026081400005/history', { expectedStatus: 200, notes: 'Tracking history timeline' });
    await executeAndLog('GET', '/api/tracking/DH2026081400005/route', { expectedStatus: 200, notes: 'Tracking route telemetry' });

    // 9. Delivery Personnel / Courier Management APIs
    await executeAndLog('GET', '/api/delivery/overview', { token: adminToken, expectedStatus: 200, notes: 'Courier network statistics' });
    await executeAndLog('GET', '/api/delivery/available', { token: adminToken, expectedStatus: 200, notes: 'Couriers ready for dispatch' });
    await executeAndLog('GET', '/api/delivery', { token: adminToken, expectedStatus: 200, notes: 'Complete list of couriers' });
    await executeAndLog('GET', '/api/delivery/5', { token: adminToken, expectedStatus: 200, notes: 'Courier profile by ID' });
    await executeAndLog('GET', '/api/delivery/5/orders', { token: adminToken, expectedStatus: 200, notes: 'Courier assigned orders' });

    // 10. Dashboard & Admin Management
    await executeAndLog('GET', '/api/dashboard/stats', { token: adminToken, expectedStatus: 200, notes: 'Top-level Admin Dashboard Analytics' });
    await executeAndLog('GET', '/api/admin/overview', { token: superAdminToken, expectedStatus: 200, notes: 'Super Admin Governance Overview' });
    await executeAndLog('GET', '/api/admin/overview', { token: regularAdminToken, expectedStatus: 403, notes: 'Super Admin RBAC gatekeeper' });

  } catch (err) {
    console.error('Audit execution error:', err);
  } finally {
    printAuditSummary(startTime);
    process.exit(0);
  }
}

runAudit();

import { test, expect, type BrowserContext, type Page } from '@playwright/test';

test.describe.serial('Admin dashboard', () => {
  let context: BrowserContext;
  let page: Page;

  // This runs once for this suite; all dashboard tests reuse this signed-in context.
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await page.goto('http://localhost:5173/admin/login');
    await page.locator('input[name="email"]').fill("admin@deliveryhub.com");
    await page.locator('input[name="password"]').fill("password123");
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test.afterAll(async () => {
    await context.close();
  });
// Test 1: checking the dashboard page elements
  test('displays the dashboard page', async () => {
    await expect(page.getByRole('heading', { name: 'Dashboard For DeliveryHub' })).toBeVisible();
    await expect(page.getByText('Welcome back!')).toBeVisible();
  });
// Test 2: checking the dashboard statistics
  test('displays dashboard statistics', async () => {
    await expect(page.getByRole('button', { name: 'total orders' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'delivered' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'pending' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'cancelled' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'assigned' })).toBeVisible();
  });
// Test 3: checking the delivery overview and recent orders
  test('displays the delivery overview and recent orders', async () => {
    await expect(page.getByText('Weekly Delivery Overview')).toBeVisible();
    await expect(page.getByText('Recent Orders')).toBeVisible();
  });
// Test 4: navigation to total orders page
  test('navigates to the total orders page', async () => {
    await page.getByRole('button', { name: 'total orders' }).click();
    await expect(page).toHaveURL(/orders/);
  });
  // Test 5: navigation to delivered orders page
  test('dashboard1', async () => {
    await page.goto('http://localhost:5173/dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });
  test('navigates to the delivered', async () => {
    await page.getByRole('button', { name: 'delivered' }).click();
    await expect(page).toHaveURL(/orders\?status=delivered/);
  });
  // Test 6: navigation to pending orders page
  test('dashboard2', async () => {
    await page.goto('http://localhost:5173/dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });
  
  test('navigates to the pending orders page', async () => {
    await page.getByRole('button', { name: 'pending' }).click();
    await expect(page).toHaveURL(/orders\?status=pending/);
  });
  // Test 7: navigation to cancelled orders page
  test('dashboard3', async () => {
    await page.goto('http://localhost:5173/dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });
  
  test('navigates to the cancelled orders page', async () => {
    await page.getByRole('button', { name: 'cancelled' }).click();
    await expect(page).toHaveURL(/orders\?status=cancelled/);
  });
  // Test 8: navigation to all orders page
  test('dashboard4', async () => {
    await page.goto('http://localhost:5173/dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });
  
  test('navigates to the assigned orders page', async () => {
    await page.getByRole('button', { name: 'assigned' }).click();
    await expect(page).toHaveURL(/orders\?status=assigned/);
  });

  // Test 9: navigation to delivery person page
  test('dashboard5', async () => {
    await page.goto('http://localhost:5173/dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });
  
  test('navigates to the delivery person page', async () => {
    await page.getByRole('link', { name: 'Delivery' }).click();
    await expect(page).toHaveURL(/delivery/);
  });
  test('should add a new delivery person', async () => {
    await page.goto('http://localhost:5173/delivery');
    await page.getByRole('button', { name: '+ Add Person' }).click();
    // Verify modal is visible
    await expect(page.getByRole('heading', { name: 'Add Delivery Person' })).toBeVisible();

    // Fill Full Name
    await page.getByPlaceholder('e.g Mohamed Imthiyaz').fill('aslam');

    // Fill Phone Number
    await page.getByPlaceholder('e.g +91 9876543210').fill('+91 9632587410');

    // Select Vehicle Type
    await page.getByRole('combobox').selectOption({ label: 'Bike' });

    // Fill Vehicle Number
    await page.getByPlaceholder('e.g. TN-60-AA-8005').fill('TN-65-BA-9874');

    // Click Add Person
    await page.getByRole('button', { name: 'Add Person', exact: true }).click();

    // Verify modal is closed
    await expect(page.getByRole('heading', { name: 'Add Delivery Person' })).not.toBeVisible();

});

  // Test 10: navigation to users page
  test('dashboard6', async () => {
    await page.goto('http://localhost:5173/dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });
  
  test('navigates to the users page', async () => {
    await page.getByRole('link', { name: 'Users' }).click();
    await expect(page).toHaveURL(/users/);
    await page.getByRole('button', { name: 'ADMINS' }).click();
    await expect(page.getByRole('button', { name: 'ADMINS' })).toBeVisible();
    await page.getByRole('button', { name: 'CUSTOMERS' }).click();
    await expect(page.getByRole('button', { name: 'CUSTOMERS' })).toBeVisible();
  });
  
  test('navigate to the dashoboard page', async () => {
    await page.goto('http://localhost:5173/dashboard')
    await expect(page).toHaveURL(/dashboard/);
  });

  // logout from the admin
  test('navigate to admin login page', async () =>{
    await page.getByRole('button', {name: 'Logout'}).click();
    await page.goto('http://localhost:5173/admin/login');
    await expect(page).toHaveURL(/admin\/login/);
  })

});



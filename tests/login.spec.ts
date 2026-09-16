import { test, expect } from '@playwright/test';

test.describe('DeliveryHub Admin Login', () => {

  // Test 1: User Login to Admin Login
  test('should navigate to admin login page', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    await page.getByText(/Are you an admin/i).click();

    await expect(page).toHaveURL(/admin\/login/);

    await expect(page.getByText('Admin Sign In')).toBeVisible();
  });
  // Test 2:login page loading and checking the elements
 test('should display the admin login page', async ({ page }) => {
  await page.goto('http://localhost:5173/admin/login');

  await expect(page.getByText('Admin Sign In')).toBeVisible();

  await expect(
    page.locator('input[name="email"]')).toBeVisible();

  await expect(
    page.locator('input[name="password"]')).toBeVisible();

  await expect(
    page.getByRole('button', { name: 'Sign In' })).toBeVisible();
});

  // Test 3: checking the error message when login fields are empty
  test('should show error when login fields are empty', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/login');

    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(
      page.getByText('Please fill in all fields')
    ).toBeVisible();
  });

  // Test 4: entering valid credentials
    test('should login with valid credentials', async ({ page }) => {
        await page.goto('http://localhost:5173/admin/login');

        await page.fill('input[name="email"]', 'admin@deliveryhub.com' );
        await page.fill('input[name="password"]', 'password123');
        await page.getByRole('button', { name: 'Sign In' }).click();

        await expect(page).toHaveURL(/dashboard/);
});

// Test 5: API test for login endpoint
test('DeliveryHub Login API', async ({ request }) => {

  const response = await request.post(
 'http://localhost:5000/api/users/login',
  {
    data: {
      email: 'admin@deliveryhub.com',
      password: 'password123',
    },
  }
);
    console.log('Status:', response.status());

    const data = await response.json();

    console.log('Response:', data);
    expect(response.status()).toBe(200);
});


});
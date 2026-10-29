/**
 * T13.11 — E2E (Playwright): Landing page & Guest access gate flow
 * Test: landing page → guest access gate on /designer → register → describe → diagram → edit → export
 */

import { test, expect } from '@playwright/test';

test.describe('Phase 13 — E2E Landing & Studio Access Flow', () => {
  test('landing page specifies product and gates studio behind login like Figma & Eraser', async ({ page }) => {
    // 1. Visit Home Landing Page
    await page.goto('/');
    await expect(page).toHaveTitle(/AI Schema Designer/);

    // Verify product landing page content is displayed
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Design databases at the/i);
    await expect(page.getByRole('link', { name: /Start Designing for Free/i })).toBeVisible();

    // 2. Navigate to /designer as a guest — should encounter Figma/Eraser style access gate
    await page.goto('/designer');
    await expect(page.getByText('Sign in to Launch Studio')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create Free Account' })).toBeVisible();

    // 3. Click Create Free Account to register
    await page.getByRole('link', { name: 'Create Free Account' }).click();
    await expect(page).toHaveURL(/\/register/);

    const testEmail = `guest-e2e-${Date.now()}@example.com`;
    const testPassword = 'Password123!Safe';

    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password', { exact: true }).fill(testPassword);
    await page.getByLabel('Confirm Password').fill(testPassword);
    await page.getByRole('button', { name: /Create Account/i }).click();

    // 4. Redirects into /designer once authenticated
    await page.waitForURL(/\/designer/);
    await expect(page.getByText('Sign in to Launch Studio')).not.toBeVisible();

    // 5. Look for the describe panel and enter a description
    const describePanel = page.getByRole('textbox', { name: 'Requirements Prompt' });
    await expect(describePanel).toBeVisible();

    await describePanel.fill('A library system with books, authors, and members who can borrow books.');
    await page.getByRole('radio', { name: 'PostgreSQL' }).check();
    await page.getByRole('button', { name: 'Generate Schema' }).click();

    // 6. Wait for diagram to render
    await expect(page.locator('.tableNode')).toHaveCount(3);

    // 7. Edit column
    const firstTable = page.locator('.tableNode').first();
    await firstTable.click();
    await page.getByRole('button', { name: /Add Column to Table/ }).click();
    await page.getByPlaceholder('Column name').fill('email');
    await page.getByRole('radio', { name: /VARCHAR/ }).check();
    await page.getByRole('spinbutton', { name: /length/ }).fill('254');

    // 8. Add relationship
    await page.getByRole('button', { name: /Add Relationship/ }).click();
    await page.getByRole('combobox', { name: /from table/ }).selectOption('members');
    await page.getByRole('combobox', { name: /from column/ }).selectOption('member_id');
    await page.getByRole('combobox', { name: /to table/ }).selectOption('users');
    await page.getByRole('combobox', { name: /to column/ }).selectOption('id');
    await page.getByRole('combobox', { name: /on delete/ }).selectOption('CASCADE');

    // 9. Export SQL
    await page.getByRole('tab', { name: 'SQL' }).click();
    await expect(page.locator('.sql-preview')).toContainText('CREATE TABLE');

    const sqlPreview = page.locator('pre').first();
    const sqlText = await sqlPreview.textContent();

    expect(sqlText).toContain('CREATE TABLE "books"');
    expect(sqlText).toContain('CREATE TABLE "authors"');
    expect(sqlText).toContain('CREATE TABLE "members"');
  });
});

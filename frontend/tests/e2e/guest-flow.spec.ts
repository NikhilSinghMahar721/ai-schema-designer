/**
 * T13.11 — E2E (Playwright): guest flow
 * Test: describe → diagram → edit column → add relationship → export → SQL contains the edit
 * 
 * This test runs against the running backend+frontend system.
 * It verifies that guest users can:
 * 1. Describe a database in plain language
 * 2. View the generated ER diagram
 * 3. Add a table/column
 * 4. Add a relationship
 * 5. Export SQL
 * 6. Verify the SQL contains the expected changes
 */

import { test, expect, describe } from '@playwright/test';

describe('Phase 13 — E2E Guest Flow', () => {
  test('guest: describe → diagram → edit → export → SQL validation', async ({ page }) => {
    // 1. Navigate to the designer (guest mode)
    await page.goto('/');
    await expect(page).toHaveTitle(/AI Schema Designer/);

    // 2. Look for the describe panel and enter a description
    // Guest mode should allow generation without login
    const describePanel = page.getByRole('textbox', { name: 'Requirements Prompt' });
    await expect(describePanel).toBeVisible();

    // Enter a description for a simple database
    await describePanel.fill('A library system with books, authors, and members who can borrow books.');

    // 3. Select PostgreSQL dialect
    await page.getByRole('radio', { name: 'PostgreSQL' }).check();

    // 4. Click Generate
    await page.getByRole('button', { name: 'Generate Schema' }).click();

    // 5. Wait for the diagram to render (tables should appear)
    await expect(page.locator('.tableNode')).toHaveCount(3); // books, authors, members

    // 6. Add a new column (e.g., 'email' to users table)
    // Click on the users table to select it, then add column
    const usersTable = page.locator('.tableNode').first();
    await usersTable.click();

    // Look for add column button in the inspector
    await page.getByRole('button', { name: /Add Column to Table/ }).click();

    // Fill in the new column
    await page.getByPlaceholder('Column name').fill('email');
    await page.getByRole('radio', { name: /VARCHAR/ }).check();
    await page.getByRole('spinbutton', { name: /length/ }).fill('254');

    // 7. Add a relationship (e.g., borrowers → members)
    await page.getByRole('button', { name: /Add Relationship/ }).click();
    await page.getByRole('select', { name: /from table/ }).selectOption('members');
    await page.getByRole('select', { name: /from column/ }).selectOption('member_id');
    await page.getByRole('select', { name: /to table/ }).selectOption('users');
    await page.getByRole('select', { name: /to column/ }).selectOption('id');
    await page.getByRole('select', { name: /on delete/ }).selectOption('CASCADE');

    // 8. Export SQL
    await page.getByRole('tab', { name: 'SQL' }).click();

    // Wait for SQL to compile
    await expect(page.locator('.sql-preview')).toContainText('CREATE TABLE');

    // 9. Verify SQL contains expected structure
    const sqlPreview = page.locator('pre').first();
    const sqlText = await sqlPreview.textContent();

    // Should contain the tables we expect
    expect(sqlText).toContain('CREATE TABLE "books"');
    expect(sqlText).toContain('CREATE TABLE "authors"');
    expect(sqlText).toContain('CREATE TABLE "members"');
    expect(sqlText).toContain('borrow_date');
    expect(sqlText).toContain('email');

    // 10. Verify it's a guest session (no auth required)
    // The URL should not have changed to a login-required page
    await expect(page).URL.toMatch(/^\/.*$/);
  });
});
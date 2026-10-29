/**
 * T13.12 — E2E (Playwright): account flow
 * Test: register → generate → save → logout → login → open from "My schemas" → delete → delete account
 * 
 * Requires: Running backend with database + frontend on localhost:3000
 * 
 * Test flow:
 * 1. Register a new account
 * 2. Generate a schema from description
 * 3. Save the schema (should prompt login if guest, but we're logged in)
 * 4. Log out
 * 5. Log back in
 * 6. Open "My schemas" page
 * 7. Delete a schema
 * 8. Delete the account
 */

import { test, expect, describe, beforeEach } from '@playwright/test';

let registeredEmail = '';
let registeredPassword = 'TestPassword123!';

describe('Phase 13 — E2E Account Flow', () => {
  beforeEach(async ({ page }) => {
    // Ensure clean state
    await page.goto('/');
  });

  test('account: register → generate → save → logout → login → open schemas → delete → delete account', async ({
    page,
  }) => {
    // 1. Register a new account
    await page.goto('/register');
    await expect(page).toHaveTitle(/Register/);

    const registerEmail = `e2e-test-${Date.now()}@example.com`;
    await page.getByLabel('Email').fill(registerEmail);
    await page.getByLabel('Password').fill(registeredPassword);
    await page.getByRole('button', { name: /Register/ }).click();

    // Wait for redirect/login to complete
    await page.waitForLoadState('networkidle');

    // Should be logged in now
    await expect(page.getByRole('button', { name: /Sign Out/ })).toBeVisible();

    // 2. Generate a schema from description
    await page.goto('/');
    await expect(page.locator('.tableNode')).toHaveCount(0); // fresh start

    const describePanel = page.getByRole('textbox', { name: 'Requirements Prompt' });
    await expect(describePanel).toBeVisible();

    await describePanel.fill('A SaaS application with users, organizations, and subscription tiers.');
    await page.getByRole('radio', { name: 'PostgreSQL' }).check();
    await page.getByRole('button', { name: 'Generate Schema' }).click();

    // Wait for diagram to render
    await expect(page.locator('.tableNode')).toHaveCount(3); // users, organizations, subscriptions

    // 3. Save the schema
    await page.getByRole('button', { name: /💾 Save Schema/ }).click();

    // Should open the save dialog (already logged in)
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel('Schema Name').fill('My First Schema');
    await page.getByRole('button', { name: /Save Schema/ }).click();

    // Wait for success
    await expect(page.getByText('Schema saved successfully!')).toBeVisible();

    // 4. Log out
    await page.getByRole('button', { name: /Sign Out/ }).click();
    await page.waitForLoadState('networkidle');

    // Should be back to guest state
    await expect(page.getByRole('button', { name: /Sign In/ })).toBeVisible();

    // 5. Log back in
    await page.goto('/login');
    await page.getByLabel('Email').fill(registerEmail);
    await page.getByLabel('Password').fill(registeredPassword);
    await page.getByRole('button', { name: /Log In/ }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /My Schemas/ })).toBeVisible();

    // 6. Open "My schemas" page
    await page.getByRole('link', { name: /My Schemas/ }).click();
    await page.waitForLoadState('networkidle');

    // Should show saved schemas
    await expect(page.locator('.schema-item')).toHaveCount(1);
    await expect(page.locator('.schema-item').first()).toContainText('My First Schema');

    // 7. Delete the schema
    await page.getByRole('button', { name: /Delete/ }).first().click();
    await page.getByRole('button', { name: /Delete/ }).click(); // confirm

    // 8. Verify schema is deleted
    await expect(page.locator('.schema-item')).toHaveCount(0);

    // 9. Delete account
    await page.getByRole('button', { name: /Delete Account/ }).click();
    await page.getByRole('button', { name: /Permanently Delete/ }).click();

    // Should be redirected to login/register
    await expect(page).toHaveURL(/^\/.*register.*/);
  });
});
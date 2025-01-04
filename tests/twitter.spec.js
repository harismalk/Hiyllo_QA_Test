// tests/twitter.spec.js

const { test, expect } = require('@playwright/test');
require('dotenv').config();

test.setTimeout(90000);

/**
 * Helper function to scroll to the bottom of the page.
 * Adjust the scroll behavior as needed.
 * @param {import('@playwright/test').Page} page
 */
async function scrollToBottom(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      const distance = 1000;
      const delay = 100;
      const timer = setInterval(() => {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        window.scrollBy(0, distance);
        if (scrollTop + clientHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, delay);
    });
  });
}

test('Log in to Twitter and tweet "Hello, World!"', async ({ page }) => {
  // Navigate to the Twitter login flow
  await page.goto('https://x.com/i/flow/login');

  // Enter username
  await page.getByLabel('Phone, email, or username').fill(process.env.TWITTER_USERNAME);
  await page.getByRole('button', { name: 'Next' }).click();

  // Enter password
  await page.getByLabel('Password', { exact: true }).fill(process.env.TWITTER_PASSWORD);
  await page.getByTestId('LoginForm_Login_Button').click();

  // Wait for the home link to ensure successful login
  await page.waitForSelector('[data-testid="AppTabBar_Home_Link"]', { state: 'visible' });

  // Compose the tweet
  await page.getByTestId('tweetTextarea_0').click();
  await page.getByTestId('tweetTextarea_0').type('Hello, World!');
  await page.keyboard.press('Enter');

  // Post the tweet
  const tweetButton = page.getByTestId('tweetButtonInline');
  await tweetButton.waitFor({ state: 'visible', timeout: 10000 });
  await tweetButton.click();

  // Wait for tweet success indicator (e.g., a toast notification)
  await page.waitForSelector('[data-testid="toast"]', { state: 'visible', timeout: 10000 });

  // Navigate to the user profile
  await page.goto(`https://twitter.com/${process.env.TWITTER_USERNAME}`, {
    waitUntil: 'domcontentloaded',
  });

  // Wait for the primary column to ensure the profile page has loaded
  await page.waitForSelector('[data-testid="primaryColumn"]', { state: 'visible', timeout: 30000 });

  // Scroll to the bottom to load recent tweets
  await scrollToBottom(page);

  // Verify that "Hello, World!" was posted by the correct user
  const tweetArticle = page.locator('article').filter({
    hasText: 'Hello, World!',
    has: page.locator(`[data-testid="User-Name"]:has-text("${process.env.TWITTER_USERNAME}")`)
  });
  await expect(tweetArticle).toBeVisible({ timeout: 30000 });
});

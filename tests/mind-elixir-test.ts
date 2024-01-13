import { test as base } from '@playwright/test'
import { MindElixirFixture } from './MindElixirFixture'
// Declare the types of your fixtures.
type MyFixtures = {
  me: MindElixirFixture
}

// Extend base test by providing "todoPage" and "settingsPage".
// This new "test" can be used in multiple test files, and each of them will get the fixtures.
export const test = base.extend<MyFixtures>({
  me: async ({ page }, use) => {
    // Set up the fixture.
    const me = new MindElixirFixture(page)
    await me.goto()

    // Use the fixture value in the test.
    await use(me)
  },
})
export { expect } from '@playwright/test'

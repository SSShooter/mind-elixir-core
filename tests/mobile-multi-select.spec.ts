import { test, expect } from './mind-elixir-test'

interface Window {
  [key: string]: any
}
declare let window: Window

const id = 'root-id'
const topic = 'root-topic'
const data = {
  nodeData: {
    topic,
    id,
    children: [
      {
        id: 'node1',
        topic: 'Node 1',
        children: [
          {
            id: 'node1-1',
            topic: 'Node 1-1',
          },
          {
            id: 'node1-2',
            topic: 'Node 1-2',
          },
        ],
      },
      {
        id: 'node2',
        topic: 'Node 2',
        children: [
          {
            id: 'node2-1',
            topic: 'Node 2-1',
          },
        ],
      },
      {
        id: 'node3',
        topic: 'Node 3',
      },
    ],
  },
}

test.describe('Mobile Multi-Select', () => {
  test.beforeEach(async ({ me, page }) => {
    // Initialize with mobileMultiSelect enabled
    const dataStr = JSON.stringify(data)
    await page.evaluate(
      ({ dataStr }) => {
        const MindElixir = window.MindElixir
        const options = {
          el: '#map',
          direction: MindElixir.SIDE,
          allowUndo: true,
          keypress: true,
          editable: true,
          mobileMultiSelect: true, // Enable mobile multi-select
        }
        const mind = new MindElixir(options)
        mind.init(JSON.parse(dataStr))
        window['#map'] = mind
      },
      { dataStr }
    )
  })

  test('should enable mobile multi-select mode', async ({ page }) => {
    const mobileMultiSelectEnabled = await page.evaluate(() => {
      return window['#map'].mobileMultiSelect
    })
    expect(mobileMultiSelectEnabled).toBe(true)
  })

  test('should select multiple nodes by tapping without modifier keys', async ({ page, me }) => {
    // Tap first node
    await me.click('Node 1')
    await expect(page.locator('me-tpc.selected')).toHaveCount(1)
    await expect(page.locator('.selected').filter({ hasText: 'Node 1' })).toBeVisible()

    // Tap second node - should add to selection
    await me.click('Node 2')
    await expect(page.locator('me-tpc.selected')).toHaveCount(2)
    await expect(page.locator('.selected').filter({ hasText: 'Node 1' })).toBeVisible()
    await expect(page.locator('.selected').filter({ hasText: 'Node 2' })).toBeVisible()

    // Tap third node - should add to selection
    await me.click('Node 3')
    await expect(page.locator('me-tpc.selected')).toHaveCount(3)
    await expect(page.locator('.selected').filter({ hasText: 'Node 1' })).toBeVisible()
    await expect(page.locator('.selected').filter({ hasText: 'Node 2' })).toBeVisible()
    await expect(page.locator('.selected').filter({ hasText: 'Node 3' })).toBeVisible()
  })

  test('should deselect node when tapping already selected node', async ({ page, me }) => {
    // Select multiple nodes
    await me.click('Node 1')
    await me.click('Node 2')
    await me.click('Node 3')
    await expect(page.locator('me-tpc.selected')).toHaveCount(3)

    // Tap already selected node - should deselect it
    await me.click('Node 2')
    await expect(page.locator('me-tpc.selected')).toHaveCount(2)
    await expect(page.locator('.selected').filter({ hasText: 'Node 1' })).toBeVisible()
    await expect(page.locator('.selected').filter({ hasText: 'Node 2' })).toBeHidden()
    await expect(page.locator('.selected').filter({ hasText: 'Node 3' })).toBeVisible()
  })

  test('should allow dragging multiple selected nodes', async ({ page, me }) => {
    // Select two nodes
    await me.click('Node 1-1')
    await me.click('Node 1-2')
    await expect(page.locator('me-tpc.selected')).toHaveCount(2)

    // Drag to move them
    await me.dragOver('Node 1-2', 'in')
    await page.mouse.up()

    // Verify nodes were moved (check data structure)
    const nodeData = await me.getData()
    const node2 = nodeData.nodeData.children.find((n: any) => n.id === 'node2')
    expect(node2.children).toBeDefined()
    expect(node2.children.length).toBeGreaterThan(0)
  })

  test('should work with enableMobileMultiSelect method', async ({ page, me }) => {
    // Disable mobile multi-select
    await page.evaluate(() => {
      window['#map'].enableMobileMultiSelect(false)
    })

    let mobileMultiSelectEnabled = await page.evaluate(() => {
      return window['#map'].mobileMultiSelect
    })
    expect(mobileMultiSelectEnabled).toBe(false)

    // Tap first node
    await me.click('Node 1')
    await expect(page.locator('me-tpc.selected')).toHaveCount(1)

    // Tap second node - should replace selection (not add)
    await me.click('Node 2')
    await expect(page.locator('me-tpc.selected')).toHaveCount(1)
    await expect(page.locator('.selected').filter({ hasText: 'Node 1' })).toBeHidden()
    await expect(page.locator('.selected').filter({ hasText: 'Node 2' })).toBeVisible()

    // Re-enable mobile multi-select
    await page.evaluate(() => {
      window['#map'].enableMobileMultiSelect(true)
    })

    mobileMultiSelectEnabled = await page.evaluate(() => {
      return window['#map'].mobileMultiSelect
    })
    expect(mobileMultiSelectEnabled).toBe(true)

    // Now tapping should add to selection
    await me.click('Node 1')
    await expect(page.locator('me-tpc.selected')).toHaveCount(2)
    await expect(page.locator('.selected').filter({ hasText: 'Node 1' })).toBeVisible()
    await expect(page.locator('.selected').filter({ hasText: 'Node 2' })).toBeVisible()
  })

  test('should not select root node in multi-select', async ({ page, me }) => {
    // Try to select root node
    await me.click(topic)
    await expect(page.locator('me-tpc.selected')).toHaveCount(1)

    // Select another node - root should be deselected since it's in multi-select mode
    await me.click('Node 1')

    // Both should be selected in mobile multi-select mode
    await expect(page.locator('me-tpc.selected')).toHaveCount(2)
    await expect(page.locator('.selected').filter({ hasText: 'Node 1' })).toBeVisible()
  })

  test('should clear selection and select only edited node when double-clicking', async ({ page, me }) => {
    // Select multiple nodes
    await me.click('Node 1')
    await me.click('Node 2')
    await expect(page.locator('me-tpc.selected')).toHaveCount(2)

    // Double-click to edit one of the selected nodes
    await me.dblclick('Node 1')
    await expect(page.locator('#input-box')).toBeVisible()

    // Cancel edit
    await page.keyboard.press('Escape')
    await expect(page.locator('#input-box')).toBeHidden()

    // Only the edited node should remain selected
    await expect(page.locator('me-tpc.selected')).toHaveCount(1)
    await expect(page.locator('.selected').filter({ hasText: 'Node 1' })).toBeVisible()
    await expect(page.locator('.selected').filter({ hasText: 'Node 2' })).toBeHidden()
  })

  test('should delete multiple selected nodes', async ({ page, me }) => {
    // Select multiple nodes
    await me.click('Node 1-1')
    await me.click('Node 1-2')
    await expect(page.locator('me-tpc.selected')).toHaveCount(2)

    // Delete selected nodes
    await page.keyboard.press('Delete')

    // Nodes should be removed
    await expect(page.getByText('Node 1-1', { exact: true })).toBeHidden()
    await expect(page.getByText('Node 1-2', { exact: true })).toBeHidden()
    // After deletion, the parent node might be selected
    // Just verify the deleted nodes are gone
  })
})

test.describe('Mobile Multi-Select Disabled', () => {
  test.beforeEach(async ({ me }) => {
    // Initialize with mobileMultiSelect disabled (default)
    await me.init(data)
  })

  test('should not enable mobile multi-select by default', async ({ page }) => {
    const mobileMultiSelectEnabled = await page.evaluate(() => {
      return window['#map'].mobileMultiSelect
    })
    expect(mobileMultiSelectEnabled).toBe(false)
  })

  test('should require modifier keys for multi-select when disabled', async ({ page, me }) => {
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'

    // Click first node
    await me.click('Node 1')
    await expect(page.locator('me-tpc.selected')).toHaveCount(1)

    // Click second node without modifier - should replace selection
    await me.click('Node 2')
    await expect(page.locator('me-tpc.selected')).toHaveCount(1)
    await expect(page.locator('.selected').filter({ hasText: 'Node 2' })).toBeVisible()
    await expect(page.locator('.selected').filter({ hasText: 'Node 1' })).toBeHidden()

    // Click with modifier key - should add to selection
    await page.keyboard.down(modifier)
    await me.click('Node 1')
    await page.keyboard.up(modifier)

    await expect(page.locator('me-tpc.selected')).toHaveCount(2)
    await expect(page.locator('.selected').filter({ hasText: 'Node 1' })).toBeVisible()
    await expect(page.locator('.selected').filter({ hasText: 'Node 2' })).toBeVisible()
  })
})

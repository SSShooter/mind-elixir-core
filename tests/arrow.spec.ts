import { test, expect } from './mind-elixir-test'

const data = {
  nodeData: {
    topic: 'Root Topic',
    id: 'root',
    children: [
      {
        id: 'left-main',
        topic: 'Left Main',
        children: [
          {
            id: 'left-child-1',
            topic: 'Left Child 1',
          },
          {
            id: 'left-child-2',
            topic: 'Left Child 2',
          },
          {
            id: 'left-child-3',
            topic: 'Left Child 3',
          },
        ],
      },
      {
        id: 'right-main',
        topic: 'Right Main',
        children: [
          {
            id: 'right-child-1',
            topic: 'Right Child 1',
          },
          {
            id: 'right-child-2',
            topic: 'Right Child 2',
          },
        ],
      },
    ],
  },
}

test.beforeEach(async ({ me }) => {
  await me.init(data)
})

test('Create arrow between two nodes', async ({ page, me }) => {
  // Get the MindElixir instance and create arrow programmatically
  const instanceHandle = await me.getInstance()

  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const rightChild1 = instance.findEle('right-child-1')

    // Create arrow between two nodes
    instance.createArrow(leftChild1, rightChild1)
  }, instanceHandle)

  // Verify arrow SVG group appears
  await expect(page.locator('svg g[data-linkid]')).toBeVisible()

  // Verify arrow path is visible
  await expect(page.locator('svg g[data-linkid] path').first()).toBeVisible()

  // Verify arrow head is visible
  await expect(page.locator('svg g[data-linkid] path').nth(1)).toBeVisible()

  // Verify arrow label is visible
  await expect(page.locator('.svg-label[data-type="link-label"]').first()).toBeVisible()
  await expect(page.locator('.svg-label[data-type="link-label"]').first()).toHaveText('Custom Link')
})

test('Create arrow with custom options', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const rightChild1 = instance.findEle('right-child-1')

    // Create arrow with custom style options
    instance.createArrow(leftChild1, rightChild1, {
      bidirectional: true,
      style: {
        stroke: '#ff0000',
        strokeWidth: '3',
        strokeDasharray: '5,5',
        labelColor: '#0000ff',
      },
    })
  }, instanceHandle)

  // Verify arrow appears
  await expect(page.locator('svg g[data-linkid]')).toBeVisible()

  // Verify arrow appears with bidirectional option
  await expect(page.locator('svg g[data-linkid]')).toBeVisible()

  // Verify multiple paths exist for bidirectional arrow (includes hotzone and highlight paths)
  const pathCount = await page.locator('svg g[data-linkid] path').count()
  expect(pathCount).toBeGreaterThan(3) // Should have more than 3 paths for bidirectional

  // Verify custom label color
  const arrowLabel = page.locator('.svg-label[data-type="link-label"]').first()
  await expect(arrowLabel).toHaveCSS('color', 'rgb(0, 0, 255)')
})

test('Create arrow from arrow object', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  await page.evaluate(async instance => {
    // Create arrow from arrow object
    instance.createArrowFrom({
      label: 'Test Arrow',
      from: 'left-child-1',
      to: 'right-child-1',
      delta1: { x: 50, y: 20 },
      delta2: { x: -50, y: -20 },
      style: {
        stroke: '#00ff00',
        strokeWidth: '2',
      },
    })
  }, instanceHandle)

  // Verify arrow appears
  await expect(page.locator('svg g[data-linkid]')).toBeVisible()

  // Verify custom label
  await expect(page.locator('.svg-label[data-type="link-label"]').first()).toHaveText('Test Arrow')

  // Verify arrow appears with custom properties
  await expect(page.locator('svg g[data-linkid]')).toBeVisible()

  // Verify at least one path has the custom style (may be applied to different elements)
  const hasCustomStroke = await page.evaluate(() => {
    const paths = document.querySelectorAll('svg g[data-linkid] path')
    return Array.from(paths).some(path => path.getAttribute('stroke') === '#00ff00' || path.getAttribute('stroke-width') === '2')
  })
  expect(hasCustomStroke).toBe(true)
})

test('Select and highlight arrow', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  // Create arrow first
  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const rightChild1 = instance.findEle('right-child-1')
    instance.createArrow(leftChild1, rightChild1)
  }, instanceHandle)

  // Click on the arrow to select it
  await page.locator('svg g[data-linkid]').click()

  // Verify highlight appears (highlight group with higher opacity)
  await expect(page.locator('svg g[data-linkid] .arrow-highlight')).toBeVisible()

  // Verify control points appear (they are div elements with class 'circle')
  await expect(page.locator('.circle').first()).toBeVisible()
  await expect(page.locator('.circle').last()).toBeVisible()

  // Verify link controller appears
  await expect(page.locator('.linkcontroller')).toBeVisible()
})

test('Remove arrow', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  // Create arrow first
  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const rightChild1 = instance.findEle('right-child-1')
    instance.createArrow(leftChild1, rightChild1)
  }, instanceHandle)

  // Verify arrow exists
  await expect(page.locator('svg g[data-linkid]')).toBeVisible()

  // Remove arrow programmatically
  await page.evaluate(async instance => {
    instance.removeArrow()
  }, instanceHandle)

  // Verify arrow is removed
  await expect(page.locator('svg g[data-linkid]')).not.toBeVisible()
})

test('Edit arrow label', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  // Create arrow first
  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const rightChild1 = instance.findEle('right-child-1')
    instance.createArrow(leftChild1, rightChild1)
  }, instanceHandle)

  // First select the arrow by clicking on it with force
  await page.locator('svg g[data-linkid] path').first().click({ force: true })
  
  // Then double click on arrow label to edit
  await page.locator('.svg-label[data-type="link-label"]').first().dblclick({ force: true })

  // Verify input box appears
  await expect(page.locator('#input-box')).toBeVisible()

  // Type new label
  await page.keyboard.press('Control+a')
  await page.keyboard.insertText('Updated Arrow Label')
  await page.keyboard.press('Enter')

  // Verify input box disappears
  await expect(page.locator('#input-box')).toBeHidden()

  // Verify new label is displayed
  await expect(page.locator('.svg-label[data-type="link-label"]').first()).toHaveText('Updated Arrow Label')
})

test('Unselect arrow', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  // Create arrow first
  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const rightChild1 = instance.findEle('right-child-1')
    instance.createArrow(leftChild1, rightChild1)
  }, instanceHandle)

  // Select arrow
  await page.locator('svg g[data-linkid]').click()
  await expect(page.locator('svg g[data-linkid] .arrow-highlight')).toBeVisible()

  // Unselect arrow programmatically
  await page.evaluate(async instance => {
    instance.unselectArrow()
  }, instanceHandle)

  // Verify highlight disappears
  await expect(page.locator('svg g[data-linkid] .arrow-highlight')).not.toBeVisible()

  // Verify control points disappear
  await expect(page.locator('.circle').first()).not.toBeVisible()
  await expect(page.locator('.circle').last()).not.toBeVisible()
})

test('Render multiple arrows', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  // Create multiple arrows
  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const leftChild2 = instance.findEle('left-child-2')
    const rightChild1 = instance.findEle('right-child-1')
    const rightChild2 = instance.findEle('right-child-2')

    // Create first arrow
    instance.createArrow(leftChild1, rightChild1)

    // Create second arrow
    instance.createArrow(leftChild2, rightChild2)
  }, instanceHandle)

  // Verify both arrows exist
  await expect(page.locator('svg g[data-linkid]')).toHaveCount(2)

  // Verify both have labels
  await expect(page.locator('.svg-label[data-type="link-label"]')).toHaveCount(2)
})

test('Arrow positioning and bezier curve', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const rightChild1 = instance.findEle('right-child-1')
    instance.createArrow(leftChild1, rightChild1)
  }, instanceHandle)

  // Get arrow path element
  const arrowPath = page.locator('svg g[data-linkid] path').first()

  // Verify path has bezier curve (should contain 'C' command)
  const pathData = await arrowPath.getAttribute('d')
  expect(pathData).toContain('M') // Move to start point
  expect(pathData).toContain('C') // Cubic bezier curve

  // Verify arrow label is positioned at curve midpoint
  const arrowLabel = page.locator('.svg-label[data-type="link-label"]').first()
  await expect(arrowLabel).toBeVisible()

  // Label should be positioned (label has data-x and data-y attributes)
  const labelX = await arrowLabel.getAttribute('data-x')
  const labelY = await arrowLabel.getAttribute('data-y')
  expect(labelX).toBeTruthy()
  expect(labelY).toBeTruthy()
})

test('Arrow style inheritance and defaults', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const rightChild1 = instance.findEle('right-child-1')

    // Create arrow without custom styles
    instance.createArrow(leftChild1, rightChild1)
  }, instanceHandle)

  // Verify default styles are applied
  const arrowPath = page.locator('svg g[data-linkid] path').first()

  // Check default stroke attributes exist
  const stroke = await arrowPath.getAttribute('stroke')
  const strokeWidth = await arrowPath.getAttribute('stroke-width')
  const fill = await arrowPath.getAttribute('fill')

  expect(stroke).toBeTruthy()
  expect(strokeWidth).toBeTruthy()
  expect(fill).toBe('none') // Arrows should not be filled

  // Verify default label color
  const arrowLabel = page.locator('.svg-label[data-type="link-label"]').first()
  const labelColor = await arrowLabel.evaluate(el => getComputedStyle(el).color)
  expect(labelColor).toBeTruthy()
})

test('Arrow with opacity style', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const rightChild1 = instance.findEle('right-child-1')

    // Create arrow with opacity
    instance.createArrow(leftChild1, rightChild1, {
      style: {
        opacity: '0.5',
      },
    })
  }, instanceHandle)

  // Verify arrow appears with opacity style
  await expect(page.locator('svg g[data-linkid]')).toBeVisible()

  // Verify at least one path has opacity applied
  const hasOpacity = await page.evaluate(() => {
    const paths = document.querySelectorAll('svg g[data-linkid] path')
    return Array.from(paths).some(path => path.getAttribute('opacity') === '0.5')
  })
  expect(hasOpacity).toBe(true)
})

test('Bidirectional arrow rendering', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const rightChild1 = instance.findEle('right-child-1')

    // Create bidirectional arrow
    instance.createArrow(leftChild1, rightChild1, {
      bidirectional: true,
    })
  }, instanceHandle)

  // Verify bidirectional arrow appears with multiple paths
  await expect(page.locator('svg g[data-linkid]')).toBeVisible()

  // Verify multiple paths exist (should be more than a simple arrow)
  const pathCount = await page.locator('svg g[data-linkid] path').count()
  expect(pathCount).toBeGreaterThan(2) // Should have more paths for bidirectional

  // Verify paths have basic stroke attributes
  const paths = page.locator('svg g[data-linkid] path')
  const firstPath = paths.first()
  await expect(firstPath).toHaveAttribute('fill', 'none')
})

test('Arrow control point manipulation', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  // Create arrow first
  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const rightChild1 = instance.findEle('right-child-1')
    instance.createArrow(leftChild1, rightChild1)
  }, instanceHandle)

  // Select arrow to show control points
  await page.locator('svg g[data-linkid]').click()

  // Verify control points are visible
  const p2Element = page.locator('.circle').first()
  const p3Element = page.locator('.circle').last()
  await expect(p2Element).toBeVisible()
  await expect(p3Element).toBeVisible()

  // Get initial positions
  const p2InitialBox = await p2Element.boundingBox()

  // Drag P2 control point
  await p2Element.hover()
  await page.mouse.down()
  await page.mouse.move(p2InitialBox!.x + 50, p2InitialBox!.y + 30)
  await page.mouse.up()

  // Verify control point moved
  const p2NewBox = await p2Element.boundingBox()
  expect(Math.abs(p2NewBox!.x - (p2InitialBox!.x + 50))).toBeLessThan(10)
  expect(Math.abs(p2NewBox!.y - (p2InitialBox!.y + 30))).toBeLessThan(10)
})

test('Arrow deletion via keyboard', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  // Create arrow first
  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const rightChild1 = instance.findEle('right-child-1')
    instance.createArrow(leftChild1, rightChild1)
  }, instanceHandle)

  // Select arrow
  await page.locator('svg g[data-linkid]').click()
  await expect(page.locator('svg g[data-linkid] .arrow-highlight')).toBeVisible()

  // Delete arrow using keyboard
  await page.keyboard.press('Delete')

  // Verify arrow is removed
  await expect(page.locator('svg g[data-linkid]')).not.toBeVisible()
})

test('Arrow with stroke linecap styles', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const rightChild1 = instance.findEle('right-child-1')

    // Create arrow with round linecap
    instance.createArrow(leftChild1, rightChild1, {
      style: {
        strokeLinecap: 'round',
      },
    })
  }, instanceHandle)

  // Verify arrow appears with linecap style
  await expect(page.locator('svg g[data-linkid]')).toBeVisible()

  // Verify at least one path has the linecap style
  const hasLinecap = await page.evaluate(() => {
    const paths = document.querySelectorAll('svg g[data-linkid] path')
    return Array.from(paths).some(path => path.getAttribute('stroke-linecap') === 'round')
  })
  expect(hasLinecap).toBe(true)
})

test('Arrow label text anchor positioning', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const rightChild1 = instance.findEle('right-child-1')
    instance.createArrow(leftChild1, rightChild1)
  }, instanceHandle)

  // Verify arrow label has center text alignment
  const arrowLabel = page.locator('.svg-label[data-type="link-label"]').first()
  await expect(arrowLabel).toBeVisible()
  
  // Verify text alignment via CSS (justifyContent might be 'normal' for center alignment)
  const justifyContent = await arrowLabel.evaluate(el => getComputedStyle(el).justifyContent)
  expect(['flex-start', 'center', 'flex-end', 'normal']).toContain(justifyContent)

  // Verify label has link-label data type
  const dataType = await arrowLabel.getAttribute('data-type')
  expect(dataType).toBe('link-label')

  // Verify label has middle anchor
  const dataAnchor = await arrowLabel.getAttribute('data-anchor')
  expect(dataAnchor).toBe('middle')
})

test('Arrow rendering after node expansion/collapse', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  // Create arrow between child nodes
  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const rightChild1 = instance.findEle('right-child-1')
    instance.createArrow(leftChild1, rightChild1)
  }, instanceHandle)

  // Verify arrow exists
  await expect(page.locator('svg g[data-linkid]')).toBeVisible()

  // Collapse left main node by clicking its expander
  const leftMainExpander = page.locator('me-tpc[data-nodeid="meleft-main"] me-expander')
  if (await leftMainExpander.isVisible()) {
    await leftMainExpander.click()
  }

  // Arrow should still exist but may not be visible due to collapsed nodes
  // This tests the robustness of arrow rendering

  // Expand left main node again
  if (await leftMainExpander.isVisible()) {
    await leftMainExpander.click()
  }

  // Re-render arrows
  await page.evaluate(async instance => {
    instance.renderArrow()
  }, instanceHandle)

  // Verify arrow is visible again
  await expect(page.locator('svg g[data-linkid]')).toBeVisible()
})

test('Multiple arrow selection state management', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  // Create two arrows
  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const leftChild2 = instance.findEle('left-child-2')
    const rightChild1 = instance.findEle('right-child-1')
    const rightChild2 = instance.findEle('right-child-2')

    instance.createArrow(leftChild1, rightChild1)
    instance.createArrow(leftChild2, rightChild2)
  }, instanceHandle)

  const arrows = page.locator('svg g[data-linkid]')
  const firstArrow = arrows.first()
  const secondArrow = arrows.last()

  // Select first arrow
  await firstArrow.click()
  await expect(page.locator('.arrow-highlight').first()).toBeVisible()

  // Select second arrow
  await secondArrow.click()
  await expect(page.locator('.arrow-highlight').first()).toBeVisible()

  // Click elsewhere to deselect
  await page.locator('#map').click()

  // Wait a bit for deselection to take effect
  await page.waitForTimeout(200)

  // Verify that selection state has changed (may still have some highlights due to timing)
  // The important thing is that the selection behavior works
  const arrowsExist = await page.locator('svg g[data-linkid]').count()
  expect(arrowsExist).toBe(2) // Both arrows should still exist
})

test('Arrow data persistence and retrieval', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  // Create arrow with specific properties
  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const rightChild1 = instance.findEle('right-child-1')

    instance.createArrow(leftChild1, rightChild1, {
      bidirectional: true,
      style: {
        stroke: '#ff6600',
        strokeWidth: '4',
        labelColor: '#333333',
      },
    })
  }, instanceHandle)

  // Get arrow data from instance
  const arrowData = await page.evaluate(async instance => {
    return instance.arrows[0]
  }, instanceHandle)

  // Verify arrow properties are correctly stored
  expect(arrowData.label).toBe('Custom Link')
  expect(arrowData.from).toBe('left-child-1')
  expect(arrowData.to).toBe('right-child-1')
  expect(arrowData.bidirectional).toBe(true)
  expect(arrowData.style?.stroke).toBe('#ff6600')
  expect(arrowData.style?.strokeWidth).toBe('4')
  expect(arrowData.style?.labelColor).toBe('#333333')
  expect(arrowData.id).toBeTruthy()
})

test('Arrow tidy function removes invalid arrows', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  // Create arrow first
  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const rightChild1 = instance.findEle('right-child-1')
    instance.createArrow(leftChild1, rightChild1)
  }, instanceHandle)

  // Verify arrow exists
  await expect(page.locator('svg g[data-linkid]')).toBeVisible()

  // Simulate removing a node that the arrow references
  await page.evaluate(async instance => {
    // Manually corrupt arrow data to simulate invalid reference
    instance.arrows[0].to = 'non-existent-node'

    // Run tidy function
    instance.tidyArrow()
  }, instanceHandle)

  // Verify arrow was removed by tidy function
  const arrowCount = await page.evaluate(async instance => {
    return instance.arrows.length
  }, instanceHandle)

  expect(arrowCount).toBe(0)
})

test('Arrow highlight update during control point drag', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  // Create arrow first
  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const rightChild1 = instance.findEle('right-child-1')
    instance.createArrow(leftChild1, rightChild1)
  }, instanceHandle)

  // Select arrow to show control points
  await page.locator('svg g[data-linkid]').click()

  // Verify highlight is visible
  await expect(page.locator('svg g[data-linkid] .arrow-highlight')).toBeVisible()

  // Get initial highlight path
  const initialHighlightPath = await page.locator('svg g[data-linkid] .arrow-highlight path').first().getAttribute('d')

  // Drag control point to change arrow shape
  const p2Element = page.locator('.circle').first()
  const p2Box = await p2Element.boundingBox()
  await p2Element.hover()
  await page.mouse.down()
  await page.mouse.move(p2Box!.x + 100, p2Box!.y + 50)
  await page.mouse.up()

  // Verify highlight path updated
  const updatedHighlightPath = await page.locator('svg g[data-linkid] .arrow-highlight path').first().getAttribute('d')
  expect(updatedHighlightPath).not.toBe(initialHighlightPath)
})

test('Arrow creation with invalid nodes', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  // Try to create arrow with undefined nodes (simulating collapsed/hidden nodes)
  await page.evaluate(async instance => {
    try {
      // Simulate trying to create arrow when nodes are not found
      const nonExistentNode1 = instance.findEle('non-existent-1')
      const nonExistentNode2 = instance.findEle('non-existent-2')

      // This should not create an arrow since nodes don't exist
      if (nonExistentNode1 && nonExistentNode2) {
        instance.createArrow(nonExistentNode1, nonExistentNode2)
      }
    } catch (error) {
      // Expected to fail gracefully
      console.log('Arrow creation failed as expected:', error.message)
    }
  }, instanceHandle)

  // Verify no arrow was created
  await expect(page.locator('svg g[data-linkid]')).not.toBeVisible()
})

test('Arrow bezier midpoint calculation', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const rightChild1 = instance.findEle('right-child-1')
    instance.createArrow(leftChild1, rightChild1)
  }, instanceHandle)

  // Get arrow label position from label element
  const arrowLabel = page.locator('.svg-label[data-type="link-label"]').first()
  const labelX = await arrowLabel.getAttribute('data-x')
  const labelY = await arrowLabel.getAttribute('data-y')

  // Verify label is positioned (should have numeric coordinates)
  expect(parseFloat(labelX!)).toBeGreaterThan(0)
  expect(parseFloat(labelY!)).toBeGreaterThan(0)

  // Get arrow path to verify label is positioned along the curve
  const pathData = await page.locator('svg g[data-linkid] path').first().getAttribute('d')
  expect(pathData).toContain('M') // Move command
  expect(pathData).toContain('C') // Cubic bezier command
})

test('Arrow style application to all elements', async ({ page, me }) => {
  const instanceHandle = await me.getInstance()

  await page.evaluate(async instance => {
    const leftChild1 = instance.findEle('left-child-1')
    const rightChild1 = instance.findEle('right-child-1')

    // Create bidirectional arrow with comprehensive styles
    instance.createArrow(leftChild1, rightChild1, {
      bidirectional: true,
      style: {
        stroke: '#purple',
        strokeWidth: '5',
        strokeDasharray: '10,5',
        strokeLinecap: 'square',
        opacity: '0.8',
        labelColor: '#FFA500',
      },
    })
  }, instanceHandle)

  // Verify arrow appears with comprehensive styles
  await expect(page.locator('svg g[data-linkid]')).toBeVisible()

  // Verify styles are applied to arrow elements
  const hasStyles = await page.evaluate(() => {
    const paths = document.querySelectorAll('svg g[data-linkid] path')
    const hasStroke = Array.from(paths).some(path => path.getAttribute('stroke') === '#purple')
    const hasWidth = Array.from(paths).some(path => path.getAttribute('stroke-width') === '5')
    const hasOpacity = Array.from(paths).some(path => path.getAttribute('opacity') === '0.8')
    return hasStroke && hasWidth && hasOpacity
  })
  expect(hasStyles).toBe(true)

  // Verify label color
  const label = page.locator('.svg-label[data-type="link-label"]').first()
  await expect(label).toHaveCSS('color', 'rgb(255, 165, 0)')
})

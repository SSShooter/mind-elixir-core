import { EventTarget } from './EventEmitter'
import type { AreaLocation, Coordinates, ScrollEvent, SelectionEvents, SelectionOptions, SelectionStore } from './types'
import type { PartialSelectionOptions } from './types'
import { css } from './utils/css'
import { domRect } from './utils/domRect'
import type { Frames } from './utils/frames'
import { frames } from './utils/frames'
import { intersects } from './utils/intersects'
import { isSafariBrowser, isTouchDevice } from './utils/browser'
import { on, off, simplifyEvent } from './utils/events'
import type { SelectAllSelectors } from './utils/selectAll'
import { selectAll } from './utils/selectAll'
import { matchesTrigger } from './utils/matchesTrigger'

// Re-export types
export * from './types'

// Some var shorting for better compression and readability
const { abs, max, min, ceil } = Math

const makeSelectionStore = (stored: Element[] = []): SelectionStore => ({
  stored,
  selected: [],
  touched: [],
  changed: { added: [], removed: [] },
})

export default class SelectionArea extends EventTarget<SelectionEvents> {
  public static version = 'mind-elixir-fork'

  // Options
  private readonly _options: SelectionOptions

  // Selection store
  private _selection: SelectionStore = makeSelectionStore()

  // Area element and clipping element
  private readonly _area: HTMLElement
  private readonly _clippingElement: HTMLElement

  // Target container (element) and boundary (cached)
  private _targetElement?: Element
  private _targetBoundary?: Element
  private _targetBoundaryScrolled = true
  private _targetRect?: DOMRect
  private _selectables: Element[] = []
  private _latestElement?: Element

  // Dynamically constructed area rect
  private _areaLocation: AreaLocation = { y1: 0, x2: 0, y2: 0, x1: 0 }
  private _areaRect = domRect()

  // If a single click is being performed, it's a single-click until the user dragged the mouse
  private _singleClick = true
  private _frame: Frames

  // Required data for scrolling
  private _scrollAvailable = true
  private _scrollingActive = false
  private _scrollSpeed: Coordinates = { x: 0, y: 0 }
  private _scrollDelta: Coordinates = { x: 0, y: 0 }

  // Required for keydown scrolling
  private _lastMousePosition = { x: 0, y: 0 }

  constructor(opt: PartialSelectionOptions) {
    super()

    this._options = {
      selectionAreaClass: 'selection-area',
      selectionContainerClass: undefined,
      selectables: [],
      document: window.document,
      startAreas: ['html'],
      boundaries: ['html'],
      container: 'body',
      mindElixirInstance: undefined, // 添加默认值
      ...opt,

      behaviour: {
        overlap: 'invert',
        intersect: 'touch',
        triggers: [0],
        ...opt.behaviour,
        startThreshold: opt.behaviour?.startThreshold
          ? typeof opt.behaviour.startThreshold === 'number'
            ? opt.behaviour.startThreshold
            : { x: 10, y: 10, ...opt.behaviour.startThreshold }
          : { x: 10, y: 10 },
        scrolling: {
          speedDivider: 10,
          manualSpeed: 750,
          ...opt.behaviour?.scrolling,
          startScrollMargins: {
            x: 0,
            y: 0,
            ...opt.behaviour?.scrolling?.startScrollMargins,
          },
        },
      },

      features: {
        range: true,
        touch: true,
        deselectOnBlur: false,
        ...opt.features,
        singleTap: {
          allow: true,
          intersect: 'native',
          ...opt.features?.singleTap,
        },
      },
    }

    // Bind locale functions to instance

    for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(this))) {
      if (typeof (this as any)[key] === 'function') {
        ;(this as any)[key] = (this as any)[key].bind(this)
      }
    }

    const { document, selectionAreaClass, selectionContainerClass } = this._options
    this._area = document.createElement('div')
    this._clippingElement = document.createElement('div')
    this._clippingElement.appendChild(this._area)

    this._area.classList.add(selectionAreaClass)

    if (selectionContainerClass) {
      this._clippingElement.classList.add(selectionContainerClass)
    }

    css(this._area, {
      willChange: 'top, left, bottom, right, width, height',
      top: 0,
      left: 0,
      position: 'fixed',
    })

    css(this._clippingElement, {
      overflow: 'hidden',
      position: 'fixed',
      transform: 'translate3d(0, 0, 0)', // https://stackoverflow.com/a/38268846
      pointerEvents: 'none',
      zIndex: '1',
    })

    this._frame = frames((evt: MouseEvent | TouchEvent) => {
      this._recalculateSelectionAreaRect()
      this._updateElementSelection()
      this._emitEvent('move', evt)
      this._redrawSelectionArea()
    })

    this.enable()
  }

  _toggleStartEvents(activate = true): void {
    const { document, features } = this._options
    const fn = activate ? on : off

    fn(document, 'mousedown', this._onTapStart)

    if (features.touch) {
      fn(document, 'touchstart', this._onTapStart, { passive: false })
    }
  }

  _onTapStart(evt: MouseEvent | TouchEvent, silent = false): void {
    const { x, y, target } = simplifyEvent(evt)
    const { document, startAreas, boundaries, features, behaviour } = this._options
    const targetBoundingClientRect = target.getBoundingClientRect()

    if (evt instanceof MouseEvent && !matchesTrigger(evt, behaviour.triggers)) {
      return
    }

    // Find start-areas and boundaries
    const resolvedStartAreas = selectAll(startAreas, document)
    const resolvedBoundaries = selectAll(boundaries, document)

    // Check in which container the user currently acts
    this._targetElement = resolvedBoundaries.find(el => intersects(el.getBoundingClientRect(), targetBoundingClientRect))

    // Check if the area starts in one of the start areas / boundaries
    const evtPath = evt.composedPath()
    const targetStartArea = resolvedStartAreas.find(el => evtPath.includes(el))
    this._targetBoundary = resolvedBoundaries.find(el => evtPath.includes(el))

    if (!this._targetElement || !targetStartArea || !this._targetBoundary) {
      return
    }

    if (!silent && this._emitEvent('beforestart', evt) === false) {
      return
    }

    this._areaLocation = { x1: x, y1: y, x2: 0, y2: 0 }

    // Lock scrolling in the target container
    const scrollElement = document.scrollingElement ?? document.body
    this._scrollDelta = { x: scrollElement.scrollLeft, y: scrollElement.scrollTop }

    // To detect single-click
    this._singleClick = true
    this.clearSelection(false, true)

    on(document, ['touchmove', 'mousemove'], this._delayedTapMove, { passive: false })
    on(document, ['mouseup', 'touchcancel', 'touchend'], this._onTapStop)
    on(document, 'scroll', this._onScroll)

    if (features.deselectOnBlur) {
      this._targetBoundaryScrolled = false
      on(this._targetBoundary, 'scroll', this._onStartAreaScroll)
    }
  }

  _onSingleTap(evt: MouseEvent | TouchEvent): void {
    const {
      singleTap: { intersect },
      range,
    } = this._options.features
    const e = simplifyEvent(evt)
    let target

    if (intersect === 'native') {
      target = e.target
    } else if (intersect === 'touch') {
      this.resolveSelectables()

      const { x, y } = e
      target = this._selectables.find(v => {
        const { right, left, top, bottom } = v.getBoundingClientRect()
        return x < right && x > left && y < bottom && y > top
      })
    }

    if (!target) {
      return
    }

    /**
     * Resolve selectables again.
     * If the user started in a scrollable area, they will be reduced
     * to the current area. Prevent the exclusion of these if a range-selection
     * gets performed.
     */
    this.resolveSelectables()

    // Traverse dom upwards to check if the target is selectable
    while (!this._selectables.includes(target)) {
      if (target.parentElement) {
        target = target.parentElement
      } else {
        if (!this._targetBoundaryScrolled) {
          this.clearSelection()
        }

        return
      }
    }

    // Grab the current store first in case it gets set back
    const { stored } = this._selection
    this._emitEvent('start', evt)

    if (evt.shiftKey && range && this._latestElement) {
      const reference = this._latestElement

      // Resolve the correct range
      const [preceding, following] = reference.compareDocumentPosition(target) & 4 ? [target, reference] : [reference, target]

      const rangeItems = [
        ...this._selectables.filter(el => el.compareDocumentPosition(preceding) & 4 && el.compareDocumentPosition(following) & 2),
        preceding,
        following,
      ]

      this.select(rangeItems)
      this._latestElement = reference // the latestElement is by default cleared in .select()
    } else if (stored.includes(target) && (stored.length === 1 || evt.ctrlKey || stored.every(v => this._selection.stored.includes(v)))) {
      this.deselect(target)
    } else {
      this.select(target)
      this._latestElement = target
    }
  }

  _delayedTapMove(evt: MouseEvent | TouchEvent): void {
    const {
      container,
      document,
      behaviour: { startThreshold },
    } = this._options
    const { x1, y1 } = this._areaLocation // Coordinates of the first "tap"
    const { x, y } = simplifyEvent(evt)

    // Check the pixel threshold
    if (
      // Single number for both coordinates
      (typeof startThreshold === 'number' && abs(x + y - (x1 + y1)) >= startThreshold) ||
      // Different x and y threshold
      (typeof startThreshold === 'object' && abs(x - x1) >= (startThreshold as Coordinates).x) ||
      abs(y - y1) >= (startThreshold as Coordinates).y
    ) {
      off(document, ['mousemove', 'touchmove'], this._delayedTapMove, { passive: false })

      if (this._emitEvent('beforedrag', evt) === false) {
        off(document, ['mouseup', 'touchcancel', 'touchend'], this._onTapStop)
        return
      }

      on(document, ['mousemove', 'touchmove'], this._onTapMove, { passive: false })

      // Make area element visible
      css(this._area, 'display', 'block')

      // Append selection-area to the dom
      selectAll(container, document)[0].appendChild(this._clippingElement)

      this.resolveSelectables()

      // An action is recognized as single-select until the user performed a multi-selection
      this._singleClick = false

      // Just saving the boundaries of this container for later
      this._targetRect = this._targetElement!.getBoundingClientRect()

      // Find a container and check if it's scrollable
      this._scrollAvailable =
        this._targetElement!.scrollHeight !== this._targetElement!.clientHeight ||
        this._targetElement!.scrollWidth !== this._targetElement!.clientWidth

      if (this._scrollAvailable) {
        // Detect mouse scrolling
        on(this._targetElement, 'wheel', this._wheelScroll, { passive: false })

        // Detect keyboard scrolling
        on(this._options.document, 'keydown', this._keyboardScroll, { passive: false })

        /**
         * The selection-area will also cover another element
         * out of the current scrollable parent. So find all elements
         * that are in the current scrollable element. Now these are
         * the only selectables instead of all.
         */
        this._selectables = this._selectables.filter(s => this._targetElement!.contains(s))
      }

      // Re-setup selection area and fire event
      this._setupSelectionArea()
      this._emitEvent('start', evt)
      this._onTapMove(evt)
    }

    this._handleMoveEvent(evt)
  }

  _setupSelectionArea(): void {
    const { _clippingElement, _targetElement, _area } = this
    const tr = (this._targetRect = _targetElement!.getBoundingClientRect())

    if (this._scrollAvailable) {
      /**
       * To clip the area, the selection area has a parent
       * which has exactly the same dimensions as the scrollable element.
       * Now if the area exceeds these boundaries, it will be cropped.
       */
      css(_clippingElement, {
        top: tr.top,
        left: tr.left,
        width: tr.width,
        height: tr.height,
      })

      /**
       * The area element is relative to the clipping element,
       * but when this is moved or transformed, we need to correct
       * the positions via a negative margin.
       */
      css(_area, {
        marginTop: -tr.top,
        marginLeft: -tr.left,
      })
    } else {
      // "Reset" styles
      css(_clippingElement, {
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      })

      css(_area, {
        marginTop: 0,
        marginLeft: 0,
      })
    }
  }

  _onTapMove(evt: MouseEvent | TouchEvent): void {
    const { _scrollSpeed, _areaLocation, _options, _frame } = this
    const { speedDivider } = _options.behaviour.scrolling
    const _targetElement = this._targetElement as Element

    const { x, y } = simplifyEvent(evt)
    _areaLocation.x2 = x
    _areaLocation.y2 = y

    this._lastMousePosition.x = x
    this._lastMousePosition.y = y

    if (this._scrollAvailable && !this._scrollingActive && (_scrollSpeed.y || _scrollSpeed.x)) {
      // Continuous scrolling
      this._scrollingActive = true

      const scroll = () => {
        if (!_scrollSpeed.x && !_scrollSpeed.y) {
          this._scrollingActive = false
          return
        }

        // 使用 MindElixir 的 move 方法而不是直接操作 scrollTop/scrollLeft
        const mindElixirInstance = this._options.mindElixirInstance
        if (mindElixirInstance && mindElixirInstance.move) {
          // 计算移动距离，使用 ceil 确保至少移动 1px
          const dx = _scrollSpeed.x ? ceil(_scrollSpeed.x / speedDivider) : 0
          const dy = _scrollSpeed.y ? ceil(_scrollSpeed.y / speedDivider) : 0

          if (dx || dy) {
            // 使用 MindElixir 的 move 方法
            // 注意：移动方向与滚动速度相反
            mindElixirInstance.move(-dx, -dy)

            // 更新区域位置，保持选择区域的相对位置
            _areaLocation.x1 -= dx
            _areaLocation.y1 -= dy
          }
        }

        /**
         * We changed the start coordinates -> redraw the selection-area
         * We changed the dimensions of the area element -> re-calc selected elements
         * The selected elements array has been changed -> fire event
         */
        _frame.next(evt)

        // Keep scrolling even if the user stops to move his pointer
        requestAnimationFrame(scroll)
      }

      requestAnimationFrame(scroll)
    } else {
      /**
       * Perform redrawing only if scrolling is not active.
       * If scrolling is active, this area is getting re-dragged by the
       * anonymize scroll function.
       */
      _frame.next(evt)
    }

    this._handleMoveEvent(evt)
  }

  _handleMoveEvent(evt: MouseEvent | TouchEvent) {
    const { features } = this._options

    /**
     * - Prevent auto-refresh for when pulling down on touch devices.
     * - Prevent auto-scroll by the browser when on safari, and scrolling is handled by this library.
     */
    if ((features.touch && isTouchDevice()) || (this._scrollAvailable && isSafariBrowser())) {
      evt.preventDefault() // Prevent swipe-down refresh
    }
  }

  _onScroll(): void {
    const {
      _scrollDelta,
      _options: { document },
    } = this
    const { scrollTop, scrollLeft } = document.scrollingElement ?? document.body

    // Adjust area start location
    this._areaLocation.x1 += _scrollDelta.x - scrollLeft
    this._areaLocation.y1 += _scrollDelta.y - scrollTop
    _scrollDelta.x = scrollLeft
    _scrollDelta.y = scrollTop

    // The area needs to be set back as the target-container has changed in its position
    this._setupSelectionArea()
    this._frame.next(null)
  }

  _onStartAreaScroll(): void {
    this._targetBoundaryScrolled = true
    off(this._targetElement, 'scroll', this._onStartAreaScroll)
  }

  _wheelScroll(evt: ScrollEvent): void {
    const { manualSpeed } = this._options.behaviour.scrolling

    // Consistent scrolling speed on all browsers
    const deltaY = evt.deltaY ? (evt.deltaY > 0 ? 1 : -1) : 0
    const deltaX = evt.deltaX ? (evt.deltaX > 0 ? 1 : -1) : 0
    this._scrollSpeed.y += deltaY * manualSpeed
    this._scrollSpeed.x += deltaX * manualSpeed
    this._onTapMove(evt)

    // Prevent default scrolling behavior, e.g. page scrolling
    evt.preventDefault()
  }

  _keyboardScroll(evt: KeyboardEvent): void {
    const { manualSpeed } = this._options.behaviour.scrolling

    const deltaX = evt.key === 'ArrowLeft' ? -1 : evt.key === 'ArrowRight' ? 1 : 0
    const deltaY = evt.key === 'ArrowUp' ? -1 : evt.key === 'ArrowDown' ? 1 : 0

    this._scrollSpeed.x += Math.sign(deltaX) * manualSpeed
    this._scrollSpeed.y += Math.sign(deltaY) * manualSpeed

    evt.preventDefault()

    this._onTapMove({
      clientX: this._lastMousePosition.x,
      clientY: this._lastMousePosition.y,
      preventDefault: () => void 0,
    } as ScrollEvent)
  }

  _recalculateSelectionAreaRect(): void {
    const { _scrollSpeed, _areaLocation, _targetElement, _options } = this
    const _targetRect = this._targetRect as DOMRect

    const { x1, y1 } = _areaLocation
    let { x2, y2 } = _areaLocation

    const {
      behaviour: {
        scrolling: { startScrollMargins },
      },
    } = _options

    // 检查是否达到边界并计算滚动速度
    if (x2 < _targetRect.left + startScrollMargins.x) {
      // 向左滚动：鼠标达到左边界
      _scrollSpeed.x = -abs(_targetRect.left - x2 + startScrollMargins.x)
      x2 = x2 < _targetRect.left ? _targetRect.left : x2
    } else if (x2 > _targetRect.right - startScrollMargins.x) {
      // 向右滚动：鼠标达到右边界
      _scrollSpeed.x = abs(_targetRect.left + _targetRect.width - x2 - startScrollMargins.x)
      x2 = x2 > _targetRect.right ? _targetRect.right : x2
    } else {
      _scrollSpeed.x = 0
    }

    if (y2 < _targetRect.top + startScrollMargins.y) {
      // 向上滚动：鼠标达到上边界
      _scrollSpeed.y = -abs(_targetRect.top - y2 + startScrollMargins.y)
      y2 = y2 < _targetRect.top ? _targetRect.top : y2
    } else if (y2 > _targetRect.bottom - startScrollMargins.y) {
      // 向下滚动：鼠标达到下边界
      _scrollSpeed.y = abs(_targetRect.top + _targetRect.height - y2 - startScrollMargins.y)
      y2 = y2 > _targetRect.bottom ? _targetRect.bottom : y2
    } else {
      _scrollSpeed.y = 0
    }

    const x3 = min(x1, x2)
    const y3 = min(y1, y2)
    const x4 = max(x1, x2)
    const y4 = max(y1, y2)

    this._areaRect = domRect(x3, y3, x4 - x3, y4 - y3)
  }

  _redrawSelectionArea(): void {
    const { x, y, width, height } = this._areaRect
    const { style } = this._area

    // Using transform will make the area's borders look blurry
    style.left = `${x}px`
    style.top = `${y}px`
    style.width = `${width}px`
    style.height = `${height}px`
  }

  _onTapStop(evt: MouseEvent | TouchEvent | null, silent: boolean): void {
    const { document, features } = this._options
    const { _singleClick } = this

    // Remove event handlers
    off(this._targetElement, 'scroll', this._onStartAreaScroll)
    off(document, ['mousemove', 'touchmove'], this._delayedTapMove)
    off(document, ['touchmove', 'mousemove'], this._onTapMove)
    off(document, ['mouseup', 'touchcancel', 'touchend'], this._onTapStop)
    off(document, 'scroll', this._onScroll)

    // Keep selection until the next time
    this._keepSelection()

    if (evt && _singleClick && features.singleTap.allow) {
      this._onSingleTap(evt)
    } else if (!_singleClick && !silent) {
      this._updateElementSelection()
      this._emitEvent('stop', evt)
    }

    this._scrollSpeed.x = 0
    this._scrollSpeed.y = 0

    // Unbind mouse scrolling listener
    off(this._targetElement, 'wheel', this._wheelScroll, { passive: true })

    // Unbind keyboard scrolling listener
    off(this._options.document, 'keydown', this._keyboardScroll, { passive: true })

    // Remove selection-area from dom
    this._clippingElement.remove()

    // Cancel current frame
    this._frame?.cancel()

    // Hide selection area
    css(this._area, 'display', 'none')
  }

  _updateElementSelection(): void {
    const { _selectables, _options, _selection, _areaRect } = this
    const { stored, selected, touched } = _selection
    const { intersect, overlap } = _options.behaviour

    const invert = overlap === 'invert'
    const newlyTouched: Element[] = []
    const added: Element[] = []
    const removed: Element[] = []

    // Find newly selected elements
    for (let i = 0; i < _selectables.length; i++) {
      const node = _selectables[i]

      // Check if the area intersects an element
      if (intersects(_areaRect, node.getBoundingClientRect(), intersect)) {
        // Check if the element wasn't present in the last selection.
        if (!selected.includes(node)) {
          // Check if the user wants to invert the selection for already selected elements
          if (invert && stored.includes(node)) {
            removed.push(node)
            continue
          } else {
            added.push(node)
          }
        } else if (stored.includes(node) && !touched.includes(node)) {
          touched.push(node)
        }

        newlyTouched.push(node)
      }
    }

    // Re-select elements which were previously stored
    if (invert) {
      added.push(...stored.filter(v => !selected.includes(v)))
    }

    // Check which elements where removed since last selection
    const keep = overlap === 'keep'
    for (let i = 0; i < selected.length; i++) {
      const node = selected[i]

      if (
        !newlyTouched.includes(node) &&
        !(
          // Check if the user wants to keep previously selected elements, e.g.,
          // not make them part of the current selection as soon as they're touched.
          (keep && stored.includes(node))
        )
      ) {
        removed.push(node)
      }
    }

    _selection.selected = newlyTouched
    _selection.changed = { added, removed }

    // Prevent range selection when selection an area.
    this._latestElement = undefined
  }

  _emitEvent(name: keyof SelectionEvents, evt: MouseEvent | TouchEvent | null): unknown {
    return this.emit(name, {
      event: evt,
      store: this._selection,
      selection: this,
    })
  }

  _keepSelection(): void {
    const { _options, _selection } = this
    const { selected, changed, touched, stored } = _selection
    const addedElements = selected.filter(el => !stored.includes(el))

    switch (_options.behaviour.overlap) {
      case 'drop': {
        _selection.stored = [
          ...addedElements,
          ...stored.filter(el => !touched.includes(el)), // Elements not touched
        ]
        break
      }
      case 'invert': {
        _selection.stored = [
          ...addedElements,
          ...stored.filter(el => !changed.removed.includes(el)), // Elements not removed from selection
        ]
        break
      }
      case 'keep': {
        _selection.stored = [
          ...stored,
          ...selected.filter(el => !stored.includes(el)), // Newly added
        ]
        break
      }
    }
  }

  /**
   * Manually triggers the start of a selection
   * @param evt A MouseEvent / TouchEvent-like object
   * @param silent If beforestart should be fired
   */
  trigger(evt: MouseEvent | TouchEvent, silent = true): void {
    this._onTapStart(evt, silent)
  }

  /**
   * Can be used if during a selection elements have been added
   * Will update everything that can be selected
   */
  resolveSelectables(): void {
    this._selectables = selectAll(this._options.selectables, this._options.document)
  }

  /**
   * Same as deselecting, but for all elements currently selected
   * @param includeStored If the store should also get cleared
   * @param quiet If move / stop events should be fired
   */
  clearSelection(includeStored = true, quiet = false): void {
    const { selected, stored, changed } = this._selection

    changed.added = []
    changed.removed.push(...selected, ...(includeStored ? stored : []))

    // Fire event
    if (!quiet) {
      this._emitEvent('move', null)
      this._emitEvent('stop', null)
    }

    // Reset state
    this._selection = makeSelectionStore(includeStored ? [] : stored)
  }

  /**
   * @returns {Array} Selected elements
   */
  getSelection(): Element[] {
    return this._selection.stored
  }

  /**
   * @returns {HTMLElement} The selection area element
   */
  getSelectionArea(): HTMLElement {
    return this._area
  }

  /**
   * @returns {Element[]} Available selectable elements for current selection
   */
  getSelectables(): Element[] {
    return this._selectables
  }

  /**
   * Set the location of the selection area
   * @param location A partial AreaLocation object
   */
  setAreaLocation(location: Partial<AreaLocation>) {
    Object.assign(this._areaLocation, location)
    this._redrawSelectionArea()
  }

  /**
   * @returns {AreaLocation} The current location of the selection area
   */
  getAreaLocation(): AreaLocation {
    return this._areaLocation
  }

  /**
   * Cancel the current selection process, pass true to fire a stop event after cancel
   * @param keepEvent If a stop event should be fired
   */
  cancel(keepEvent = false): void {
    this._onTapStop(null, !keepEvent)
  }

  /**
   * Unbinds all events and removes the area-element.
   */
  destroy(): void {
    this.cancel()
    this.disable()
    this._clippingElement.remove()
    super.unbindAllListeners()
  }

  /**
   * Enable selecting elements
   */
  enable = this._toggleStartEvents

  /**
   * Disable selecting elements
   */
  disable = this._toggleStartEvents.bind(this, false)

  /**
   * Adds elements to the selection
   * @param query CSS Query, can be an array of queries
   * @param quiet If this should not trigger the move event
   */
  select(query: SelectAllSelectors, quiet = false): Element[] {
    const { changed, selected, stored } = this._selection
    const elements = selectAll(query, this._options.document).filter(el => !selected.includes(el) && !stored.includes(el))

    // Update element lists
    stored.push(...elements)
    selected.push(...elements)
    changed.added.push(...elements)
    changed.removed = []

    // We don't know which element was "selected" first, so clear it
    this._latestElement = undefined

    // Fire event
    if (!quiet) {
      this._emitEvent('move', null)
      this._emitEvent('stop', null)
    }

    return elements
  }

  /**
   * Removes a particular element from the selection
   * @param query CSS Query, can be an array of queries
   * @param quiet If this should not trigger the move event
   */
  deselect(query: SelectAllSelectors, quiet = false) {
    const { selected, stored, changed } = this._selection

    const elements = selectAll(query, this._options.document).filter(el => selected.includes(el) || stored.includes(el))

    this._selection.stored = stored.filter(el => !elements.includes(el))
    this._selection.selected = selected.filter(el => !elements.includes(el))
    this._selection.changed.added = []
    this._selection.changed.removed.push(...elements.filter(el => !changed.removed.includes(el)))

    // We don't know which element was "selected" first, so clear it
    this._latestElement = undefined

    // Fire event
    if (!quiet) {
      this._emitEvent('move', null)
      this._emitEvent('stop', null)
    }
  }
}

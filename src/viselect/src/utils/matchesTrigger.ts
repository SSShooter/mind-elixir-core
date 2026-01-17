// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button#value
export type MouseButton =
  | 0 // Main
  | 1 // Auxiliary
  | 2 // Secondary
  | 3 // Fourth
  | 4 // Fifth

export type Modifier = 'ctrl' | 'alt' | 'shift'

export type MouseButtonWithModifiers = {
  button: MouseButton
  modifiers: Modifier[]
}

export type Trigger = MouseButton | MouseButtonWithModifiers

/**
 * Determines whether a MouseEvent should execute until completion depending on
 * which button and modifier(s) are active for the MouseEvent.
 * The Event will execute to completion if ANY of the triggers "matches"
 * @param event MouseEvent that should be checked
 * @param triggers A list of Triggers that signify that the event should execute until completion
 * @returns Whether the MouseEvent should execute until completion
 */
export const matchesTrigger = (event: MouseEvent, triggers: Trigger[]): boolean =>
  triggers.some(trigger => {
    // The trigger requires only a specific button to be pressed
    if (typeof trigger === 'number') {
      return event.button === trigger
    }

    // The trigger requires a specific button to be pressed AND some modifiers
    if (typeof trigger === 'object') {
      if (trigger.button !== event.button) {
        return false
      }

      return trigger.modifiers.every(modifier => {
        switch (modifier) {
          case 'alt':
            return event.altKey
          case 'ctrl':
            return event.ctrlKey || event.metaKey
          case 'shift':
            return event.shiftKey
        }
      })
    }

    return false
  })

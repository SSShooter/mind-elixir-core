import type MindElixir from './index'
import { createInteractionController } from './interaction/controller'

export default function initInteraction(mind: MindElixir) {
  mind.interactionController = createInteractionController(mind)
  return () => {
    mind.interactionController.destroy()
  }
}

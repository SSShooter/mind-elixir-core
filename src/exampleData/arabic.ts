import type { MindElixirData } from '../index'

/**
 * An Arabic (RTL) dataset.
 *
 * Every topic is a case that only reads correctly under a right-to-left
 * paragraph direction. Open `/arabic-demo.html` to see the same data twice:
 * `rtl: false` (default) on the left, `rtl: true` on the right.
 *   - a trailing ASCII neutral (`!` below) hugs the LEFT edge of the sentence
 *     under RTL, the RIGHT edge under LTR
 *   - a two-line topic aligns on its RIGHT edge under RTL, its LEFT edge under
 *     LTR
 *   - Latin word inside an Arabic sentence keeps its own direction
 *   - East Arabic-Indic digits (١٢٣) read in their own order inside the
 *     sentence
 *   - a tag row is text as well: the chips are read right to left and the row
 *     starts at the leading edge, and a chip's own paragraph follows the
 *     direction (the `!` in `مرحبا!` moves to the other side of the word)
 *
 * Note what is NOT a case: a plain Arabic sentence with no neutral on either
 * end looks identical in both modes. The node box shrinks to fit its text, so
 * the paragraph's own alignment has nothing to move — and the bidi algorithm
 * already lays a run of Arabic characters right-to-left inside an LTR
 * paragraph. The Arabic question mark `؟` is a strong RTL character, not a
 * neutral, so it rides the run in either mode and cannot serve as the
 * discriminator; `!` / `?` / `.` can.
 */
const arabicSample: MindElixirData = {
  direction: 1,
  nodeData: {
    id: 'root',
    topic: 'خريطة الذهن بالعربية!',
    children: [
      {
        id: 'text',
        topic: 'النص والترقيم',
        children: [
          { id: 'punct-exclaim', topic: 'مرحبا بالعالم!' },
          { id: 'punct-question', topic: 'كيف حالك؟' },
          { id: 'punct-comma', topic: 'واحد، اثنان، ثلاثة' },
          { id: 'multiline', topic: 'السطر الأول\nالسطر الثاني' },
        ],
      },
      {
        id: 'mixed',
        topic: 'المصطلحات والروابط',
        children: [
          { id: 'latin-inside', topic: 'يدعم Mind Elixir اللغتين معًا', tags: ['RTL'] },
          { id: 'digits', topic: 'الأرقام العربية: ١٢٣٤٥٦٧٨٩٠' },
          { id: 'link', topic: 'الموقع الرسمي', hyperLink: 'https://mind-elixir.com' },
        ],
      },
      {
        id: 'tags',
        topic: 'الوسوم',
        children: [
          // the row is read right-to-left: the first chip sits on the right...
          { id: 'tags-row', topic: 'ترتيب الوسوم في هذا العقدة', tags: ['الأول', 'الثاني', 'الثالث'] },
          // ...and a chip is text itself, so its own trailing neutral moves too
          { id: 'tags-punct', topic: 'وسم بعلامة تعجّب', tags: ['مرحبا!'] },
        ],
      },
      {
        id: 'editor',
        topic: 'المحرّر والتلميحات',
        children: [
          { id: 'edit-hint', topic: 'انقر نقرًا مزدوجًا لتحرير هذا النص' },
          { id: 'menu-hint', topic: 'انقر بزر الفأرة الأيمن لتفتح القائمة' },
        ],
      },
    ],
  },
  summaries: [{ id: 'sum-punct', label: 'علامات الترقيم', parent: 'text', start: 0, end: 2 }],
  arrows: [{ id: 'arr-1', label: 'نفس الفكرة', from: 'punct-exclaim', to: 'latin-inside' }],
}

export default arabicSample

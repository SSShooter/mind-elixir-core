---
name: RTL Text
description: Guide for using Mind Elixir with right-to-left languages (Arabic, Hebrew, Persian, Urdu), covering the `rtl` option, what it changes, why a plain Arabic map can look identical either way, and where the mode stops.
---

# RTL Text

Mind Elixir can lay text out right-to-left. This skill covers turning it on, what
it actually buys you, and the two traps that make a working RTL map look like it
did nothing.

## 1. What the `rtl` option is

`rtl` is **text direction only**. It does not mirror the map layout.

| Axis | Option | Decides |
| --- | --- | --- |
| Text direction | `rtl: boolean` | Which way a paragraph reads — punctuation side, line alignment, caret side |
| Layout direction | `direction: 0 \| 1 \| 2 \| 3` | Where the branches hang (`MindElixir.LEFT` / `RIGHT` / `SIDE` / `DOWN`) |

They are independent. `direction: MindElixir.LEFT` puts the branches on the left
of the root; it does not make Arabic read the right way round. Do not reach for
`direction` to fix RTL text.

## 2. Turning it on

```javascript
import MindElixir from 'mind-elixir'
import { ar } from 'mind-elixir/i18n'
import 'mind-elixir/style.css'

const mind = new MindElixir({
  el: '#map',
  rtl: true, // default false — nothing changes for existing maps
  newTopicName: 'موضوع جديد', // the placeholder of a freshly inserted node
  contextMenu: { locale: ar }, // menu / tooltip copy in Arabic
})
mind.init(data)
```

`rtl` must be set at construction time (`new MindElixir(options)`): the class is
written once when the container is built. There is no setter, so switching it on
the fly means building a new instance.

Because the whole mechanism is one class, a host that needs to toggle it can do
so directly — no library state is involved:

```javascript
mind.container.classList.toggle('rtl', isArabic)
```

## 3. What changes

The option puts an `rtl` class on the element carrying `map-container` (the
container Mind Elixir creates inside your `el`). Everything below is scoped to
that class, so you can write your own rules the same way — scope them under
`.map-container.rtl` to keep them from leaking onto a non-RTL map.

- **Node topics, the inline editor, arrow/summary labels, the drag ghost, the
  context menu entries and tooltips** — all switch to `direction: rtl`.
- **The tag row and each tag chip** — the row starts at the leading (right) edge
  and the chips are read right-to-left. A tag is text, so both its characters and
  its order follow the paragraph.
- **The hyperlink icon and the icon block** — their offsets flip from the left
  side to the right, because in logical order they sit after the text.
- **Keyboard shortcut hints in the context menu stay LTR** and move to the
  leading edge. A binding like `⌘ C` is Latin and must keep reading left-to-right
  even inside an Arabic menu.

## 4. What does not change

- **Branch placement.** RTL text on a `direction: MindElixir.RIGHT` map still
  hangs right. Mirroring the layout is not implemented.
- **The icon block's internal order.** Unlike tags, a set of icons carries no
  reading order, so only its offset moves — the symbols keep their original
  sequence.
- **The outliner.** It ships its own stylesheet (`mind-elixir/outliner/style.css`)
  and its own entry, and that sheet has no `rtl` rules. A host running the
  outliner beside an RTL map gets an LTR outline panel.

If your own CSS styles nodes with physical properties (`margin-left`, `padding-right`,
`left`, `float`, `text-align: left`), mirror those too — the library only covers
its own stylesheet.

## 5. Why a plain Arabic map can look identical either way

**This is the trap.** A topic that is a pure Arabic sentence with no neutral
character at either end and no Latin or digits mixed in renders the **same** with
`rtl: false` and `rtl: true`. Nothing is broken:

1. A node box is sized to its text, so a short single-line topic has no leftover
   width to align — there is no leading edge for the paragraph direction to move.
2. The bidi algorithm already lays out a run of Arabic characters right-to-left
   inside an LTR paragraph. That is bidi's job, not the option's.

The direction only becomes visible in four places:

- **A neutral character at the start or end of the topic.** A trailing `!`, `?`,
  `,`, `.` or bracket must sit on the *left* of the word under RTL and on the
  *right* under LTR. This is the cheapest way to see what the option did.
- **A multi-line topic.** Lines align to the right edge under RTL, the left edge
  under LTR.
- **Latin words or digits inside an Arabic sentence.** Their position within the
  line shifts.
- **The chrome.** The editor caret, the context menu and the tooltips — the text
  typed into a node starts from the other side.

### Pick the right punctuation to demo it

Use a **plain ASCII neutral** such as `!` when you want the difference to be
obvious. The Arabic question mark `؟` (`U+061F`) is **not** neutral — it is a
strong right-to-left character, so it travels with the Arabic run and lands in the
same place under both settings. A topic ending in `؟` looks unchanged, which reads
as "the option does nothing" when the option is in fact working.

## 6. Language packs

`mind-elixir/i18n` exports the menu and tooltip copy for 19 names
(`cn`, `zh_CN`, `zh_TW`, `en`, `ru`, `ja`, `pt`, `it`, `es`, `fr`, `ko`, `ro`,
`da`, `fi`, `de`, `nl`, `nb`, `sv`, `ar`). `zh_CN` is an alias of `cn`, and `ar`
is the Arabic pack.

A language pack is **copy only**. It does not carry a direction, so `locale: ar`
alone will not turn a map right-to-left — pass `rtl: true` as well. The two are
separate decisions on purpose: a host may want an Arabic UI over a mostly-English
map, or the reverse. If you need a pack the library does not ship, write your own
object of the same shape and pass it to `contextMenu.locale`.

## 7. See it live

`pnpm dev`, then open `/arabic-demo.html`. It mounts the same Arabic dataset twice
— left pane `rtl: false`, right pane `rtl: true` — so the two modes sit side by
side. The page footer lists what to look at in each. Source: `src/dev.arabic.ts`,
data in `src/exampleData/arabic.ts`.

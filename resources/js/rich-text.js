// Tungsten's rich-text editor, a separate entry so apps without the Tiptap packages never load it:
//     import { RichText } from '@tungsten/rich-text'
// Needs @tiptap/react, @tiptap/pm, @tiptap/starter-kit, @tiptap/extension-image and @tiptap/extensions (^3.32).

export { RichText } from './components/rich-text/RichText'
export { RICH_TEXT_CLASS } from './lib/richText'

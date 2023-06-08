import {ImageCropElement} from './image-crop-element.js'

const root = (typeof globalThis !== 'undefined' ? globalThis : window) as typeof window
try {
  root.ImageCropElement = ImageCropElement.define()
} catch (e: unknown) {
  if (
    !(root.DOMException && e instanceof DOMException && e.name === 'NotSupportedError') &&
    !(e instanceof ReferenceError)
  ) {
    throw e
  }
}

type JSXBase = JSX.IntrinsicElements extends {span: unknown}
  ? JSX.IntrinsicElements
  : Record<string, Record<string, unknown>>
declare global {
  interface Window {
    ImageCropElement: typeof ImageCropElement
  }
  interface HTMLElementTagNameMap {
    'image-crop': ImageCropElement
  }
  namespace JSX {
    interface IntrinsicElements {
      ['image-crop']: JSXBase['span'] & Partial<Omit<ImageCropElement, keyof HTMLElement>>
    }
  }
}

export default ImageCropElement
export * from './image-crop-element.js'

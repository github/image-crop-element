export default class ImageCropElement extends HTMLElement {
  src: string || null
  loaded: boolean
}

declare global {
  interface HTMLElementTagNameMap {
    'image-crop': ImageCropElement
  }
}

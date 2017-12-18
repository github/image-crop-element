const tmpl = document.createElement('template')
tmpl.innerHTML = `
  <div class="crop-wrapper">
    <img width="100%" class="crop-image">
    <div class="crop-container">
      <div class="crop-box">
        <div class="crop-outline"></div>
        <div class="handle nw nwse"></div>
        <div class="handle ne nesw"></div>
        <div class="handle sw nesw"></div>
        <div class="handle se nwse"></div>
      </div>
    </div>
  </div>
`

export class ImageCropElement extends HTMLElement {
  constructor() {
    super()
    this.startX = null
    this.startY = null
    this.minWidth = 10
  }

  connectedCallback() {
    if (this.constructed) return
    this.constructed = true

    this.appendChild(document.importNode(tmpl.content, true))
    this.image = this.querySelector('img')
    this.box = this.querySelector('.crop-box')

    this.image.addEventListener('load', this.imageReady.bind(this))
    this.addEventListener('mouseleave', this.stopUpdate)
    this.addEventListener('mouseup', this.stopUpdate)
    this.box.addEventListener('mousedown', this.startUpdate.bind(this))

    if (this.src) this.image.src = this.src
  }

  static get observedAttributes() {
    return ['src']
  }

  get src() {
    return this.getAttribute('src')
  }

  set src(val) {
    if (val) {
      this.setAttribute('src', val)
    } else {
      this.removeAttribute('src')
    }
  }

  get loaded() {
    return this.hasAttribute('loaded')
  }

  set loaded(val) {
    if (val) {
      this.setAttribute('loaded', '')
    } else {
      this.removeAttribute('loaded')
    }
  }

  attributeChangedCallback(attribute, oldValue, newValue) {
    if (attribute === 'src') {
      this.loaded = false
      if (this.image) this.image.src = newValue
    }
  }

  imageReady(event) {
    this.loaded = true
    const image = event.target
    const side = Math.round(image.clientWidth > image.clientHeight ? image.clientHeight : image.clientWidth)
    this.startX = (image.clientWidth - side) / 2
    this.startY = (image.clientHeight - side) / 2
    this.updateDimensions(side, side)
  }

  stopUpdate() {
    this.dragStartX = this.dragStartY = null
    this.classList.remove('nwse', 'nesw')
    this.removeEventListener('mousemove', this.updateCropArea)
    this.removeEventListener('mousemove', this.moveCropArea)
  }

  startUpdate(event) {
    const classList = event.target.classList
    if (classList.contains('handle')) {
      // Change crop area
      this.addEventListener('mousemove', this.updateCropArea)
      if (classList.contains('nwse')) this.classList.add('nwse')
      if (classList.contains('nesw')) this.classList.add('nesw')
      this.startX =
        this.box.offsetLeft + (classList.contains('se') || classList.contains('ne') ? 0 : this.box.offsetWidth)
      this.startY =
        this.box.offsetTop + (classList.contains('se') || classList.contains('sw') ? 0 : this.box.offsetHeight)
      this.updateCropArea(event)
    } else {
      // Move crop area
      this.addEventListener('mousemove', this.moveCropArea)
    }
  }

  updateDimensions(deltaX, deltaY) {
    let newSide = Math.max(Math.abs(deltaX), Math.abs(deltaY), this.minWidth)
    newSide = Math.min(
      newSide,
      deltaY > 0 ? this.image.height - this.startY : this.startY,
      deltaX > 0 ? this.image.width - this.startX : this.startX
    )

    const x = Math.round(Math.max(0, deltaX > 0 ? this.startX : this.startX - newSide))
    const y = Math.round(Math.max(0, deltaY > 0 ? this.startY : this.startY - newSide))

    this.box.style.left = `${x}px`
    this.box.style.top = `${y}px`
    this.box.style.width = `${newSide}px`
    this.box.style.height = `${newSide}px`
    this.fireChangeEvent({x, y, width: newSide, height: newSide})
  }

  moveCropArea(event) {
    if (this.dragStartX && this.dragStartY) {
      const x = Math.min(
        Math.max(0, this.box.offsetLeft + event.pageX - this.dragStartX),
        this.image.width - this.box.offsetWidth
      )
      const y = Math.min(
        Math.max(0, this.box.offsetTop + event.pageY - this.dragStartY),
        this.image.height - this.box.offsetHeight
      )
      this.box.style.left = `${x}px`
      this.box.style.top = `${y}px`

      this.fireChangeEvent({x, y, width: this.box.offsetWidth, height: this.box.offsetHeight})
    }

    this.dragStartX = event.pageX
    this.dragStartY = event.pageY
  }

  updateCropArea(event) {
    const rect = this.getBoundingClientRect()
    const deltaX = event.pageX - this.startX - rect.left - window.pageXOffset
    const deltaY = event.pageY - this.startY - rect.top - window.pageYOffset
    this.updateDimensions(deltaX, deltaY)
  }

  fireChangeEvent(result) {
    const ratio = this.image.naturalWidth / this.image.width
    for (const key in result) {
      const value = Math.round(result[key] * ratio)
      result[key] = value
      const slottedInput = this.querySelector(`.ic-${key}-input`)
      if (slottedInput) slottedInput.value = value
    }

    this.dispatchEvent(new CustomEvent('image-crop-change', {bubbles: true, detail: result}))
  }
}

if (!window.customElements.get('image-crop')) {
  window.customElements.define('image-crop', ImageCropElement)
}

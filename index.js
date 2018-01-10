const tmpl = document.createElement('template')
tmpl.innerHTML = `
  <div class="crop-wrapper">
    <img width="100%" class="crop-image" alt="">
    <div class="crop-container">
      <div data-crop-box class="crop-box">
        <div class="crop-outline"></div>
        <div data-direction="nw" class="handle nw"></div>
        <div data-direction="ne" class="handle ne"></div>
        <div data-direction="sw" class="handle sw"></div>
        <div data-direction="se" class="handle se"></div>
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
    this.box = this.querySelector('[data-crop-box]')

    this.image.addEventListener('load', this._imageReady.bind(this))
    this.addEventListener('mouseleave', this._stopUpdate)
    this.addEventListener('mouseup', this._stopUpdate)
    this.box.addEventListener('mousedown', this._startUpdate.bind(this))

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

  _imageReady(event) {
    this.loaded = true
    const image = event.target
    const side = Math.round(image.clientWidth > image.clientHeight ? image.clientHeight : image.clientWidth)
    this.startX = (image.clientWidth - side) / 2
    this.startY = (image.clientHeight - side) / 2
    this._updateDimensions(side, side)
  }

  _stopUpdate() {
    this.dragStartX = this.dragStartY = null
    this.classList.remove('nwse', 'nesw')
    this.removeEventListener('mousemove', this._updateCropArea)
    this.removeEventListener('mousemove', this._moveCropArea)
  }

  _startUpdate(event) {
    if (event.target.hasAttribute('data-direction')) {
      const direction = event.target.getAttribute('data-direction')
      // Change crop area
      this.addEventListener('mousemove', this._updateCropArea)
      if (['nw', 'se'].indexOf(direction) >= 0) this.classList.add('nwse')
      if (['ne', 'sw'].indexOf(direction) >= 0) this.classList.add('nesw')
      this.startX = this.box.offsetLeft + (['se', 'ne'].indexOf(direction) >= 0 ? 0 : this.box.offsetWidth)
      this.startY = this.box.offsetTop + (['se', 'sw'].indexOf(direction) >= 0 ? 0 : this.box.offsetHeight)
      this._updateCropArea(event)
    } else {
      // Move crop area
      this.addEventListener('mousemove', this._moveCropArea)
    }
  }

  _updateDimensions(deltaX, deltaY) {
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
    this._fireChangeEvent({x, y, width: newSide, height: newSide})
  }

  _moveCropArea(event) {
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

      this._fireChangeEvent({x, y, width: this.box.offsetWidth, height: this.box.offsetHeight})
    }

    this.dragStartX = event.pageX
    this.dragStartY = event.pageY
  }

  _updateCropArea(event) {
    const rect = this.getBoundingClientRect()
    const deltaX = event.pageX - this.startX - rect.left - window.pageXOffset
    const deltaY = event.pageY - this.startY - rect.top - window.pageYOffset
    this._updateDimensions(deltaX, deltaY)
  }

  _fireChangeEvent(result) {
    const ratio = this.image.naturalWidth / this.image.width
    for (const key in result) {
      const value = Math.round(result[key] * ratio)
      result[key] = value
      const slottedInput = this.querySelector(`[data-image-crop-input='${key}']`)
      if (slottedInput) slottedInput.value = value
    }

    this.dispatchEvent(new CustomEvent('image-crop-change', {bubbles: true, detail: result}))
  }
}

if (!window.customElements.get('image-crop')) {
  window.customElements.define('image-crop', ImageCropElement)
}

const tmpl = document.createElement('template')
tmpl.innerHTML = `
  <style>
    :host { display: block; }
    :host(.nesw), .nesw { cursor: nesw-resize; }
    :host(.nwse), .nwse { cursor: nwse-resize; }
    :host(.nesw) .crop-box,
    :host(.nwse) .crop-box {
      cursor: inherit;
    }
    :host([loaded]) .crop-image { display: block; }
    :host([loaded]) .loading-slot,
    .crop-image {
      display: none;
    }
    .crop-wrapper {
      position: relative;
      font-size: 0;
    }
    .crop-container {
      user-select: none;
      position: absolute;
      overflow: hidden;
      z-index: 1;
      top: 0;
      width: 100%;
      height: 100%;
    }
    .crop-box {
      position: absolute;
      border: 1px dashed #fff;
      box-shadow: 0 0 5000px 5000px rgba(0, 0, 0, .3);
      box-sizing: border-box;
      cursor: move;
    }
    .handle { position: absolute; }
    .handle:before {
      position: absolute;
      display: block;
      padding: 4px;
      transform: translate(-50%, -50%);
      content: ' ';
      background: #fff;
      border: 1px solid #767676;
    }
    .ne { top: 0; right: 0; }
    .nw { top: 0; left: 0; }
    .se { bottom: 0; right: 0; }
    .sw { bottom: 0; left: 0; }
  </style>
  <div class="loading-slot"><slot name="loading"></slot></div>
  <div class="crop-wrapper">
    <img width="100%" class="crop-image">
    <div class="crop-container">
      <div class="crop-box">
        <div class="handle nw nwse"></div>
        <div class="handle ne nesw"></div>
        <div class="handle sw nesw"></div>
        <div class="handle se nwse"></div>
      </div>
    </div>
  </div>
  <slot name="x-input"></slot>
  <slot name="y-input"></slot>
  <slot name="width-input"></slot>
  <slot name="height-input"></slot>
  <slot></slot>
`

if (window.ShadyCSS) window.ShadyCSS.prepareTemplate(tmpl, 'image-crop')

export class ImageCropElement extends HTMLElement {
  constructor() {
    super()
    this.startX = null
    this.startY = null
    this.minWidth = 10

    if (window.ShadyCSS) window.ShadyCSS.styleElement(this)
    this.attachShadow({mode: 'open'})
    this.shadowRoot.appendChild(document.importNode(tmpl.content, true))
  }

  connectedCallback() {
    this.image = this.shadowRoot.querySelector('img')
    this.box = this.shadowRoot.querySelector('.crop-box')

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
      const slottedInput = this.shadowRoot.querySelector(`[name='${key}-input']`).assignedNodes()
      if (slottedInput[0] && slottedInput[0].tagName === 'INPUT') slottedInput[0].value = value
    }

    this.dispatchEvent(new CustomEvent('image-crop-change', {bubbles: true, detail: result}))
  }
}

if (!window.customElements.get('image-crop')) {
  window.customElements.define('image-crop', ImageCropElement)
}

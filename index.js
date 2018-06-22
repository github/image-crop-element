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

function moveCropArea(event) {
  const el = event.currentTarget
  if (el.dragStartX && el.dragStartY) {
    const x = Math.min(
      Math.max(0, el.box.offsetLeft + event.pageX - el.dragStartX),
      el.image.width - el.box.offsetWidth
    )
    const y = Math.min(
      Math.max(0, el.box.offsetTop + event.pageY - el.dragStartY),
      el.image.height - el.box.offsetHeight
    )
    el.box.style.left = `${x}px`
    el.box.style.top = `${y}px`

    fireChangeEvent(el, {x, y, width: el.box.offsetWidth, height: el.box.offsetHeight})
  }

  el.dragStartX = event.pageX
  el.dragStartY = event.pageY
}

function updateCropArea(event) {
  const el = event.target.closest('image-crop')
  const rect = el.getBoundingClientRect()
  const deltaX = event.pageX - el.startX - rect.left - window.pageXOffset
  const deltaY = event.pageY - el.startY - rect.top - window.pageYOffset
  updateDimensions(el, deltaX, deltaY)
}

function startUpdate(event) {
  const el = event.currentTarget.closest('image-crop')
  if (event.target.hasAttribute('data-direction')) {
    const direction = event.target.getAttribute('data-direction')
    // Change crop area
    el.addEventListener('mousemove', updateCropArea)
    if (['nw', 'se'].indexOf(direction) >= 0) el.classList.add('nwse')
    if (['ne', 'sw'].indexOf(direction) >= 0) el.classList.add('nesw')
    el.startX = el.box.offsetLeft + (['se', 'ne'].indexOf(direction) >= 0 ? 0 : el.box.offsetWidth)
    el.startY = el.box.offsetTop + (['se', 'sw'].indexOf(direction) >= 0 ? 0 : el.box.offsetHeight)
    updateCropArea(event)
  } else {
    // Move crop area
    el.addEventListener('mousemove', moveCropArea)
  }
}

function updateDimensions(target, deltaX, deltaY) {
  let newSide = Math.max(Math.abs(deltaX), Math.abs(deltaY), target.minWidth)
  newSide = Math.min(
    newSide,
    deltaY > 0 ? target.image.height - target.startY : target.startY,
    deltaX > 0 ? target.image.width - target.startX : target.startX
  )

  const x = Math.round(Math.max(0, deltaX > 0 ? target.startX : target.startX - newSide))
  const y = Math.round(Math.max(0, deltaY > 0 ? target.startY : target.startY - newSide))

  target.box.style.left = `${x}px`
  target.box.style.top = `${y}px`
  target.box.style.width = `${newSide}px`
  target.box.style.height = `${newSide}px`
  fireChangeEvent(target, {x, y, width: newSide, height: newSide})
}

function imageReady(event) {
  const el = event.currentTarget.closest('image-crop')
  el.loaded = true
  const image = event.target
  const side = Math.round(image.clientWidth > image.clientHeight ? image.clientHeight : image.clientWidth)
  el.startX = (image.clientWidth - side) / 2
  el.startY = (image.clientHeight - side) / 2
  updateDimensions(el, side, side)
}

function stopUpdate(event) {
  const el = event.currentTarget
  el.dragStartX = el.dragStartY = null
  el.classList.remove('nwse', 'nesw')
  el.removeEventListener('mousemove', updateCropArea)
  el.removeEventListener('mousemove', moveCropArea)
}

function fireChangeEvent(target, result) {
  const ratio = target.image.naturalWidth / target.image.width
  for (const key in result) {
    const value = Math.round(result[key] * ratio)
    result[key] = value
    const slottedInput = target.querySelector(`[data-image-crop-input='${key}']`)
    if (slottedInput) slottedInput.value = value
  }

  target.dispatchEvent(new CustomEvent('image-crop-change', {bubbles: true, detail: result}))
}

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

    this.image.addEventListener('load', imageReady)
    this.addEventListener('mouseleave', stopUpdate)
    this.addEventListener('mouseup', stopUpdate)
    this.box.addEventListener('mousedown', startUpdate)

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
}

if (!window.customElements.get('image-crop')) {
  window.customElements.define('image-crop', ImageCropElement)
}

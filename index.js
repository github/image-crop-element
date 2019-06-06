/* @flow strict */

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

const startPositions: WeakMap<ImageCropElement, {startX: number, startY: number}> = new WeakMap()
const dragStartPositions: WeakMap<ImageCropElement, {dragStartX: number, dragStartY: number}> = new WeakMap()
const constructedElements: WeakMap<ImageCropElement, {image: HTMLImageElement, box: HTMLElement}> = new WeakMap()

function moveCropArea(event: MouseEvent | KeyboardEvent) {
  const el = event.currentTarget
  if (!(el instanceof ImageCropElement)) return
  const {box, image} = constructedElements.get(el) || {}

  let deltaX = 0
  let deltaY = 0
  if (event.type === 'keydown') {
    if (event.key === 'ArrowUp') {
      deltaY = -1
    } else if (event.key === 'ArrowDown') {
      deltaY = 1
    } else if (event.key === 'ArrowLeft') {
      deltaX = -1
    } else if (event.key === 'ArrowRight') {
      deltaX = 1
    }
  } else if (dragStartPositions.has(el) && event instanceof MouseEvent) {
    const pos = dragStartPositions.get(el)
    if (!pos) return
    deltaX = event.pageX - pos.dragStartX
    deltaY = event.pageY - pos.dragStartY
  }

  if (deltaX !== 0 || deltaY !== 0) {
    const x = Math.min(Math.max(0, box.offsetLeft + deltaX), image.width - box.offsetWidth)
    const y = Math.min(Math.max(0, box.offsetTop + deltaY), image.height - box.offsetHeight)
    box.style.left = `${x}px`
    box.style.top = `${y}px`

    fireChangeEvent(el, {x, y, width: box.offsetWidth, height: box.offsetHeight})
  }

  if (event instanceof MouseEvent) {
    dragStartPositions.set(el, {
      dragStartX: event.pageX,
      dragStartY: event.pageY
    })
  }
}

function updateCropArea(event: MouseEvent | KeyboardEvent) {
  const target = event.target
  if (!(target instanceof HTMLElement)) return

  const el = target.closest('image-crop')
  if (!(el instanceof ImageCropElement)) return
  const {box} = constructedElements.get(el) || {}

  const rect = el.getBoundingClientRect()
  let deltaX, deltaY, delta
  if (event.key) {
    if (event.key === 'Escape') return setInitialPosition(el)
    if (event.key === '-') delta = -10
    if (event.key === '=') delta = +10
    if (!delta) return
    deltaX = box.offsetWidth + delta
    deltaY = box.offsetHeight + delta
    startPositions.set(el, {startX: box.offsetLeft, startY: box.offsetTop})
  } else if (event instanceof MouseEvent) {
    const pos = startPositions.get(el)
    if (!pos) return
    deltaX = event.pageX - pos.startX - rect.left - window.pageXOffset
    deltaY = event.pageY - pos.startY - rect.top - window.pageYOffset
  }

  if (deltaX && deltaY) updateDimensions(el, deltaX, deltaY, !(event instanceof KeyboardEvent))
}

function startUpdate(event: MouseEvent) {
  const currentTarget = event.currentTarget
  if (!(currentTarget instanceof HTMLElement)) return

  const el = currentTarget.closest('image-crop')
  if (!(el instanceof ImageCropElement)) return
  const {box} = constructedElements.get(el) || {}

  const target = event.target
  if (!(target instanceof HTMLElement)) return

  if (target.hasAttribute('data-direction')) {
    const direction = target.getAttribute('data-direction')
    // Change crop area
    el.addEventListener('mousemove', updateCropArea)
    if (['nw', 'se'].indexOf(direction) >= 0) el.classList.add('nwse')
    if (['ne', 'sw'].indexOf(direction) >= 0) el.classList.add('nesw')
    startPositions.set(el, {
      startX: box.offsetLeft + (['se', 'ne'].indexOf(direction) >= 0 ? 0 : box.offsetWidth),
      startY: box.offsetTop + (['se', 'sw'].indexOf(direction) >= 0 ? 0 : box.offsetHeight)
    })
    updateCropArea(event)
  } else {
    // Move crop area
    el.addEventListener('mousemove', moveCropArea)
  }
}

function updateDimensions(target, deltaX, deltaY, reposition = true) {
  let newSide = Math.max(Math.abs(deltaX), Math.abs(deltaY), 10)
  const pos = startPositions.get(target)
  if (!pos) return
  const {box, image} = constructedElements.get(target) || {}
  newSide = Math.min(
    newSide,
    deltaY > 0 ? image.height - pos.startY : pos.startY,
    deltaX > 0 ? image.width - pos.startX : pos.startX
  )

  const x = reposition ? Math.round(Math.max(0, deltaX > 0 ? pos.startX : pos.startX - newSide)) : box.offsetLeft
  const y = reposition ? Math.round(Math.max(0, deltaY > 0 ? pos.startY : pos.startY - newSide)) : box.offsetTop

  box.style.left = `${x}px`
  box.style.top = `${y}px`

  box.style.width = `${newSide}px`
  box.style.height = `${newSide}px`
  fireChangeEvent(target, {x, y, width: newSide, height: newSide})
}

function imageReady(event: Event) {
  const currentTarget = event.currentTarget
  if (!(currentTarget instanceof HTMLElement)) return

  const el = currentTarget.closest('image-crop')
  if (!(el instanceof ImageCropElement)) return

  el.loaded = true
  setInitialPosition(el)
}

function setInitialPosition(el) {
  const {image} = constructedElements.get(el) || {}
  const side = Math.round(image.clientWidth > image.clientHeight ? image.clientHeight : image.clientWidth)
  startPositions.set(el, {
    startX: (image.clientWidth - side) / 2,
    startY: (image.clientHeight - side) / 2
  })
  updateDimensions(el, side, side)
}

function stopUpdate(event: MouseEvent) {
  const el = event.currentTarget
  if (!(el instanceof ImageCropElement)) return

  dragStartPositions.delete(el)
  el.classList.remove('nwse', 'nesw')
  el.removeEventListener('mousemove', updateCropArea)
  el.removeEventListener('mousemove', moveCropArea)
}

function fireChangeEvent(target: ImageCropElement, result: {x: number, y: number, width: number, height: number}) {
  const {image} = constructedElements.get(target) || {}
  const ratio = image.naturalWidth / image.width
  for (const key in result) {
    const value = Math.round(result[key] * ratio)
    result[key] = value
    const slottedInput = target.querySelector(`[data-image-crop-input='${key}']`)
    if (slottedInput instanceof HTMLInputElement) slottedInput.value = value.toString()
  }

  target.dispatchEvent(new CustomEvent('image-crop-change', {bubbles: true, detail: result}))
}

class ImageCropElement extends HTMLElement {
  connectedCallback() {
    if (constructedElements.has(this)) return
    this.appendChild(document.importNode(tmpl.content, true))
    const box = this.querySelector('[data-crop-box]')
    if (!(box instanceof HTMLElement)) return
    const image = this.querySelector('img')
    if (!(image instanceof HTMLImageElement)) return
    constructedElements.set(this, {box, image})

    image.addEventListener('load', imageReady)
    this.addEventListener('mouseleave', stopUpdate)
    this.addEventListener('mouseup', stopUpdate)
    box.addEventListener('mousedown', startUpdate)
    this.addEventListener('keydown', moveCropArea)
    this.addEventListener('keydown', updateCropArea)

    if (this.src) image.src = this.src
  }

  static get observedAttributes() {
    return ['src']
  }

  get src(): ?string {
    return this.getAttribute('src')
  }

  set src(val: ?string) {
    if (val) {
      this.setAttribute('src', val)
    } else {
      this.removeAttribute('src')
    }
  }

  get loaded(): boolean {
    return this.hasAttribute('loaded')
  }

  set loaded(val: boolean) {
    if (val) {
      this.setAttribute('loaded', '')
    } else {
      this.removeAttribute('loaded')
    }
  }

  attributeChangedCallback(attribute: string, oldValue: string, newValue: string) {
    const {image} = constructedElements.get(this) || {}
    if (attribute === 'src') {
      this.loaded = false
      if (image) image.src = newValue
    }
  }
}

export default ImageCropElement

if (!window.customElements.get('image-crop')) {
  window.ImageCropElement = ImageCropElement
  window.customElements.define('image-crop', ImageCropElement)
}

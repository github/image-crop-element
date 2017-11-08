const ImageCropPrototype = Object.create(HTMLElement.prototype)

ImageCropPrototype.attachedCallback = function() {
  let startX, startY, rect
  const minWidth = 10
  const host = this
  const shadowRoot = host.attachShadow({mode: 'open'})
  shadowRoot.innerHTML = `
    <style>
      :host { display: block; }
      .crop-wrapper { position: relative; }
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
        box-shadow: 0 0 10000px 10000px rgba(0, 0, 0, .3);
        box-sizing: border-box;
      }
    </style>
    <div class="crop-wrapper">
      <img src="${host.getAttribute('src')}" width="100%">
      <div class="crop-container"><div class="crop-box"></div></div>
    </div>
    <slot></slot>
  `
  const image = shadowRoot.querySelector('img')
  const box = shadowRoot.querySelector('.crop-box')

  image.onload = function() {
    rect = host.getBoundingClientRect()
    const side = Math.round((image.width > image.height ? image.height : image.width) * 0.9)
    startX = (image.width - side) / 2
    startY = (image.height - side) / 2
    updateDimensions(side, side)
  }

  host.addEventListener('mouseleave', stopUpdate)
  host.addEventListener('mouseup', stopUpdate)
  // This is on shadow root so we can tell apart the event target
  shadowRoot.addEventListener('mousedown', startUpdate)

  function stopUpdate() {
    host.removeEventListener('mousemove', updateCropArea)
    box.removeEventListener('mousemove', moveCropArea)
  }

  function startUpdate(event) {
    if (event.target === box) {
      // Move crop area
      box.addEventListener('mousemove', moveCropArea)
    } else {
      // Change crop area
      host.addEventListener('mousemove', updateCropArea)

      startX = event.pageX - rect.x
      startY = event.pageY - rect.y
      box.style.left = `${startX}px`
      box.style.top = `${startY}px`
      box.style.width = `${minWidth}px`
      box.style.height = `${minWidth}px`
    }
  }

  function updateDimensions(deltaX, deltaY) {
    let newSide = Math.max(Math.abs(deltaX), Math.abs(deltaY), minWidth)
    newSide = Math.min(newSide, deltaY > 0 ? image.height - startY : startY, deltaX > 0 ? image.width - startX : startX)

    const x = Math.max(0, deltaX > 0 ? startX : startX - newSide)
    const y = Math.max(0, deltaY > 0 ? startY : startY - newSide)

    box.style.left = `${x}px`
    box.style.top = `${y}px`
    box.style.width = `${newSide}px`
    box.style.height = `${newSide}px`
    fireChangeEvent({x, y, width: newSide, height: newSide})
  }

  function moveCropArea(event) {
    const x = Math.min(Math.max(0, box.offsetLeft + event.movementX), image.width - box.offsetWidth)
    const y = Math.min(Math.max(0, box.offsetTop + event.movementY), image.height - box.offsetHeight)
    box.style.left = `${x}px`
    box.style.top = `${y}px`

    fireChangeEvent({x, y, width: box.offsetWidth, height: box.offsetHeight})
  }

  function updateCropArea(event) {
    const deltaX = event.pageX - startX - rect.x
    const deltaY = event.pageY - startY - rect.y
    updateDimensions(deltaX, deltaY)
  }

  function fireChangeEvent(result) {
    const ratio = image.naturalWidth / image.width
    for (const key in result) {
      result[key] = Math.round(result[key] * ratio)
    }

    host.dispatchEvent(new CustomEvent('crop:change', {bubbles: true, detail: result}))
  }
}

window.ImageCropElement = document.registerElement('image-crop', {
  prototype: ImageCropPrototype
})

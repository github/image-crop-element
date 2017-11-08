const ImageCropPrototype = Object.create(HTMLElement.prototype)

ImageCropPrototype.attachedCallback = function() {
  let startX, startY
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

      startX = event.pageX - host.offsetLeft
      startY = event.pageY - host.offsetTop
      box.style.left = startX
      box.style.top = startY
      box.style.width = minWidth
      box.style.height = minWidth
    }
  }

  function updateDimensions(deltaX, deltaY) {
    let newSide = Math.max(Math.abs(deltaX), Math.abs(deltaY), minWidth)
    newSide = Math.min(newSide, deltaY > 0 ? image.height - startY : startY, deltaX > 0 ? image.width - startX : startX)

    const x = Math.max(0, deltaX > 0 ? startX : startX - newSide)
    const y = Math.max(0, deltaY > 0 ? startY : startY - newSide)

    box.style.left = x
    box.style.top = y
    box.style.width = newSide
    box.style.height = newSide
    host.dispatchEvent(new CustomEvent('crop:change', {bubbles: true, detail: {x, y, width: newSide, height: newSide}}))
  }

  function moveCropArea(event) {
    const x = Math.min(Math.max(0, box.offsetLeft + event.movementX), image.width - box.offsetWidth)
    const y = Math.min(Math.max(0, box.offsetTop + event.movementY), image.height - box.offsetHeight)
    box.style.left = x
    box.style.top = y

    host.dispatchEvent(
      new CustomEvent('crop:change', {bubbles: true, detail: {x, y, width: box.offsetWidth, height: box.offsetHeight}})
    )
  }

  function updateCropArea(event) {
    const deltaX = event.pageX - startX - host.offsetLeft
    const deltaY = event.pageY - startY - host.offsetTop
    updateDimensions(deltaX, deltaY)
  }
}

window.ImageCropElement = document.registerElement('image-crop', {
  prototype: ImageCropPrototype
})

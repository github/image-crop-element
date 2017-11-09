const ImageCropPrototype = Object.create(HTMLElement.prototype)

ImageCropPrototype.attachedCallback = function() {
  let startX, startY
  const minWidth = 10
  const host = this
  const shadowRoot = host.attachShadow({mode: 'open'})
  shadowRoot.innerHTML = `
    <style>
      :host { display: block; }
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
        box-shadow: 0 0 10000px 10000px rgba(0, 0, 0, .3);
        box-sizing: border-box;
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
      .top-right { top: 0; right: 0; }
      .top-left { top: 0; left: 0; }
      .bottom-right { bottom: 0; right: 0; }
      .bottom-left { bottom: 0; left: 0; }
    </style>
    <div class="crop-wrapper">
      <img src="${host.getAttribute('src')}" width="100%">
      <div class="crop-container">
        <div class="crop-box">
          <div class="handle top-left"></div>
          <div class="handle top-right"></div>
          <div class="handle bottom-left"></div>
          <div class="handle bottom-right"></div>
        </div>
      </div>
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

    host.dispatchEvent(new CustomEvent('crop:init', {bubbles: true}))
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

      if (event.target.classList.contains('handle')) {
        startX = box.offsetLeft + (event.target.className.match(/-right/) ? 0 : box.offsetWidth)
        startY = box.offsetTop + (event.target.className.match(/bottom-/) ? 0 : box.offsetHeight)
        updateCropArea(event)
      } else {
        const rect = host.getBoundingClientRect()
        startX = event.pageX - rect.x - window.scrollX
        startY = event.pageY - rect.y - window.scrollY
        box.style.left = `${startX}px`
        box.style.top = `${startY}px`
        box.style.width = `${minWidth}px`
        box.style.height = `${minWidth}px`
      }
    }
  }

  function updateDimensions(deltaX, deltaY) {
    let newSide = Math.max(Math.abs(deltaX), Math.abs(deltaY), minWidth)
    newSide = Math.min(newSide, deltaY > 0 ? image.height - startY : startY, deltaX > 0 ? image.width - startX : startX)

    const x = Math.round(Math.max(0, deltaX > 0 ? startX : startX - newSide))
    const y = Math.round(Math.max(0, deltaY > 0 ? startY : startY - newSide))

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
    const rect = host.getBoundingClientRect()
    const deltaX = event.pageX - startX - rect.x - window.scrollX
    const deltaY = event.pageY - startY - rect.y - window.scrollY
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

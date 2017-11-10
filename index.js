const ImageCropPrototype = Object.create(HTMLElement.prototype)

ImageCropPrototype.attachedCallback = function() {
  let startX, startY
  const minWidth = 10
  const host = this
  const shadowRoot = host.attachShadow({mode: 'open'})
  shadowRoot.innerHTML = `
    <style>
      :host { display: block; }
      :host(.nesw), .nesw { cursor: nesw-resize; }
      :host(.nwse), .nwse { cursor: nwse-resize; }
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
    <div class="crop-wrapper">
      <img src="${host.getAttribute('src')}" width="100%">
      <div class="crop-container">
        <div class="crop-box">
          <div class="handle nw nwse"></div>
          <div class="handle ne nesw"></div>
          <div class="handle sw nesw"></div>
          <div class="handle se nwse"></div>
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
    host.classList.remove('nwse', 'nesw')
    host.removeEventListener('mousemove', updateCropArea)
    host.removeEventListener('mousemove', moveCropArea)
  }

  function startUpdate(event) {
    if (event.target === box) {
      // Move crop area
      host.addEventListener('mousemove', moveCropArea)
    } else {
      // Change crop area
      const classList = event.target.classList
      host.addEventListener('mousemove', updateCropArea)

      if (classList.contains('handle')) {
        if (classList.contains('nwse')) host.classList.add('nwse')
        if (classList.contains('nesw')) host.classList.add('nesw')
        startX = box.offsetLeft + (classList.contains('se') || classList.contains('ne') ? 0 : box.offsetWidth)
        startY = box.offsetTop + (classList.contains('se') || classList.contains('sw') ? 0 : box.offsetHeight)
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

function crop(selector, onUpdate) {
  let startX, startY

  const minWidth = 10
  const image = document.querySelector(selector)
  const container = document.createElement('div')
  container.classList.add('crop-container')
  container.style.top = image.offsetTop
  container.style.left = image.offsetLeft
  container.style.width = image.width
  container.style.height = image.height

  const box = document.createElement('div')
  box.classList.add('crop-box')

  const side = Math.round((image.width > image.height ? image.height : image.width) * 0.9)
  startX = (image.width - side)/2
  startY = (image.height - side)/2
  updateDimensions(side, side)

  container.append(box)
  image.insertAdjacentElement('beforebegin', container)

  container.addEventListener('mouseup', stopUpdate)
  container.addEventListener('mouseleave', stopUpdate)
  container.addEventListener('mousedown', startUpdate)

  function stopUpdate() {
    container.removeEventListener('mousemove', updateCropArea)
    box.removeEventListener('mousemove', moveCropArea)
  }

  function startUpdate(event) {
    if (event.target === box) {
      // Move crop area
      box.addEventListener('mousemove', moveCropArea)
    } else {
      // Change crop area
      container.addEventListener('mousemove', updateCropArea)

      startX = event.pageX - image.offsetLeft
      startY = event.pageY - image.offsetTop
      box.style.left = startX
      box.style.top = startY
      box.style.width = minWidth
      box.style.height = minWidth
    }
  }

  function updateDimensions(deltaX, deltaY) {
    let newSide = Math.max(Math.abs(deltaX), Math.abs(deltaY), minWidth)
    newSide = Math.min(
      newSide,
      (deltaY > 0 ? image.height - startY : startY),
      (deltaX > 0 ? image.width - startX : startX),
    )

    const x = Math.max(0, deltaX > 0 ? startX : startX - newSide)
    const y = Math.max(0, deltaY > 0 ? startY : startY - newSide)

    box.style.left = x
    box.style.top = y
    box.style.width = newSide
    box.style.height = newSide

    onUpdate({x: x, y: y, width: newSide, height: newSide})
  }

  function moveCropArea(event) {
    const x = Math.min(Math.max(0, box.offsetLeft + event.movementX), image.width - box.offsetWidth)
    const y = Math.min(Math.max(0, box.offsetTop + event.movementY), image.height - box.offsetHeight)
    box.style.left = x
    box.style.top = y

    onUpdate({x: x, y: y, width: box.offsetWidth, height: box.offsetHeight})
  }

  function updateCropArea(event) {
    const deltaX = event.pageX - startX - image.offsetLeft
    const deltaY = event.pageY - startY - image.offsetTop
    updateDimensions(deltaX, deltaY)
  }
}

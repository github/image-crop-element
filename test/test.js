describe('image-crop', function () {
  describe('element creation', function () {
    it('creates from document.createElement', function () {
      const el = document.createElement('image-crop')
      assert.equal('IMAGE-CROP', el.nodeName)
      assert(el instanceof window.ImageCropElement)
    })

    it('creates from constructor', function () {
      const el = new window.ImageCropElement()
      assert.equal('IMAGE-CROP', el.nodeName)
    })
  })

  describe('after tree insertion', function () {
    beforeEach(function () {
      document.body.innerHTML = `
        <image-crop>
          <div data-loading-slot>loading</div>
          <input type="text" data-image-crop-input="x" name="x" aria-label="x">
          <input type="text" data-image-crop-input="y" name="y" aria-label="y">
          <input type="text" data-image-crop-input="width" name="width" aria-label="width">
          <input type="text" data-image-crop-input="height" name="height" aria-label="height">
        </image-crop>
      `
    })

    afterEach(function () {
      document.body.innerHTML = ''
    })

    it('fires a change event and updates input', async function () {
      const ce = document.querySelector('image-crop')
      const listener = new Promise(resolve => ce.addEventListener('image-crop-change', resolve))
      ce.src =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHsAAAB7CAQAAAD+zjf0AAAAj0lEQVR42u3PAQEAAAgCoPw/2n4UPCDtPBRtbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1t7VMWcef1hgnq6VcAAAAASUVORK5CYII='
      await listener
      assert(ce.hasAttribute('loaded'), 'has loaded attribute')
      assert.equal(document.querySelector('[name=x]').value, '0')
      assert.equal(document.querySelector('[name=y]').value, '0')
      assert.equal(document.querySelector('[name=width]').value, '123')
      assert.equal(document.querySelector('[name=height]').value, '123')
    })
  })
})

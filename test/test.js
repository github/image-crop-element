describe('image-crop', function() {
  describe('element creation', function() {
    it('creates from document.createElement', function() {
      const el = document.createElement('image-crop')
      assert.equal('IMAGE-CROP', el.nodeName)
      assert(el instanceof window.ImageCropElement)
    })

    it('creates from constructor', function() {
      const el = new window.ImageCropElement()
      assert.equal('IMAGE-CROP', el.nodeName)
    })
  })

  describe('after tree insertion', function() {
    beforeEach(function() {
      document.body.innerHTML = `
        <image-crop src="http://github.com/github.png?size=123">
          <div data-loading-slot>loading</div>
        </image-crop>
      `
    })

    afterEach(function() {
      document.body.innerHTML = ''
    })

    it('fires a change event and updates input', function(done) {
      const values = {x: 0, y: 0, width: 123, height: 123}
      const ce = document.querySelector('image-crop')
      ce.addEventListener('image-crop-change', function(event) {
        assert(ce.hasAttribute('loaded'), 'has loaded attribute')
        assert.deepEqual(event.detail, values)
        done()
      })
    })
  })
})

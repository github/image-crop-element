import {assert} from '@open-wc/testing'
import {ImageCropElement} from '../src/index.ts'

describe('image-crop', function () {
  describe('element creation', function () {
    it('creates from document.createElement', function () {
      const el = document.createElement('image-crop')
      assert.equal('IMAGE-CROP', el.nodeName)
      assert(el instanceof ImageCropElement)
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

    for (const gesture of ['drag', 'resize']) {
      for (const ending of ['touchcancel', 'touchend']) {
        it(`stops ${gesture} after ${ending}`, async function () {
          const ce = document.querySelector('image-crop')
          const image = ce.shadowRoot.querySelector('img')
          const loaded = new Promise(resolve => image.addEventListener('load', resolve, {once: true}))
          ce.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="123" height="123"/>'
          await loaded

          const box = ce.shadowRoot.querySelector('[data-crop-box]')
          box.style.cssText = 'left: 10px; top: 10px; width: 60px; height: 60px'
          const target = gesture === 'resize' ? box.querySelector('[data-direction="se"]') : box
          const touch = (type, position) => {
            const point = new Touch({
              identifier: 1,
              target,
              clientX: position,
              clientY: position,
              pageX: position,
              pageY: position,
            })
            target.dispatchEvent(new TouchEvent(type, {bubbles: true, composed: true, changedTouches: [point]}))
          }
          let changes = 0
          ce.addEventListener('image-crop-change', () => changes++)
          touch('touchstart', 50)
          touch('touchmove', 55)
          touch('touchmove', 60)
          assert.isAbove(changes, 0)

          const previous = box.style.cssText
          const previousChanges = changes
          touch(ending, 60)
          touch('touchmove', 80)
          assert.equal(box.style.cssText, previous)
          assert.equal(changes, previousChanges)
        })
      }
    }

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

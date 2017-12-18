# &lt;image-crop-element&gt;

This loads an image and creates a crop area that user can modify. An event is fired with x, y, width, and height as the crop area changes.

Polyfills for [Custom Elements](https://github.com/webcomponents/webcomponentsjs), and `Reflect.construct` are required. See `polyfill.html`.

## Usage

### Plain

```html
<image-crop src="/avatar.jpg"></image-crop>
```

### With loading state

```html
<image-crop src="/avatar.jpg">
  <img class="ic-loading-slot" src="spinner.gif" alt="" />
</image-crop>
```

### With autoupdate inputs

```html
<image-crop src="/avatar.jpg">
  <input type="hidden" class="ic-x-input" name="x">
  <input type="hidden" class="ic-y-input" name="y">
  <input type="hidden" class="ic-width-input" name="width">
  <input type="hidden" class="ic-height-input" name="height">
</image-crop>
```

### Listen to the change event

```javascript
document.addEventListener('image-crop-change', function (event){
  console.log(
    'Crop area changed.',
    event.detail.x,
    event.detail.y,
    event.detail.width,
    event.detail.height
  )
})
```

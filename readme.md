# &lt;image-crop-element&gt;

This loads an image and creates a crop area that user can modify. An event is fired with x, y, width, and height as the crop area changes.

Polyfills for [Custom Elements](https://github.com/webcomponents/webcomponentsjs), and `Reflect.construct` are required. See `polyfill.html`.

## Installation

```
$ npm install --save @github/image-crop-element
```

## Usage

### Plain

```html
<image-crop src="/avatar.jpg"></image-crop>
```

### With loading state

```html
<image-crop src="/avatar.jpg">
  <img src="spinner.gif" alt="" data-loading-slot>
</image-crop>
```

### With autoupdate inputs

```html
<image-crop src="/avatar.jpg">
  <input type="hidden" data-image-crop-input="x" name="x">
  <input type="hidden" data-image-crop-input="y" name="y">
  <input type="hidden" data-image-crop-input="width" name="width">
  <input type="hidden" data-image-crop-input="height" name="height">
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

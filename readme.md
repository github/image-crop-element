# &lt;image-crop-element&gt;

This loads an image and creates a crop area user can change. Upon changing, an event is fired with x, y, width, and height.

This is a [Custom Element](https://developers.google.com/web/fundamentals/web-components/customelements) with [Shadow DOM](https://developers.google.com/web/fundamentals/web-components/shadowdom). You'll need to use [a polyfill](https://www.webcomponents.org/polyfills) to use this today.

## Usage

### Plain

```html
<image-crop src="/avatar.jpg"></image-crop>
```

### With loading state

```html
<image-crop src="/avatar.jpg">
  <img slot="loading" src="spinner.gif" alt="" />
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

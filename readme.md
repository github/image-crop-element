# &lt;image-crop&gt;

```html
  <image-crop src="image url"></image-crop>
```

```javascript
document.addEventListener('crop:init', function (event){
  console.log('Initialized.')
})

document.addEventListener('crop:change', function (event){
  console.log(
    'Crop area changed.',
    event.detail.x,
    event.detail.y,
    event.detail.width,
    event.detail.height
  )
})
```

# &lt;image-crop-element&gt;

```html
<image-crop src="/avatar.jpg"></image-crop>
```

```javascript
document.addEventListener('image-crop-init', function (event){
  console.log('Initialized.')
})

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

# &lt;image-crop-element&gt;

## Plain

```html
<image-crop src="/avatar.jpg"></image-crop>
```

## With loading state

```html
<image-crop src="/avatar.jpg">
  <img slot="loading" src="spinner.gif" alt="" />
</image-crop>
```

## Change event

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

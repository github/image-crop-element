(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof exports !== "undefined") {
    factory();
  } else {
    var mod = {
      exports: {}
    };
    factory();
    global.index = mod.exports;
  }
})(this, function () {
  'use strict';

  var ImageCropPrototype = Object.create(HTMLElement.prototype);

  ImageCropPrototype.attachedCallback = function () {
    var startX = void 0,
        startY = void 0;
    var minWidth = 10;
    var host = this;
    var shadowRoot = host.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = '\n    <style>\n      :host { display: block; }\n      .crop-wrapper {\n        position: relative;\n        font-size: 0;\n      }\n      .crop-container {\n        user-select: none;\n        position: absolute;\n        overflow: hidden;\n        z-index: 1;\n        top: 0;\n        width: 100%;\n        height: 100%;\n      }\n      .crop-box {\n        position: absolute;\n        border: 1px dashed #fff;\n        box-shadow: 0 0 10000px 10000px rgba(0, 0, 0, .3);\n        box-sizing: border-box;\n      }\n      .handle { position: absolute; }\n      .handle:before {\n        position: absolute;\n        display: block;\n        padding: 4px;\n        transform: translate(-50%, -50%);\n        content: \' \';\n        background: #fff;\n        border: 1px solid #767676;\n      }\n      .top-right { top: 0; right: 0; }\n      .top-left { top: 0; left: 0; }\n      .bottom-right { bottom: 0; right: 0; }\n      .bottom-left { bottom: 0; left: 0; }\n    </style>\n    <div class="crop-wrapper">\n      <img src="' + host.getAttribute('src') + '" width="100%">\n      <div class="crop-container">\n        <div class="crop-box">\n          <div class="handle top-left"></div>\n          <div class="handle top-right"></div>\n          <div class="handle bottom-left"></div>\n          <div class="handle bottom-right"></div>\n        </div>\n      </div>\n    </div>\n    <slot></slot>\n  ';
    var image = shadowRoot.querySelector('img');
    var box = shadowRoot.querySelector('.crop-box');

    image.onload = function () {
      var side = Math.round((image.width > image.height ? image.height : image.width) * 0.9);
      startX = (image.width - side) / 2;
      startY = (image.height - side) / 2;
      updateDimensions(side, side);

      host.dispatchEvent(new CustomEvent('crop:init', { bubbles: true }));
    };

    host.addEventListener('mouseleave', stopUpdate);
    host.addEventListener('mouseup', stopUpdate);
    // This is on shadow root so we can tell apart the event target
    shadowRoot.addEventListener('mousedown', startUpdate);

    function stopUpdate() {
      host.removeEventListener('mousemove', updateCropArea);
      box.removeEventListener('mousemove', moveCropArea);
    }

    function startUpdate(event) {
      if (event.target === box) {
        // Move crop area
        box.addEventListener('mousemove', moveCropArea);
      } else {
        // Change crop area
        var rect = host.getBoundingClientRect();
        var isDragHandle = event.target.classList.contains('handle');
        startX = event.pageX - rect.x - window.scrollX;
        startY = event.pageY - rect.y - window.scrollY;

        if (isDragHandle) {
          startX = startX + (event.target.className.match(/-right/) ? 0 - box.offsetWidth : box.offsetWidth);
          startY = startY + (event.target.className.match(/bottom-/) ? 0 - box.offsetHeight : box.offsetHeight);
        }

        box.style.left = startX + 'px';
        box.style.top = startY + 'px';
        box.style.width = (isDragHandle ? box.offsetWidth : minWidth) + 'px';
        box.style.height = (isDragHandle ? box.offsetWidth : minWidth) + 'px';

        host.addEventListener('mousemove', updateCropArea);
      }
    }

    function updateDimensions(deltaX, deltaY) {
      var newSide = Math.max(Math.abs(deltaX), Math.abs(deltaY), minWidth);
      newSide = Math.min(newSide, deltaY > 0 ? image.height - startY : startY, deltaX > 0 ? image.width - startX : startX);

      var x = Math.max(0, deltaX > 0 ? startX : startX - newSide);
      var y = Math.max(0, deltaY > 0 ? startY : startY - newSide);

      box.style.left = x + 'px';
      box.style.top = y + 'px';
      box.style.width = newSide + 'px';
      box.style.height = newSide + 'px';
      fireChangeEvent({ x: x, y: y, width: newSide, height: newSide });
    }

    function moveCropArea(event) {
      var x = Math.min(Math.max(0, box.offsetLeft + event.movementX), image.width - box.offsetWidth);
      var y = Math.min(Math.max(0, box.offsetTop + event.movementY), image.height - box.offsetHeight);
      box.style.left = x + 'px';
      box.style.top = y + 'px';

      fireChangeEvent({ x: x, y: y, width: box.offsetWidth, height: box.offsetHeight });
    }

    function updateCropArea(event) {
      var rect = host.getBoundingClientRect();
      var deltaX = event.pageX - startX - rect.x - window.scrollX;
      var deltaY = event.pageY - startY - rect.y - window.scrollY;
      updateDimensions(deltaX, deltaY);
    }

    function fireChangeEvent(result) {
      var ratio = image.naturalWidth / image.width;
      for (var key in result) {
        result[key] = Math.round(result[key] * ratio);
      }

      host.dispatchEvent(new CustomEvent('crop:change', { bubbles: true, detail: result }));
    }
  };

  window.ImageCropElement = document.registerElement('image-crop', {
    prototype: ImageCropPrototype
  });
});

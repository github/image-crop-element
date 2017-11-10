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
    shadowRoot.innerHTML = '\n    <style>\n      :host { display: block; }\n      :host(.nesw), .nesw { cursor: nesw-resize; }\n      :host(.nwse), .nwse { cursor: nwse-resize; }\n      .crop-wrapper {\n        position: relative;\n        font-size: 0;\n      }\n      .crop-container {\n        user-select: none;\n        position: absolute;\n        overflow: hidden;\n        z-index: 1;\n        top: 0;\n        width: 100%;\n        height: 100%;\n      }\n      .crop-box {\n        position: absolute;\n        border: 1px dashed #fff;\n        box-shadow: 0 0 10000px 10000px rgba(0, 0, 0, .3);\n        box-sizing: border-box;\n        cursor: move;\n      }\n      .handle { position: absolute; }\n      .handle:before {\n        position: absolute;\n        display: block;\n        padding: 4px;\n        transform: translate(-50%, -50%);\n        content: \' \';\n        background: #fff;\n        border: 1px solid #767676;\n      }\n      .ne { top: 0; right: 0; }\n      .nw { top: 0; left: 0; }\n      .se { bottom: 0; right: 0; }\n      .sw { bottom: 0; left: 0; }\n    </style>\n    <div class="crop-wrapper">\n      <img src="' + host.getAttribute('src') + '" width="100%">\n      <div class="crop-container">\n        <div class="crop-box">\n          <div class="handle nw nwse"></div>\n          <div class="handle ne nesw"></div>\n          <div class="handle sw nesw"></div>\n          <div class="handle se nwse"></div>\n        </div>\n      </div>\n    </div>\n    <slot></slot>\n  ';
    var image = shadowRoot.querySelector('img');
    var box = shadowRoot.querySelector('.crop-box');

    image.onload = function () {
      var side = Math.round(image.width > image.height ? image.height : image.width);
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
      host.classList.remove('nwse', 'nesw');
      host.removeEventListener('mousemove', updateCropArea);
      host.removeEventListener('mousemove', moveCropArea);
    }

    function startUpdate(event) {
      if (event.target === box) {
        // Move crop area
        host.addEventListener('mousemove', moveCropArea);
      } else {
        // Change crop area
        var classList = event.target.classList;
        host.addEventListener('mousemove', updateCropArea);

        if (classList.contains('handle')) {
          if (classList.contains('nwse')) host.classList.add('nwse');
          if (classList.contains('nesw')) host.classList.add('nesw');
          startX = box.offsetLeft + (classList.contains('se') || classList.contains('ne') ? 0 : box.offsetWidth);
          startY = box.offsetTop + (classList.contains('se') || classList.contains('sw') ? 0 : box.offsetHeight);
          updateCropArea(event);
        } else {
          var rect = host.getBoundingClientRect();
          startX = event.pageX - rect.x - window.scrollX;
          startY = event.pageY - rect.y - window.scrollY;
        }
      }
    }

    function updateDimensions(deltaX, deltaY) {
      var newSide = Math.max(Math.abs(deltaX), Math.abs(deltaY), minWidth);
      newSide = Math.min(newSide, deltaY > 0 ? image.height - startY : startY, deltaX > 0 ? image.width - startX : startX);

      var x = Math.round(Math.max(0, deltaX > 0 ? startX : startX - newSide));
      var y = Math.round(Math.max(0, deltaY > 0 ? startY : startY - newSide));

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

(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.index = mod.exports;
  }
})(this, function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  function _CustomElement() {
    return Reflect.construct(HTMLElement, [], this.__proto__.constructor);
  }

  ;
  Object.setPrototypeOf(_CustomElement.prototype, HTMLElement.prototype);
  Object.setPrototypeOf(_CustomElement, HTMLElement);

  var ImageCropElement = exports.ImageCropElement = function (_CustomElement2) {
    _inherits(ImageCropElement, _CustomElement2);

    function ImageCropElement() {
      _classCallCheck(this, ImageCropElement);

      var _this = _possibleConstructorReturn(this, (ImageCropElement.__proto__ || Object.getPrototypeOf(ImageCropElement)).call(this));

      _this.startX = null;
      _this.startY = null;
      _this.minWidth = 10;
      _this.attachShadow({ mode: 'open' });
      _this.shadowRoot.innerHTML = '\n      <style>\n        :host { display: block; }\n        :host(.nesw), .nesw { cursor: nesw-resize; }\n        :host(.nwse), .nwse { cursor: nwse-resize; }\n        :host(.nesw) .crop-box,\n        :host(.nwse) .crop-box {\n          cursor: inherit;\n        }\n        .crop-wrapper {\n          position: relative;\n          font-size: 0;\n        }\n        .crop-container {\n          user-select: none;\n          position: absolute;\n          overflow: hidden;\n          z-index: 1;\n          top: 0;\n          width: 100%;\n          height: 100%;\n        }\n        .crop-box {\n          position: absolute;\n          border: 1px dashed #fff;\n          box-shadow: 0 0 10000px 10000px rgba(0, 0, 0, .3);\n          box-sizing: border-box;\n          cursor: move;\n        }\n        .handle { position: absolute; }\n        .handle:before {\n          position: absolute;\n          display: block;\n          padding: 4px;\n          transform: translate(-50%, -50%);\n          content: \' \';\n          background: #fff;\n          border: 1px solid #767676;\n        }\n        .ne { top: 0; right: 0; }\n        .nw { top: 0; left: 0; }\n        .se { bottom: 0; right: 0; }\n        .sw { bottom: 0; left: 0; }\n      </style>\n      <div class="crop-wrapper">\n        <img width="100%">\n        <div class="crop-container">\n          <div class="crop-box">\n            <div class="handle nw nwse"></div>\n            <div class="handle ne nesw"></div>\n            <div class="handle sw nesw"></div>\n            <div class="handle se nwse"></div>\n          </div>\n        </div>\n      </div>\n      <slot></slot>\n    ';
      _this.image = _this.shadowRoot.querySelector('img');
      _this.box = _this.shadowRoot.querySelector('.crop-box');
      return _this;
    }

    _createClass(ImageCropElement, [{
      key: 'connectedCallback',
      value: function connectedCallback() {
        this.image.addEventListener('load', this.imageReady.bind(this));
        this.addEventListener('mouseleave', this.stopUpdate);
        this.addEventListener('mouseup', this.stopUpdate);
        this.box.addEventListener('mousedown', this.startUpdate.bind(this));

        if (this.src) this.image.src = this.src;
      }
    }, {
      key: 'attributeChangedCallback',
      value: function attributeChangedCallback(attribute, oldValue, newValue) {
        if (attribute === 'src') {
          this.image.src = newValue;
        }
      }
    }, {
      key: 'imageReady',
      value: function imageReady(event) {
        var image = event.target;
        var side = Math.round(image.width > image.height ? image.height : image.width);
        this.startX = (image.width - side) / 2;
        this.startY = (image.height - side) / 2;
        this.updateDimensions(side, side);
        this.dispatchEvent(new CustomEvent('crop:init', { bubbles: true }));
      }
    }, {
      key: 'stopUpdate',
      value: function stopUpdate() {
        this.classList.remove('nwse', 'nesw');
        this.removeEventListener('mousemove', this.updateCropArea);
        this.removeEventListener('mousemove', this.moveCropArea);
      }
    }, {
      key: 'startUpdate',
      value: function startUpdate(event) {
        var classList = event.target.classList;
        if (classList.contains('handle')) {
          // Change crop area
          this.addEventListener('mousemove', this.updateCropArea);
          if (classList.contains('nwse')) this.classList.add('nwse');
          if (classList.contains('nesw')) this.classList.add('nesw');
          this.startX = this.box.offsetLeft + (classList.contains('se') || classList.contains('ne') ? 0 : this.box.offsetWidth);
          this.startY = this.box.offsetTop + (classList.contains('se') || classList.contains('sw') ? 0 : this.box.offsetHeight);
          this.updateCropArea(event);
        } else {
          // Move crop area
          this.addEventListener('mousemove', this.moveCropArea);
        }
      }
    }, {
      key: 'updateDimensions',
      value: function updateDimensions(deltaX, deltaY) {
        var newSide = Math.max(Math.abs(deltaX), Math.abs(deltaY), this.minWidth);
        newSide = Math.min(newSide, deltaY > 0 ? this.image.height - this.startY : this.startY, deltaX > 0 ? this.image.width - this.startX : this.startX);

        var x = Math.round(Math.max(0, deltaX > 0 ? this.startX : this.startX - newSide));
        var y = Math.round(Math.max(0, deltaY > 0 ? this.startY : this.startY - newSide));

        this.box.style.left = x + 'px';
        this.box.style.top = y + 'px';
        this.box.style.width = newSide + 'px';
        this.box.style.height = newSide + 'px';
        this.fireChangeEvent({ x: x, y: y, width: newSide, height: newSide });
      }
    }, {
      key: 'moveCropArea',
      value: function moveCropArea(event) {
        var x = Math.min(Math.max(0, this.box.offsetLeft + event.movementX), this.image.width - this.box.offsetWidth);
        var y = Math.min(Math.max(0, this.box.offsetTop + event.movementY), this.image.height - this.box.offsetHeight);
        this.box.style.left = x + 'px';
        this.box.style.top = y + 'px';

        this.fireChangeEvent({ x: x, y: y, width: this.box.offsetWidth, height: this.box.offsetHeight });
      }
    }, {
      key: 'updateCropArea',
      value: function updateCropArea(event) {
        var rect = this.getBoundingClientRect();
        var deltaX = event.pageX - this.startX - rect.x - window.scrollX;
        var deltaY = event.pageY - this.startY - rect.y - window.scrollY;
        this.updateDimensions(deltaX, deltaY);
      }
    }, {
      key: 'fireChangeEvent',
      value: function fireChangeEvent(result) {
        var ratio = this.image.naturalWidth / this.image.width;
        for (var key in result) {
          result[key] = Math.round(result[key] * ratio);
        }

        this.dispatchEvent(new CustomEvent('crop:change', { bubbles: true, detail: result }));
      }
    }, {
      key: 'src',
      get: function get() {
        return this.getAttribute('src');
      },
      set: function set(val) {
        if (val) {
          this.setAttribute('src', val);
        } else {
          this.removeAttribute('src');
        }
      }
    }], [{
      key: 'observedAttributes',
      get: function get() {
        return ['src'];
      }
    }]);

    return ImageCropElement;
  }(_CustomElement);

  if (!window.customElements.get('image-crop')) {
    window.customElements.define('image-crop', ImageCropElement);
  }
});

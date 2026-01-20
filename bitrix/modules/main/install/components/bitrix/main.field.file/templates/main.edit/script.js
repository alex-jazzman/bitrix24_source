/* eslint-disable */
this.BX = this.BX || {};
this.BX.Main = this.BX.Main || {};
this.BX.Main.Field = this.BX.Main.Field || {};
(function (exports,ui_vue3,main_core,ui_uploader_core,ui_uploader_tileWidget) {
	'use strict';

	var Main = {
	  components: {
	    TileWidgetComponent: ui_uploader_tileWidget.TileWidgetComponent
	  },
	  data: function data() {
	    return {
	      deletedValues: [],
	      uploadedValues: [],
	      uploadInProgress: false
	    };
	  },
	  props: {
	    fieldName: {
	      type: String,
	      required: true
	    },
	    controlId: {
	      type: String,
	      required: true
	    },
	    context: {
	      type: Object,
	      required: true
	    },
	    values: {
	      type: Object
	    }
	  },
	  computed: {
	    sessionInputName: function sessionInputName() {
	      return "".concat(this.context.fieldName, "_session_id");
	    },
	    valueInputName: function valueInputName() {
	      return this.context.fieldName + (this.context.multiple ? '[]' : '');
	    },
	    deletedValueInputName: function deletedValueInputName() {
	      return "".concat(this.context.fieldName, "_del").concat(this.context.multiple ? '[]' : '');
	    },
	    sessionId: function sessionId() {
	      return this.context.sessionId;
	    },
	    currentValues: function currentValues() {
	      var values = [].concat(babelHelpers.toConsumableArray(this.values), babelHelpers.toConsumableArray(this.uploadedValues));
	      return this.context.multiple ? values : values.slice(-1);
	    },
	    uploaderOptions: function uploaderOptions() {
	      var _this = this,
	        _events;
	      return {
	        controller: 'main.fileUploader.fieldFileUploaderController',
	        controllerOptions: this.context.controllerOptions,
	        files: this.values,
	        events: (_events = {}, babelHelpers.defineProperty(_events, ui_uploader_core.UploaderEvent.FILE_UPLOAD_COMPLETE, function (event) {
	          var _event$getData, _event$getData$file, _event$getData$file$g;
	          var newFileId = (_event$getData = event.getData()) === null || _event$getData === void 0 ? void 0 : (_event$getData$file = _event$getData.file) === null || _event$getData$file === void 0 ? void 0 : (_event$getData$file$g = _event$getData$file.getCustomData()) === null || _event$getData$file$g === void 0 ? void 0 : _event$getData$file$g.realFileId;
	          if (newFileId) {
	            _this.uploadedValues.push(newFileId);
	          }
	          _this.emitChangeEvent();
	        }), babelHelpers.defineProperty(_events, ui_uploader_core.UploaderEvent.FILE_REMOVE, function (event) {
	          var _event$getData2, _event$getData2$file, _event$getData2$file$, _event$getData3, _event$getData3$file;
	          var justUploadedDeletedFileId = (_event$getData2 = event.getData()) === null || _event$getData2 === void 0 ? void 0 : (_event$getData2$file = _event$getData2.file) === null || _event$getData2$file === void 0 ? void 0 : (_event$getData2$file$ = _event$getData2$file.getCustomData()) === null || _event$getData2$file$ === void 0 ? void 0 : _event$getData2$file$.realFileId;
	          if (justUploadedDeletedFileId && _this.uploadedValues.includes(justUploadedDeletedFileId))
	            // just uploaded file was deleted
	            {
	              _this.uploadedValues = _this.uploadedValues.filter(function (id) {
	                return id !== justUploadedDeletedFileId;
	              });
	            }
	          var deletedFileId = (_event$getData3 = event.getData()) === null || _event$getData3 === void 0 ? void 0 : (_event$getData3$file = _event$getData3.file) === null || _event$getData3$file === void 0 ? void 0 : _event$getData3$file.getServerFileId();
	          if (deletedFileId && main_core.Type.isInteger(deletedFileId))
	            // existed file was deleted
	            {
	              _this.deletedValues.push(deletedFileId);
	            }
	          _this.emitChangeEvent();
	        }), babelHelpers.defineProperty(_events, ui_uploader_core.UploaderEvent.FILE_STATUS_CHANGE, function (event) {
	          var _event$getTarget;
	          var files = (_event$getTarget = event.getTarget()) === null || _event$getTarget === void 0 ? void 0 : _event$getTarget.getFiles();
	          if (!files) {
	            return;
	          }
	          var inProgress = files.some(function (file) {
	            var status = file.getStatus();
	            return status === ui_uploader_core.FileStatus.UPLOADING || status === ui_uploader_core.FileStatus.PREPARING || status === ui_uploader_core.FileStatus.PENDING || status === ui_uploader_core.FileStatus.UPLOADING;
	          });
	          if (_this.uploadInProgress !== inProgress) {
	            _this.uploadInProgress = inProgress;
	            if (inProgress) {
	              _this.emitUploadStartEvent();
	            } else {
	              _this.emitUploadCompleteEvent();
	            }
	          }
	        }), _events),
	        multiple: this.context.multiple,
	        autoUpload: true,
	        treatOversizeImageAsFile: true
	      };
	    },
	    widgetOptions: function widgetOptions() {
	      return {};
	    }
	  },
	  methods: {
	    emitChangeEvent: function emitChangeEvent() {
	      BX.onCustomEvent(window, 'onUIEntityEditorUserFieldExternalChanged', [this.fieldName]);
	      BX.onCustomEvent(window, 'onCrmEntityEditorUserFieldExternalChanged', [this.fieldName]);
	    },
	    emitUploadStartEvent: function emitUploadStartEvent() {
	      main_core.Event.EventEmitter.emit('BX.UI.EntityEditor:onUserFieldFileUploadStart', {
	        fieldName: this.fieldName
	      });
	    },
	    emitUploadCompleteEvent: function emitUploadCompleteEvent() {
	      main_core.Event.EventEmitter.emit('BX.UI.EntityEditor:onUserFieldFileUploadComplete', {
	        fieldName: this.fieldName
	      });
	    }
	  },
	  template: "\n\t\t<div class=\"main-field-file-wrapper\">\n\t\t\t<input type=\"hidden\" :name=\"sessionInputName\" :value=\"sessionId\" />\n\t\t\t<input v-if=\"currentValues.length\" v-for=\"(value, index) in currentValues\" :key=\"index\" type=\"hidden\" :name=\"valueInputName\" :value=\"value\"/>\n\t\t\t<input v-else type=\"hidden\" :name=\"valueInputName\" />\n\n\t\t\t<input v-for=\"(value, index) in deletedValues\" :key=\"index\" type=\"hidden\" :name=\"deletedValueInputName\" :value=\"value\"/>\n\n\t\t\t<TileWidgetComponent\n\t\t\t\tref=\"uploader\"\n\t\t\t\t:uploaderOptions=\"uploaderOptions\"\n\t\t\t\t:widgetOptions=\"widgetOptions\"\n\t\t\t/>\n\t\t</div>\n\t"
	};

	function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
	function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	var _app = /*#__PURE__*/new WeakMap();
	var App = function App(params) {
	  babelHelpers.classCallCheck(this, App);
	  _classPrivateFieldInitSpec(this, _app, {
	    writable: true,
	    value: null
	  });
	  var container = document.getElementById(params.containerId);
	  if (!main_core.Type.isDomNode(container)) {
	    throw new Error('container not found');
	  }
	  babelHelpers.classPrivateFieldSet(this, _app, ui_vue3.BitrixVue.createApp(_objectSpread({}, Main), {
	    fieldName: params.fieldName,
	    controlId: params.controlId,
	    context: params.context,
	    values: params.value.map(function (value) {
	      return parseInt(value, 10);
	    })
	  }));
	  babelHelpers.classPrivateFieldGet(this, _app).mount(container);
	};

	exports.App = App;

}((this.BX.Main.Field.File = this.BX.Main.Field.File || {}),BX.Vue3,BX,BX.UI.Uploader,BX.UI.Uploader));
//# sourceMappingURL=script.js.map

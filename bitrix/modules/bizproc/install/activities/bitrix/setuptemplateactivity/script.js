/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports,main_core,main_core_events,ui_system_menu_vue,ui_vue,ui_vue3) {
	'use strict';

	var ITEM_TYPES = Object.freeze({
	  DELIMITER: 'delimiter',
	  TITLE: 'title',
	  DESCRIPTION: 'description',
	  CONSTANT: 'constant'
	});
	var CONSTANT_TYPES = Object.freeze({
	  STRING: 'string',
	  INT: 'int',
	  USER: 'user',
	  FILE: 'file'
	});
	var DELIMITER_TYPES = Object.freeze({
	  LINE: 'line'
	});
	var CONSTANT_ID_PREFIX = 'SetupTemplateActivity_';

	function makeEmptyDelimiter() {
	  return {
	    itemType: ITEM_TYPES.DELIMITER,
	    delimiterType: DELIMITER_TYPES.LINE
	  };
	}
	function makeEmptyTitle() {
	  return {
	    itemType: ITEM_TYPES.TITLE,
	    text: ''
	  };
	}
	function makeEmptyDescription() {
	  return {
	    itemType: ITEM_TYPES.DESCRIPTION,
	    text: ''
	  };
	}
	function makeEmptyConstant() {
	  return {
	    itemType: ITEM_TYPES.CONSTANT,
	    id: generateConstantId(),
	    name: '',
	    constantType: CONSTANT_TYPES.STRING,
	    multiple: false,
	    description: '',
	    "default": '',
	    options: [],
	    required: false
	  };
	}
	function convertConstants(constant) {
	  return {
	    Name: constant.name,
	    Description: constant.description,
	    Type: constant.constantType,
	    Required: 0,
	    Multiple: constant.multiple ? 1 : 0,
	    Options: constant.options && constant.options.length > 0 ? constant.options : null,
	    Default: constant["default"]
	  };
	}
	function generateRandomString(length) {
	  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	  var result = '';
	  var charactersLength = characters.length;
	  for (var i = 0; i < length; i++) {
	    result += characters.charAt(Math.floor(Math.random() * charactersLength));
	  }
	  return result;
	}
	function generateConstantId() {
	  return CONSTANT_ID_PREFIX + generateRandomString(10);
	}

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	var ConstantEditComponent = {
	  name: 'ConstantEditComponent',
	  props: {
	    /** @type ConstantItem */
	    item: {
	      type: Object,
	      required: false,
	      "default": null
	    },
	    /** Record<string, string> */
	    fieldTypeNames: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['update', 'cancel'],
	  data: function data() {
	    var _this$item$constantTy, _this$item, _this$item$name, _this$item2, _this$item$multiple, _this$item3, _this$item$required, _this$item4;
	    return {
	      type: (_this$item$constantTy = (_this$item = this.item) === null || _this$item === void 0 ? void 0 : _this$item.constantType) !== null && _this$item$constantTy !== void 0 ? _this$item$constantTy : CONSTANT_TYPES.STRING,
	      name: (_this$item$name = (_this$item2 = this.item) === null || _this$item2 === void 0 ? void 0 : _this$item2.name) !== null && _this$item$name !== void 0 ? _this$item$name : '',
	      multiple: (_this$item$multiple = (_this$item3 = this.item) === null || _this$item3 === void 0 ? void 0 : _this$item3.multiple) !== null && _this$item$multiple !== void 0 ? _this$item$multiple : false,
	      required: (_this$item$required = (_this$item4 = this.item) === null || _this$item4 === void 0 ? void 0 : _this$item4.required) !== null && _this$item$required !== void 0 ? _this$item$required : false,
	      nameInvalid: false
	    };
	  },
	  watch: {
	    name: function name(value) {
	      if (value !== '') {
	        this.nameInvalid = false;
	      }
	    }
	  },
	  methods: {
	    onOk: function onOk() {
	      if (this.name === '') {
	        this.nameInvalid = true;
	        return;
	      }
	      this.nameInvalid = false;
	      var payload = {
	        propertyValues: {
	          constantType: this.type,
	          name: this.name,
	          multiple: this.multiple,
	          required: this.required
	        }
	      };
	      this.$emit('update', payload);
	    },
	    onCancel: function onCancel() {
	      this.$emit('cancel');
	    }
	  },
	  template: "\n\t\t<div>\n\t\t\t<div>\n\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_HEADING') }}\n\t\t\t</div>\n\n\t\t\t<div>\n\t\t\t\t<label>\n\t\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_NAME_LABEL') }}\n\t\t\t\t\t<br>\n\t\t\t\t\t<input v-model.trim=\"name\" type=\"text\" :class=\"{'has-error': this.nameInvalid }\"/>\n\t\t\t\t</label>\n\t\t\t</div>\n\n\t\t\t<div>\n\t\t\t\t<label>\n\t\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_TYPE_LABEL') }}\n\t\t\t\t\t<br>\n\t\t\t\t\t<select v-model=\"type\">\n\t\t\t\t\t\t<option v-for=\"(typeName, typeKey) in fieldTypeNames\" :value=\"typeKey\" :key=\"typeKey\">\n\t\t\t\t\t\t\t{{ typeName }}\n\t\t\t\t\t\t</option>\n\t\t\t\t\t</select>\n\t\t\t\t</label>\n\t\t\t</div>\n\n\t\t\t<div>\n\t\t\t\t<label>\n\t\t\t\t\t<input v-model=\"multiple\" type=\"checkbox\"/>\n\t\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_MULTIPLE_LABEL') }}\n\t\n\t\t\t\t</label>\n\t\t\t</div>\n\n\t\t\t<div>\n\t\t\t\t<label>\n\t\t\t\t\t<input v-model=\"required\" type=\"checkbox\"/>\n\t\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_REQUIRED_LABEL') }}\n\t\t\t\t</label>\n\t\t\t</div>\n\t\n\t\t\t<div>\n\t\t\t\t<button type=\"button\" @click=\"onOk\">\n\t\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_OK') }}\n\t\t\t\t</button>\n\n\t\t\t\t<button type=\"button\" @click=\"onCancel\">\n\t\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_CANCEL') }}\n\t\t\t\t</button>\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	var ConstantComponent = {
	  name: 'ConstantComponent',
	  components: {
	    ConstantEditComponent: ConstantEditComponent
	  },
	  props: {
	    /** @type ConstantItem */
	    item: {
	      type: Object,
	      required: true
	    },
	    /** Record<string, string> */
	    fieldTypeNames: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['updateItemProperty', 'cancelItem'],
	  data: function data() {
	    return {
	      editMode: this.item.name === ''
	    };
	  },
	  computed: {
	    typeLabel: function typeLabel() {
	      var _this$fieldTypeNames$;
	      return (_this$fieldTypeNames$ = this.fieldTypeNames[this.item.constantType]) !== null && _this$fieldTypeNames$ !== void 0 ? _this$fieldTypeNames$ : this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_ITEM_TYPE_UNSUPPORTED');
	    },
	    titleWithType: function titleWithType() {
	      return this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_ITEM_TITLE', {
	        '#NAME#': this.item.name,
	        '#TYPE#': this.typeLabel
	      });
	    }
	  },
	  methods: {
	    onInput: function onInput(event) {
	      var payload = {
	        propertyValues: {
	          "default": event.target.value
	        }
	      };
	      this.$emit('updateItemProperty', payload);
	    },
	    onEdit: function onEdit() {
	      this.editMode = true;
	    },
	    onEditCancel: function onEditCancel() {
	      this.editMode = false;
	      if (this.item.name === '') {
	        this.$emit('cancelItem');
	      }
	    },
	    onEditUpdate: function onEditUpdate(payload) {
	      this.editMode = false;
	      this.$emit('updateItemProperty', payload);
	    }
	  },
	  template: "\n\t\t<div>\n\t\t\t<div v-if=\"!editMode\">\n\t\t\t\t<div>\n\t\t\t\t\t{{ titleWithType }}\n\t\t\t\t</div>\n\t\t\t\t<div>\n\t\t\t\t\t<input type=\"text\" :value=\"item.default\" @input=\"onInput\">\n\t\t\t\t</div>\n\t\t\t\t<button type=\"button\" @click=\"onEdit\">\n\t\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT') }}\n\t\t\t\t</button>\n\t\t\t</div>\n\t\t\t<ConstantEditComponent\n\t\t\t\tv-if=\"editMode\"\n\t\t\t\t:item=\"item\"\n\t\t\t \t:fieldTypeNames=\"fieldTypeNames\"\n\t\t\t\t@cancel=\"onEditCancel\"\n\t\t\t\t@update=\"onEditUpdate\"\n\t\t\t/>\n\t\t</div>\n\t"
	};

	// eslint-disable-next-line no-unused-vars
	// eslint-disable-next-line no-unused-vars

	// @vue/component
	var DelimiterComponent = {
	  name: 'DelimiterComponent',
	  props: {
	    /** @type DelimiterItem */
	    item: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['updateItemProperty'],
	  methods: {
	    onSelect: function onSelect(event) {
	      var payload = {
	        propertyValues: {
	          delimiterType: event.target.value
	        }
	      };
	      this.$emit('updateItemProperty', payload);
	    }
	  },
	  template: "\n\t\t<div>\n\t\t\t<div>\n\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DELIMITER_ITEM_LABEL') }}\n\t\t\t</div>\n\t\t\t<div>\n\t\t\t\t<select :value=\"item.delimiterType\" @change=\"onSelect\">\n\t\t\t\t\t<option value=\"line\">\n\t\t\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DELIMITER_ITEM_OPTION_LINE') }}\n\t\t\t\t\t</option>\n\t\t\t\t</select>\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	// eslint-disable-next-line no-unused-vars
	// eslint-disable-next-line no-unused-vars

	// @vue/component
	var DescriptionComponent = {
	  name: 'DescriptionComponent',
	  props: {
	    /** @type DescriptionItem */
	    item: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['updateItemProperty'],
	  methods: {
	    onInput: function onInput(event) {
	      var payload = {
	        propertyValues: {
	          text: event.target.value
	        }
	      };
	      this.$emit('updateItemProperty', payload);
	    }
	  },
	  template: "\n\t\t<div>\n\t\t\t<div>\n\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DESCRIPTION_ITEM_LABEL') }}\n\t\t\t</div>\n\t\t\t<div>\n\t\t\t\t<textarea :value=\"item.text\" @input=\"onInput\"/>\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	// eslint-disable-next-line no-unused-vars
	// eslint-disable-next-line no-unused-vars

	// @vue/component
	var TitleComponent = {
	  name: 'TitleComponent',
	  props: {
	    /** @type TitleItem */
	    item: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['updateItemProperty'],
	  methods: {
	    onInput: function onInput(event) {
	      var payload = {
	        propertyValues: {
	          text: event.target.value
	        }
	      };
	      this.$emit('updateItemProperty', payload);
	    }
	  },
	  template: "\n\t\t<div>\n\t\t\t<div>\n\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_TITLE_ITEM_LABEL') }}\n\t\t\t</div>\n\t\t\t<div>\n\t\t\t\t<input type=\"text\" :value=\"item.text\" @input=\"onInput\"/>\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	var ItemComponent = {
	  name: 'ItemComponent',
	  components: {
	    TitleComponent: TitleComponent,
	    DelimiterComponent: DelimiterComponent,
	    DescriptionComponent: DescriptionComponent,
	    ConstantComponent: ConstantComponent
	  },
	  props: {
	    /** @type Item */
	    item: {
	      type: Object,
	      required: true
	    },
	    /** Record<string, string> */
	    fieldTypeNames: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['deleteItem', 'updateItemProperty'],
	  computed: {
	    type: function type() {
	      return this.item.itemType;
	    },
	    isItemTitle: function isItemTitle() {
	      return this.type === ITEM_TYPES.TITLE;
	    },
	    isItemDelimiter: function isItemDelimiter() {
	      return this.type === ITEM_TYPES.DELIMITER;
	    },
	    isItemDescription: function isItemDescription() {
	      return this.type === ITEM_TYPES.DESCRIPTION;
	    },
	    isItemConstant: function isItemConstant() {
	      return this.type === ITEM_TYPES.CONSTANT;
	    }
	  },
	  methods: {
	    deleteItem: function deleteItem() {
	      this.$emit('deleteItem');
	    },
	    onUpdateItemProperty: function onUpdateItemProperty(payload) {
	      this.$emit('updateItemProperty', payload);
	    }
	  },
	  template: "\n\t\t<div>\n\t\t\t<TitleComponent \n\t\t\t\tv-if=\"isItemTitle\"\n\t\t\t\t:item=\"item\" \n\t\t\t\t@updateItemProperty=\"onUpdateItemProperty\"\n\t\t\t/>\n\t\t\t<DescriptionComponent\n\t\t\t\tv-if=\"isItemDescription\"\n\t\t\t\t:item=\"item\"\n\t\t\t\t@updateItemProperty=\"onUpdateItemProperty\"\n\t\t\t/>\n\t\t\t<DelimiterComponent\n\t\t\t\tv-if=\"isItemDelimiter\"\n\t\t\t\t:item=\"item\"\n\t\t\t\t@updateItemProperty=\"onUpdateItemProperty\"\n\t\t\t/>\n\t\t\t<ConstantComponent\n\t\t\t\tv-if=\"isItemConstant\"\n\t\t\t\t:item=\"item\"\n\t\t\t\t:fieldTypeNames=\"fieldTypeNames\"\n\t\t\t\t@updateItemProperty=\"onUpdateItemProperty\"\n\t\t\t\t@cancelItem=\"deleteItem\"\n\t\t\t/>\n\t\t\t<button @click=\"deleteItem\" type=\"button\">\n\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DELETE') }}\n\t\t\t</button>\n\t\t</div>\n\t"
	};

	// @vue/component
	var BlockComponent = {
	  name: 'BlockComponent',
	  components: {
	    ItemComponent: ItemComponent,
	    BMenu: ui_system_menu_vue.BMenu
	  },
	  props: {
	    /** @type Array<Item> */
	    items: {
	      type: Array,
	      required: true
	    },
	    position: {
	      type: Number,
	      required: true
	    },
	    /** Record<string, string> */
	    fieldTypeNames: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['addItem', 'deleteBlock', 'deleteItem', 'updateItemProperty'],
	  data: function data() {
	    return {
	      isMenuShown: false
	    };
	  },
	  computed: {
	    title: function title() {
	      return this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_BLOCK_TITLE', {
	        '#POSITION#': this.position
	      });
	    },
	    menuOptions: function menuOptions() {
	      var _this = this;
	      return {
	        bindElement: this.$refs.addItemElementRef,
	        items: [{
	          onClick: function onClick() {
	            return _this.addItem(makeEmptyTitle());
	          },
	          title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_TITLE_ITEM_LABEL')
	        }, {
	          onClick: function onClick() {
	            return _this.addItem(makeEmptyDescription());
	          },
	          title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DESCRIPTION_ITEM_LABEL')
	        }, {
	          onClick: function onClick() {
	            return _this.addItem(makeEmptyDelimiter());
	          },
	          title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DELIMITER_ITEM_LABEL')
	        }, {
	          onClick: function onClick() {
	            return _this.addItem(makeEmptyConstant());
	          },
	          // todo add event to change constants of workflow
	          title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_MENU')
	        }]
	      };
	    }
	  },
	  methods: {
	    addItem: function addItem(item) {
	      this.$emit('addItem', item);
	    },
	    deleteBlock: function deleteBlock() {
	      this.$emit('deleteBlock');
	    },
	    deleteItem: function deleteItem(itemIndex) {
	      this.$emit('deleteItem', itemIndex);
	    },
	    onUpdateItemProperty: function onUpdateItemProperty(itemIndex, payload) {
	      var filledPayload = {
	        propertyValues: payload.propertyValues,
	        itemIndex: itemIndex
	      };
	      this.$emit('updateItemProperty', filledPayload);
	    }
	  },
	  template: "\n\t\t<div>\n\t\t\t<div>\n\t\t\t\t{{ title }} \n\t\t\t\t<button @click=\"deleteBlock\" type=\"button\">\n\t\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DELETE') }}\n\t\t\t\t</button>\n\t\t\t</div>\n\t\t\t<div v-for=\"(item, index) in items\">\n\t\t\t\t<ItemComponent \n\t\t\t\t\t:key=\"index\"\n\t\t\t\t\t:item=\"item\"\n\t\t\t\t\t:fieldTypeNames=\"fieldTypeNames\"\n\t\t\t\t\t@deleteItem=\"deleteItem(index)\"\n\t\t\t\t\t@updateItemProperty=\"onUpdateItemProperty(index, $event)\"\n\t\t\t\t/>\n\t\t\t</div>\n\t\t\t<div @click=\"isMenuShown = true\" ref=\"addItemElementRef\">\n\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ADD_ITEM') }}\n\t\t\t\t<BMenu  v-if=\"isMenuShown\" :options=\"menuOptions\" @close=\"isMenuShown = false\" />\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
	function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
	function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
	var ACTIVITY_NAME = 'SetupTemplateActivity';

	// @vue/component
	var BlocksAppComponent = {
	  name: 'BlocksAppComponent',
	  components: {
	    BlockComponent: BlockComponent
	  },
	  props: {
	    serializedBlocks: {
	      type: [String, null],
	      required: true
	    },
	    /** Record<string, string> */
	    fieldTypeNames: {
	      type: Object,
	      required: true
	    }
	  },
	  data: function data() {
	    var _JSON$parse;
	    return {
	      blocks: (_JSON$parse = JSON.parse(this.serializedBlocks)) !== null && _JSON$parse !== void 0 ? _JSON$parse : [],
	      initialConstantIds: null
	    };
	  },
	  computed: {
	    formValue: function formValue() {
	      return JSON.stringify(this.blocks);
	    }
	  },
	  created: function created() {
	    this.initialConstantIds = new Set(this.blocks.flatMap(function (block) {
	      return block.items || [];
	    }).filter(function (item) {
	      return (item === null || item === void 0 ? void 0 : item.itemType) === ITEM_TYPES.CONSTANT && item.id;
	    }).map(function (item) {
	      return item.id;
	    }));
	  },
	  mounted: function mounted() {
	    main_core_events.EventEmitter.subscribe('Bizproc.NodeSettings:nodeSettingsSaving', this.onNodeSettingsSave);
	  },
	  unmounted: function unmounted() {
	    main_core_events.EventEmitter.unsubscribe('Bizproc.NodeSettings:nodeSettingsSaving', this.onNodeSettingsSave);
	  },
	  methods: {
	    addBlock: function addBlock() {
	      this.blocks.push(this.makeEmptyBlock());
	    },
	    makeEmptyBlock: function makeEmptyBlock() {
	      return {
	        items: []
	      };
	    },
	    addItem: function addItem(blockIndex, item) {
	      this.blocks[blockIndex].items.push(item);
	    },
	    deleteBlock: function deleteBlock(blockIndex) {
	      this.blocks.splice(blockIndex, 1);
	    },
	    deleteItem: function deleteItem(blockIndex, itemIndex) {
	      this.blocks[blockIndex].items.splice(itemIndex, 1);
	    },
	    onUpdateItemProperty: function onUpdateItemProperty(blockIndex, payload) {
	      for (var _i = 0, _Object$entries = Object.entries(payload.propertyValues); _i < _Object$entries.length; _i++) {
	        var _Object$entries$_i = babelHelpers.slicedToArray(_Object$entries[_i], 2),
	          property = _Object$entries$_i[0],
	          value = _Object$entries$_i[1];
	        this.blocks[blockIndex].items[payload.itemIndex][property] = value;
	      }
	    },
	    onNodeSettingsSave: function onNodeSettingsSave(event) {
	      var _event$getData = event.getData(),
	        formData = _event$getData.formData;
	      if (formData.activity !== ACTIVITY_NAME) {
	        return;
	      }
	      var currentConstants = this.blocks.flatMap(function (block) {
	        return block.items || [];
	      }).filter(function (item) {
	        return (item === null || item === void 0 ? void 0 : item.itemType) === ITEM_TYPES.CONSTANT;
	      });
	      var currentConstantIds = new Set(currentConstants.map(function (item) {
	        return item.id;
	      }));
	      var deletedConstantIds = [];
	      var _iterator = _createForOfIteratorHelper(this.initialConstantIds),
	        _step;
	      try {
	        for (_iterator.s(); !(_step = _iterator.n()).done;) {
	          var initialId = _step.value;
	          if (!currentConstantIds.has(initialId)) {
	            deletedConstantIds.push(initialId);
	          }
	        }
	      } catch (err) {
	        _iterator.e(err);
	      } finally {
	        _iterator.f();
	      }
	      var constantsToUpdate = {};
	      var _iterator2 = _createForOfIteratorHelper(currentConstants),
	        _step2;
	      try {
	        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
	          var constant = _step2.value;
	          if (constant !== null && constant !== void 0 && constant.id) {
	            constantsToUpdate[constant.id] = convertConstants(constant);
	          }
	        }
	      } catch (err) {
	        _iterator2.e(err);
	      } finally {
	        _iterator2.f();
	      }
	      main_core_events.EventEmitter.emit('Bizproc:onConstantsUpdated', {
	        constantsToUpdate: constantsToUpdate,
	        deletedConstantIds: deletedConstantIds
	      });
	      this.initialConstantIds = currentConstantIds;
	    }
	  },
	  template: "\n\t\t<div>\n\t\t\t<input type=\"hidden\" id=\"id_blocks\" name=\"blocks\" :value=\"formValue\"/>\n\t\t\t<div>\n\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_APP_TITLE') }}\n\t\t\t</div>\n\t\t\t<div v-for=\"(block, index) in blocks\">\n\t\t\t\t<BlockComponent \n\t\t\t\t\t:key=\"index\"\n\t\t\t\t\t:items=\"block.items\"\n\t\t\t\t\t:position=\"index + 1\"\n\t\t\t\t\t:fieldTypeNames=\"fieldTypeNames\"\n\t\t\t\t\t@addItem=\"addItem(index, $event)\"\n\t\t\t\t\t@deleteBlock=\"deleteBlock(index)\"\n\t\t\t\t\t@deleteItem=\"deleteItem(index, $event)\"\n\t\t\t\t\t@updateItemProperty=\"onUpdateItemProperty(index, $event)\"\n\t\t\t\t/>\n\t\t\t</div>\n\t\t\t<div @click=\"addBlock\">\n\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ADD_BLOCK') }}\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	var namespace = main_core.Reflection.namespace('BX.Bizproc.Activity');
	var _currentValues = /*#__PURE__*/new WeakMap();
	var _blocksElement = /*#__PURE__*/new WeakMap();
	var _fieldTypeNames = /*#__PURE__*/new WeakMap();
	var SetupTemplateActivity = /*#__PURE__*/function () {
	  function SetupTemplateActivity(parameters) {
	    babelHelpers.classCallCheck(this, SetupTemplateActivity);
	    _classPrivateFieldInitSpec(this, _currentValues, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _blocksElement, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _fieldTypeNames, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldSet(this, _currentValues, parameters.currentValues);
	    babelHelpers.classPrivateFieldSet(this, _blocksElement, document.getElementById(parameters.domElementId));
	    babelHelpers.classPrivateFieldSet(this, _fieldTypeNames, parameters.fieldTypeNames);
	  }
	  babelHelpers.createClass(SetupTemplateActivity, [{
	    key: "init",
	    value: function init() {
	      var _babelHelpers$classPr;
	      var app = ui_vue3.BitrixVue.createApp(BlocksAppComponent, {
	        serializedBlocks: (_babelHelpers$classPr = babelHelpers.classPrivateFieldGet(this, _currentValues)) === null || _babelHelpers$classPr === void 0 ? void 0 : _babelHelpers$classPr.blocks,
	        fieldTypeNames: babelHelpers.classPrivateFieldGet(this, _fieldTypeNames)
	      });
	      app.mount(babelHelpers.classPrivateFieldGet(this, _blocksElement));
	    }
	  }]);
	  return SetupTemplateActivity;
	}();
	namespace.SetupTemplateActivity = SetupTemplateActivity;

}((this.BX.Bizproc.Activity = this.BX.Bizproc.Activity || {}),BX,BX.Event,BX.UI.System.Menu,BX,BX.Vue3));
//# sourceMappingURL=script.js.map

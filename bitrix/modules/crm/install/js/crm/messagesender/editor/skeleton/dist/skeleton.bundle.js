/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.MessageSender = this.BX.Crm.MessageSender || {};
this.BX.Crm.MessageSender.Editor = this.BX.Crm.MessageSender.Editor || {};
(function (exports,main_core,ui_system_skeleton) {
	'use strict';

	let _ = t => t,
	  _t;
	const RADIUS = 8;
	const DEFAULT_PADDING = 'var(--ui-space-inset-lg)';
	var _skeleton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("skeleton");
	var _options = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("options");
	class Skeleton {
	  constructor(options) {
	    Object.defineProperty(this, _skeleton, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _options, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _options)[_options] = options != null ? options : {};
	  }
	  render() {
	    var _ref, _babelHelpers$classPr, _ref2, _babelHelpers$classPr2, _ref3, _babelHelpers$classPr3, _ref4, _babelHelpers$classPr4;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _skeleton)[_skeleton]) {
	      return babelHelpers.classPrivateFieldLooseBase(this, _skeleton)[_skeleton];
	    }

	    // noinspection MagicNumberJS
	    babelHelpers.classPrivateFieldLooseBase(this, _skeleton)[_skeleton] = main_core.Tag.render(_t || (_t = _`
			<div class="crm-messagesender-editor-skeleton">
				<div class="crm-messagesender-editor-skeleton-header">
					<div class="crm-messagesender-editor-skeleton-header-left">
						${0}
						${0}
					</div>
					${0}
				</div>
				<div class="crm-messagesender-editor-skeleton-body"></div>
				<div class="crm-messagesender-editor-skeleton-add">
					${0}
					${0}
				</div>
				<div class="crm-messagesender-editor-skeleton-footer">
					${0}
					${0}
				</div>
			</div>
		`), ui_system_skeleton.Line(133, 32, RADIUS), ui_system_skeleton.Line(220, 32, RADIUS), ui_system_skeleton.Line(132, 32, RADIUS), ui_system_skeleton.Line(126, 10, RADIUS), ui_system_skeleton.Line(126, 10, RADIUS), ui_system_skeleton.Line(103, 34, RADIUS), ui_system_skeleton.Line(100, 11, RADIUS));
	    main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _skeleton)[_skeleton], {
	      paddingTop: (_ref = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].layout.paddingTop) != null ? _babelHelpers$classPr : babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].layout.padding) != null ? _ref : DEFAULT_PADDING,
	      paddingBottom: (_ref2 = (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].layout.paddingBottom) != null ? _babelHelpers$classPr2 : babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].layout.padding) != null ? _ref2 : DEFAULT_PADDING,
	      paddingLeft: (_ref3 = (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].layout.paddingLeft) != null ? _babelHelpers$classPr3 : babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].layout.padding) != null ? _ref3 : DEFAULT_PADDING,
	      paddingRight: (_ref4 = (_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].layout.paddingRight) != null ? _babelHelpers$classPr4 : babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].layout.padding) != null ? _ref4 : DEFAULT_PADDING
	    });
	    return babelHelpers.classPrivateFieldLooseBase(this, _skeleton)[_skeleton];
	  }
	  renderTo(target) {
	    main_core.Dom.append(this.render(), target);
	  }
	}

	exports.Skeleton = Skeleton;

}((this.BX.Crm.MessageSender.Editor.Skeleton = this.BX.Crm.MessageSender.Editor.Skeleton || {}),BX,BX.UI.System));
//# sourceMappingURL=skeleton.bundle.js.map

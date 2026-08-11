/* eslint-disable */
this.BX = this.BX || {};
this.BX.MessageService = this.BX.MessageService || {};
this.BX.MessageService.Message = this.BX.MessageService.Message || {};
this.BX.MessageService.Message.Editor = this.BX.MessageService.Message.Editor || {};
(function (exports, main_core, ui_system_skeleton) {
	'use strict';

	const RADIUS = 8;
	const DEFAULT_PADDING = 'var(--ui-space-inset-lg)';
	class Skeleton {
		#skeleton = null;
		#options;
		constructor(options) {
			this.#options = options ?? {};
		}
		render() {
			if (this.#skeleton) {
				return this.#skeleton;
			}

			// noinspection MagicNumberJS
			this.#skeleton = main_core.Tag.render`
			<div class="messageservice-message-editor-skeleton">
				<div class="messageservice-message-editor-skeleton-header">
					<div class="messageservice-message-editor-skeleton-header-left">
						${ui_system_skeleton.Line(133, 32, RADIUS)}
						${ui_system_skeleton.Line(220, 32, RADIUS)}
					</div>
					${ui_system_skeleton.Line(132, 32, RADIUS)}
				</div>
				<div class="messageservice-message-editor-skeleton-body"></div>
				<div class="messageservice-message-editor-skeleton-add">
					${ui_system_skeleton.Line(126, 10, RADIUS)}
					${ui_system_skeleton.Line(126, 10, RADIUS)}
				</div>
				<div class="messageservice-message-editor-skeleton-footer">
					${ui_system_skeleton.Line(103, 34, RADIUS)}
					${ui_system_skeleton.Line(100, 11, RADIUS)}
				</div>
			</div>
		`;
			main_core.Dom.style(this.#skeleton, {
				paddingTop: this.#options.layout?.paddingTop ?? this.#options.layout?.padding ?? DEFAULT_PADDING,
				paddingBottom: this.#options.layout?.paddingBottom ?? this.#options.layout?.padding ?? DEFAULT_PADDING,
				paddingLeft: this.#options.layout?.paddingLeft ?? this.#options.layout?.padding ?? DEFAULT_PADDING,
				paddingRight: this.#options.layout?.paddingRight ?? this.#options.layout?.padding ?? DEFAULT_PADDING
			});
			return this.#skeleton;
		}
		renderTo(target) {
			main_core.Dom.append(this.render(), target);
		}
	}

	exports.Skeleton = Skeleton;

})(this.BX.MessageService.Message.Editor.Skeleton = this.BX.MessageService.Message.Editor.Skeleton || {}, BX, BX.UI.System);
//# sourceMappingURL=skeleton.bundle.js.map

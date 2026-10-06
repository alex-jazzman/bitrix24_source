/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, ui_iconSet_api_vue) {
	'use strict';

	// @vue/component
	const SearchItemLayout = {
		name: 'SearchItemLayout',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			selected: {
				type: Boolean,
				default: false
			},
			centered: {
				type: Boolean,
				default: false
			}
		},
		emits: ['click', 'contextmenu'],
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline
		},
		template: `
		<div
			class="bx-im-search-item-layout__container bx-im-search-item-layout__scope"
			:class="{ '--selected': selected }"
			@click="$emit('click', $event)"
			@contextmenu.prevent="$emit('contextmenu', $event)"
		>
			<div class="bx-im-search-item-layout__avatar-container">
				<slot name="avatar" />
			</div>
			<div class="bx-im-search-item-layout__content-container" :class="{ '--centered': centered }">
				<div class="bx-im-search-item-layout__content_header">
					<slot name="header" />
				</div>
				<div class="bx-im-search-item-layout__item-text">
					<slot name="subtitle" />
				</div>
			</div>
			<BIcon
				v-if="selected"
				class="bx-im-search-item-layout__selected"
				:name="OutlineIcons.CHECK_M"
			/>
		</div>
	`
	};

	exports.SearchItemLayout = SearchItemLayout;

})(this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}, BX.UI.IconSet);
//# sourceMappingURL=search-item-layout.bundle.js.map

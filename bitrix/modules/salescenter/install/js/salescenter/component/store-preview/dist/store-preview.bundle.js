/* eslint-disable */
this.BX = this.BX || {};
this.BX.Salescenter = this.BX.Salescenter || {};
(function (exports, ui_vue) {
	'use strict';

	const PreviewBlock = {
		props: ['options'],
		computed: {
			loc() {
				return ui_vue.Vue.getFilteredPhrases('SC_STORE_PREVIEW_');
			},
			getClassPreviewImage() {
				return {
					'salescenter-company-contacts-prev': this.options.lang === 'ru',
					'salescenter-company-contacts-prev-en': this.options.lang === 'en',
					'salescenter-company-contacts-prev-ua': this.options.lang === 'ua'
				};
			}
		},
		template: `
			<div class="salescenter-company-contacts-item salescenter-company-contacts-item--gray">
				<div class="salescenter-company-contacts-item-preview">
					<div class="salescenter-company-contacts-item-preview-image">
						<div :class="getClassPreviewImage"></div>
					</div>
				</div>
			</div>`
	};

	exports.PreviewBlock = PreviewBlock;

})(this.BX.Salescenter.Component = this.BX.Salescenter.Component || {}, BX);
//# sourceMappingURL=store-preview.bundle.js.map

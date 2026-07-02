/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core) {
	'use strict';

	class SidePanelWrapper {
		static open(config = {
			id: '',
			content: '',
			titleText: '',
			footerIsActive: false,
			cancelButton: {},
			consentButton: {
				function: () => {}
			}
		}) {
			let wrapper = main_core.Tag.render`<div class="mail-slider-wrapper"></div>`;
			let header = main_core.Tag.render`<div class="mail-slider-wrapper-header"></div>`;
			let title = main_core.Tag.render`
			<div class="mail-slider-wrapper-header-title">
				${config['titleText']}
			</div>
		`;
			let footer = main_core.Tag.render`<div></div>`;
			if (config['footerIsActive']) {
				footer = main_core.Tag.render`<div class="mail-slider-wrapper-footer-fixed"></div>`;
				if (config['consentButton'] !== undefined) {
					let consentButton = new BX.UI.Button({
						text: config['consentButton']['text'],
						color: BX.UI.Button.Color.SUCCESS,
						events: {},
						onclick: function () {
							config['consentButton']['function'](consentButton);
						}
					});
					footer.append(consentButton.getContainer());
				}
				if (config['cancelButton'] !== undefined) {
					let cancelButton = main_core.Tag.render`
					<button class="ui-btn ui-btn-md ui-btn-link">
						${config['cancelButton']['text']}
					</button>
				`;
					cancelButton.onclick = () => {
						cancelButton.onclick = () => {};
						BX.SidePanel.Instance.close();
					};
					footer.append(cancelButton);
				}
			}
			let content = main_core.Tag.render`<div class="mail-slider-wrapper-content"></div>`;
			if (typeof config['content'] === "string") {
				content = main_core.Tag.render`
				<div class="mail-slider-wrapper-content">
					${config['content']}
				</div>
			`;
			} else {
				content.append(config['content']);
			}
			header.append(title);
			wrapper.append(header);
			wrapper.append(content);
			wrapper.append(footer);
			BX.SidePanel.Instance.open(config['id'], {
				id: config['id'],
				contentCallback: () => new Promise(resolve => resolve(wrapper)),
				width: 735,
				cacheable: false
			});
		}
	}

	exports.SidePanelWrapper = SidePanelWrapper;

})(this.BX.Mail = this.BX.Mail || {}, BX);
//# sourceMappingURL=sidepanelwrapper.bundle.js.map

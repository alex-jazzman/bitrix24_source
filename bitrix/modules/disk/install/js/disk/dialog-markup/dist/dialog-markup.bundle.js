/* eslint-disable */
this.BX = this.BX || {};
this.BX.Disk = this.BX.Disk || {};
(function (exports, main_core) {
	'use strict';

	function safeLink(link) {
		if (!main_core.Type.isStringFilled(link) || !/^(?:\/(?![/\\])|https?:\/\/)/i.test(link)) {
			return '';
		}
		try {
			return new URL(link, location.href).origin === location.origin ? link : '';
		} catch {
			return '';
		}
	}

	const CARD_CLASS = 'bx-disk-info-popup-btn';
	const SERVICE_CARD_HIDDEN_ATTRIBUTE = 'data-hidden';
	const CARD_ACTIVE_CLASS = 'bx-disk-info-popup-btn-active';
	function renderServiceCard(card, isSelected) {
		const isHidden = card.hidden === true;
		const title = main_core.Loc.getMessage(card.titleMessageId) ?? '';
		const description = main_core.Loc.getMessage(card.descriptionMessageId) ?? '';
		const node = main_core.Tag.render`
		<span
			id="${card.id}"
			class="${CARD_CLASS} ${card.modifierClass}"
			data-service="${card.service}"
			data-testid="${card.testId}"
			role="radio"
			tabindex="-1"
			aria-checked="${isSelected ? 'true' : 'false'}"
			aria-labelledby="${card.titleId}"
			aria-describedby="${card.descriptionId}"
		>
			<span class="bx-disk-info-popup-btn-text"><span id="${card.titleId}">${title}</span></span>
			<span class="bx-disk-info-popup-btn-descript" id="${card.descriptionId}">${description}</span>
			<span class="bx-disk-info-popup-btn-check"></span>
		</span>
	`;
		if (isSelected) {
			main_core.Dom.addClass(node, CARD_ACTIVE_CLASS);
			main_core.Dom.attr(node, 'data-autofocus', '');
		}
		if (isHidden) {
			main_core.Dom.attr(node, SERVICE_CARD_HIDDEN_ATTRIBUTE, '');
			main_core.Dom.style(node, 'display', 'none');
		}
		return node;
	}

	const LOCKED_DOCUMENT_WARNING_TITLE_ID = 'disk-locked-document-warning-title';
	function renderLockedDocumentWarning(params) {
		const link = safeLink(params.link);
		const text = (main_core.Loc.getMessage(params.textMessageId) ?? '').replace('#LINK#', () => main_core.Text.encode(link));
		const action = main_core.Type.isStringFilled(link) ? main_core.Tag.render`
			<button
				type="button"
				tabindex="0"
				class="webform-button webform-button-create disk-locked-document-popup-content-button"
				data-testid="disk-locked-document-warning-open"
				data-autofocus
			>${main_core.Loc.getMessage(params.actionMessageId) ?? ''}</button>
		` : '';
		const node = main_core.Tag.render`
		<div class="disk-locked-document-popup" data-testid="disk-locked-document-warning">
			<div class="disk-locked-document-popup-container">
				<div class="disk-locked-document-popup-img-container">
					<div class="disk-locked-document-popup-img"></div>
				</div>
				<div class="disk-locked-document-popup-content">
					<h3 class="disk-locked-document-popup-content-title" id="${LOCKED_DOCUMENT_WARNING_TITLE_ID}">
						${main_core.Loc.getMessage(params.titleMessageId) ?? ''}
					</h3>
					<div class="disk-locked-document-popup-content-info">
						<span class="disk-locked-document-popup-content-text">${text}</span>
					</div>
					${action}
				</div>
			</div>
		</div>
	`;
		if (!main_core.Type.isStringFilled(link)) {
			node.querySelectorAll('.disk-locked-document-popup-content-text a').forEach(anchor => {
				anchor.removeAttribute('href');
				anchor.removeAttribute('target');
				anchor.removeAttribute('rel');
			});
		}
		return node;
	}

	const SAVE_AS_FIELD_ID = 'wd-new-create-filename';
	const EXTENSION_ID = 'wd-new-create-filename-extension';
	function renderSaveAsField(params) {
		const label = main_core.Loc.getMessage('DISK_JS_DIALOG_MARKUP_SAVE_AS_NAME_LABEL') ?? '';
		const node = main_core.Tag.render`
		<div
			class="bx-disk-document-edit-confirm-text-wrap bx-disk-document-edit-confirm-center"
			data-testid="disk-save-as-name-field"
		>
			<label class="bx-disk-document-edit-name-label" for="${SAVE_AS_FIELD_ID}">${label}</label>
			<input
				id="${SAVE_AS_FIELD_ID}"
				class="bx-disk-document-edit-name-input"
				type="text"
				data-testid="disk-save-as-name-input"
				data-autofocus
			>
			<span class="bx-disk-document-edit-confirm-extension" id="${EXTENSION_ID}"></span>
		</div>
	`;
		const field = node.querySelector(`#${SAVE_AS_FIELD_ID}`);
		const extension = node.querySelector(`#${EXTENSION_ID}`);
		field.value = params.nameWithoutExtension ?? '';
		extension.textContent = params.extension ?? '';
		if (extension.textContent !== '') {
			main_core.Dom.attr(field, 'aria-describedby', EXTENSION_ID);
		}
		return node;
	}

	exports.LOCKED_DOCUMENT_WARNING_TITLE_ID = LOCKED_DOCUMENT_WARNING_TITLE_ID;
	exports.SAVE_AS_FIELD_ID = SAVE_AS_FIELD_ID;
	exports.SERVICE_CARD_HIDDEN_ATTRIBUTE = SERVICE_CARD_HIDDEN_ATTRIBUTE;
	exports.renderLockedDocumentWarning = renderLockedDocumentWarning;
	exports.renderSaveAsField = renderSaveAsField;
	exports.renderServiceCard = renderServiceCard;
	exports.safeLink = safeLink;

})(this.BX.Disk.DialogMarkup = this.BX.Disk.DialogMarkup || {}, BX);
//# sourceMappingURL=dialog-markup.bundle.js.map

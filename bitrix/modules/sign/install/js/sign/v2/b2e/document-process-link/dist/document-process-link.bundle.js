/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, sign_v2_api) {
	'use strict';

	function isInternalUrl(url) {
		return url.startsWith('/') && !url.startsWith('//');
	}
	function renderProcessLine(process) {
		if (process === null) {
			return null;
		}
		return main_core.Tag.render`
		<div class="sign-b2e-document-process-link" data-testid="sign-b2e-document-process-link">
			<span class="sign-b2e-document-process-link__label">
				${main_core.Text.encode(main_core.Loc.getMessage('SIGN_B2E_DOCUMENT_PROCESS_LINK_LABEL') ?? '')}
			</span>
			${renderName(process)}
		</div>
	`;
	}
	function renderName(process) {
		const name = main_core.Text.encode(process.name);
		if (!isInternalUrl(process.url)) {
			return main_core.Tag.render`<span class="sign-b2e-document-process-link__name">${name}</span>`;
		}
		return main_core.Tag.render`
		<a
			class="sign-b2e-document-process-link__name"
			href="${main_core.Text.encode(process.url)}"
			target="_top"
			data-testid="sign-b2e-document-process-link-url"
		>${name}</a>
	`;
	}

	class DocumentProcessLink {
		static async mount(options) {
			const container = document.getElementById(options.containerId);
			if (container === null || options.documentId < 1) {
				return;
			}
			const line = renderProcessLine(await DocumentProcessLink.#load(options.documentId));
			if (line !== null) {
				main_core.Dom.append(line, container);
			}
		}
		static async #load(documentId) {
			try {
				return (await new sign_v2_api.Api().process.getByDocument(documentId)).process;
			} catch {
				return null;
			}
		}
	}

	exports.DocumentProcessLink = DocumentProcessLink;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.Sign.V2);
//# sourceMappingURL=document-process-link.bundle.js.map

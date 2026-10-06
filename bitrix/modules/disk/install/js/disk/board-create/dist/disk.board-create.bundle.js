/* eslint-disable */
this.BX = this.BX || {};
this.BX.Disk = this.BX.Disk || {};
(function (exports, main_core, ui_a11y) {
	'use strict';

	/**
	 * Creates a board via the flipchart controller and opens it in a tab prepared by the caller.
	 *
	 * The tab MUST be opened synchronously by the caller (`window.open('', '_blank')`) inside the
	 * click handler to bypass pop-up blockers - this function never opens it. On success the tab is
	 * pointed at the new document; on failure the tab is closed and an error toast is shown.
	 */
	function createBoard(params) {
		const {
			newTab,
			analyticsElement,
			onSuccess
		} = params;
		const config = {};
		if (analyticsElement) {
			config.analytics = {
				event: 'create',
				tool: 'boards',
				category: 'boards',
				c_element: analyticsElement
			};
		}
		main_core.ajax.runAction('disk.integration.flipchart.createDocument', config).then(response => {
			if (response.status === 'success' && response.data.file) {
				if (response.data.viewUrl) {
					if (newTab) {
						newTab.location.href = response.data.viewUrl;
					}
				} else {
					// Board was created but there is nowhere to navigate - don't leave an empty about:blank tab.
					newTab?.close();
				}
				onSuccess?.();
				return;
			}
			notifyFailure(newTab);
		}).catch(() => {
			notifyFailure(newTab);
		});
	}
	function notifyFailure(newTab) {
		newTab?.close();
		const message = main_core.Loc.getMessage('DISK_BOARD_CREATE_ERROR');
		BX.UI.Notification.Center.notify({
			content: message
		});
		ui_a11y.LiveAnnouncer.announce(message, 'assertive');
	}

	exports.createBoard = createBoard;

})(this.BX.Disk.BoardCreate = this.BX.Disk.BoardCreate || {}, BX, BX.UI.Accessibility);
//# sourceMappingURL=disk.board-create.bundle.js.map

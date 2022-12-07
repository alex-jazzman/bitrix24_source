/**
 * @module crm/timeline/action/ajax
 */
jn.define('crm/timeline/action/ajax', (require, exports, module) => {

	const { BaseTimelineAction } = require('crm/timeline/action/base');

	class AjaxAction extends BaseTimelineAction
	{
		execute()
		{
			this.source.showLoader();

			BX.ajax.runAction(this.value, { data: this.actionParams })
				.then(() => this.source.hideLoader())
				.catch((response) => {
					ErrorNotifier.showError(response.errors[0].message).finally(() => this.source.hideLoader())
				});
		}
	}

	module.exports = { AjaxAction };

});
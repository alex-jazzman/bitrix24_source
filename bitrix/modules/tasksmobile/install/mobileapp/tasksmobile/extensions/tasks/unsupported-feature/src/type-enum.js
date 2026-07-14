/**
 * @module tasks/unsupported-feature/src/type-enum
 */
jn.define('tasks/unsupported-feature/src/type-enum', (require, exports, module) => {
	const { Loc } = require('loc');
	const { BaseEnum } = require('utils/enums/base');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Icon } = require('assets/icons');

	class UnsupportedFeatureType extends BaseEnum
	{
		static FLOWS = new UnsupportedFeatureType('FLOWS', {
			testIdPrefix: 'tasks-flow-empty-state',
			title: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_FLOWS_TITLE'),
			footnote: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_FLOWS_FOOTNOTE'),
			image: {
				name: 'zefir-flow-list.png',
				folder: 'empty-states',
				moduleId: 'tasks',
				width: 199,
				height: 158,
			},
			items: [
				{
					icon: Icon.BUSINES_PROCESS_STAGES,
					text: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_FLOWS_ITEM_TYPICAL_TASKS'),
				},
				{
					icon: Icon.BOTTLENECK,
					text: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_FLOWS_ITEM_TEAM_LOAD'),
				},
				{
					icon: Icon.CARD,
					text: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_FLOWS_ITEM_CUSTOMER_VISIBILITY'),
				},
			],
			redirectUrl: `/company/personal/user/${env.userId}/tasks/flow/`,
			qrTitle: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_FLOWS_QR_TITLE'),
			buttonText: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_FLOWS_BUTTON'),
		});

		static ANALYTICS = new UnsupportedFeatureType('ANALYTICS', {
			testIdPrefix: 'tasks-analytics-empty-state',
			title: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_ANALYTICS_TITLE'),
			footnote: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_ANALYTICS_FOOTNOTE'),
			image: {
				name: 'zefir-empty-analytics.png',
				folder: 'empty-states',
				width: 199,
				height: 158,
			},
			items: [
				{
					icon: Icon.GROUP,
					text: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_ANALYTICS_ITEM_METRIC'),
				},
				{
					icon: Icon.STATISTICS_ARROW,
					text: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_ANALYTICS_ITEM_PROCESS'),
				},
				{
					icon: Icon.TEMPLATE_TASK,
					text: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_ANALYTICS_ITEM_DEEP_RESEARCH'),
				},
			],
			redirectUrl: `/bi/dashboard/`,
			qrTitle: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_ANALYTICS_QR_TITLE'),
			buttonText: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_ANALYTICS_BUTTON'),
		});

		static SCRUM = new UnsupportedFeatureType('SCRUM', {
			testIdPrefix: 'tasks-scrum-empty-state',
			title: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_SCRUM_TITLE'),
			footnote: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_SCRUM_FOOTNOTE'),
			image: {
				name: 'zefir-empty-scrum.png',
				folder: 'empty-states',
				width: 199,
				height: 158,
			},
			items: [
				{
					icon: Icon.MOVE_TO_CHECKLIST,
					text: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_SCRUM_ITEM_BACKLOG'),
				},
				{
					icon: Icon.TIMELINE,
					text: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_SCRUM_ITEM_PROCESS'),
				},
				{
					icon: Icon.TASK,
					text: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_SCRUM_ITEM_DESKTOP'),
				},
			],
			redirectUrl: `/company/personal/user/${env.userId}/tasks/scrum/`,
			qrTitle: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_SCRUM_QR_TITLE'),
		});

		getTitle()
		{
			return this.getValue().title;
		}

		getQrTitle()
		{
			return this.getValue().qrTitle;
		}

		getButtonText()
		{
			return this.getValue().buttonText || Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_OPEN_WEB');
		}

		getSubtitle()
		{
			return this.getValue().subtitle;
		}

		getFootnote()
		{
			return this.getValue().footnote;
		}

		getImageWidth()
		{
			return this.getValue().image.width;
		}

		getImageHeight()
		{
			return this.getValue().image.height;
		}

		getImageUri()
		{
			const { name, folder, moduleId } = this.getValue().image;

			return makeLibraryImagePath(name, folder, moduleId);
		}

		getItems()
		{
			return this.getValue().items;
		}

		getRedirectUrl()
		{
			return this.getValue().redirectUrl;
		}

		getTestIdPrefix()
		{
			return this.getValue().testIdPrefix;
		}
	}

	module.exports = {
		UnsupportedFeatureType,
	};
});

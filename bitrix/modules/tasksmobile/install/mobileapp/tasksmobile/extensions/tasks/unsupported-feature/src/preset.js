/**
 * @module tasks/unsupported-feature/src/preset
 */
jn.define('tasks/unsupported-feature/src/preset', (require, exports, module) => {
	const { Loc } = require('loc');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Icon } = require('assets/icons');

	class TasksUnavailableFeaturePreset
	{
		/**
		 * @param {string} name
		 * @param {TasksUnavailableFeaturePresetValue} value
		 */
		constructor(name, value)
		{
			this.name = name;
			this.value = value;
		}

		static FLOWS = new TasksUnavailableFeaturePreset('FLOWS', {
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

		static ANALYTICS = new TasksUnavailableFeaturePreset('ANALYTICS', {
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

		static SCRUM = new TasksUnavailableFeaturePreset('SCRUM', {
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

		static PROJECT_RESTRICTION = new TasksUnavailableFeaturePreset('PROJECT_RESTRICTION', {
			testIdPrefix: 'tasks-project-restriction',
			title: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_PROJECT_RESTRICTION_TITLE'),
			description: Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_TYPE_PROJECT_RESTRICTION_DESCRIPTION'),
			image: {
				name: 'zefir-not-found.png',
				folder: 'empty-states',
				moduleId: 'tasks',
				width: 216,
				height: 216,
			},
		});

		/**
		 * @param {any} preset
		 * @returns {boolean}
		 */
		static has(preset)
		{
			return preset instanceof this;
		}

		getTitle()
		{
			return this.value.title;
		}

		getQrTitle()
		{
			return this.value.qrTitle;
		}

		getButtonText()
		{
			return this.value.buttonText || Loc.getMessage('TASKS_UNSUPPORTED_FEATURE_OPEN_WEB');
		}

		getDescription()
		{
			return this.value.description;
		}

		getFootnote()
		{
			return this.value.footnote;
		}

		getImageWidth()
		{
			return this.value.image.width;
		}

		getImageHeight()
		{
			return this.value.image.height;
		}

		getImageUri()
		{
			const { name, folder, moduleId } = this.value.image;

			return makeLibraryImagePath(name, folder, moduleId);
		}

		getItems()
		{
			return this.value.items;
		}

		getRedirectUrl()
		{
			return this.value.redirectUrl;
		}

		hasRedirectUrl()
		{
			return Boolean(this.getRedirectUrl());
		}

		hasFootnote()
		{
			return Boolean(this.getFootnote());
		}

		getTestIdPrefix()
		{
			return this.value.testIdPrefix;
		}
	}

	const UnsupportedFeaturePreset = TasksUnavailableFeaturePreset;

	module.exports = {
		TasksUnavailableFeaturePreset,
		UnsupportedFeaturePreset,
	};
});

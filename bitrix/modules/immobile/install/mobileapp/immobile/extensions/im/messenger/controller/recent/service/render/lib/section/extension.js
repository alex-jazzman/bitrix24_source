/**
 * @module im/messenger/controller/recent/service/render/lib/section
 */
jn.define('im/messenger/controller/recent/service/render/lib/section', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');

	const RecentSection = {
		general: {
			title: '',
			id: 'general',
			backgroundColor: '#ffffff',
			sortItemParams: { order: 'desc' },
		},
		pinned: {
			title: '',
			id: 'pinned',
			backgroundColor: '#ffffff',
			sortItemParams: { order: 'desc' },
		},
		call: {
			title: '',
			id: 'call',
			backgroundColor: '#ffffff',
			sortItemParams: { order: 'desc' },
		},
		new: {
			title: Loc.getMessage('IMMOBILE_RECENT_RENDER_SECTION_NEW_TITLE'),
			id: 'new',
			backgroundColor: '#ffffff',
			sortItemParams: { order: 'asc' },
		},
		work: {
			title: Loc.getMessage('IMMOBILE_RECENT_RENDER_SECTION_WORK_TITLE'),
			id: 'work',
			backgroundColor: '#ffffff',
			sortItemParams: { order: 'asc' },
		},
		answered: {
			title: Loc.getMessage('IMMOBILE_RECENT_RENDER_SECTION_ANSWERED_TITLE'),
			id: 'answered',
			backgroundColor: '#ffffff',
			sortItemParams: { order: 'desc' },
		},
	};

	module.exports = { RecentSection };
});

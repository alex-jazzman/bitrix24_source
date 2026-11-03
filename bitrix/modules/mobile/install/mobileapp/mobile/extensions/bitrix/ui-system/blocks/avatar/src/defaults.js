/**
 * @module ui-system/blocks/avatar/src/defaults
 */
jn.define('ui-system/blocks/avatar/src/defaults', (require, exports, module) => {
	// Shared by both entry points: Avatar() goes through the wrapper, while AvatarClass.getAvatar()
	// builds the view directly (avatar-stack, ProjectAvatar, tests), so both classes need the same
	// defaults and a single source keeps them from drifting. withRedux belongs to the wrapper only:
	// the view does not read it.
	// frozen because the view assigns this very object to its defaultProps: without the freeze a
	// write to AvatarView.defaultProps would silently change the defaults of the wrapper as well
	const commonDefaultProps = Object.freeze({
		size: 32,
		icon: null,
		outline: null,
		useLetterImage: true,
		backBorderWidth: null,
	});

	module.exports = { commonDefaultProps };
});

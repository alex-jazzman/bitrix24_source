/**
 * @module tasks/ui/avatars/project-avatar
 */
jn.define('tasks/ui/avatars/project-avatar', (require, exports, module) => {
	const {
		AvatarClass,
		AvatarEntityType,
		AvatarShape,
		AvatarAccentGradient,
		AvatarAccentType,
	} = require('ui-system/blocks/avatar');
	const { Color } = require('tokens');
	const { reduxConnect } = require('tasks/ui/avatars/project-avatar/src/providers/redux');
	const { projectSelectorDataProvider } = require('tasks/ui/avatars/project-avatar/src/providers/selector');

	const getProjectAvatarAccent = (hasCollabers) => {
		return hasCollabers
			? {
				gradient: AvatarAccentGradient.GREEN,
				type: AvatarAccentType.GREEN,
				color: Color.accentMainSuccess,
			}
			: {
				gradient: AvatarAccentGradient.BLUE,
				type: AvatarAccentType.BLUE,
				color: Color.accentMainPrimary,
			};
	};

	const resolveHasCollabers = (hasCollabers) => {
		return hasCollabers === true || hasCollabers === 'Y';
	};

	const resolveProjectAvatarProps = (props) => {
		const {
			hasCollabers,
			accentGradient,
			accentType,
			accentColor,
			...restProps
		} = props;

		if (hasCollabers === null || hasCollabers === undefined)
		{
			return props;
		}

		const accent = getProjectAvatarAccent(resolveHasCollabers(hasCollabers));

		return {
			...restProps,
			accentGradient: accentGradient ?? accent.gradient,
			accentType: accentType ?? accent.type,
			accentColor: accentColor ?? accent.color,
		};
	};

	/**
	 * @class ProjectAvatar
	 */
	class ProjectAvatar extends AvatarClass
	{
		static getAvatar = (props) => {
			return AvatarClass.getAvatar(resolveProjectAvatarProps(props));
		};

		render()
		{
			if (this.withRedux())
			{
				return this.getStateConnector()(ProjectAvatar.getAvatar)(this.props);
			}

			return ProjectAvatar.getAvatar(this.props);
		}

		static resolveEntitySelectorParams(params)
		{
			const {
				onUriLoadFailure,
				onAvatarClick,
				...restParams
			} = projectSelectorDataProvider(params);

			return restParams;
		}

		getStateConnector()
		{
			return reduxConnect;
		}
	}

	module.exports = {
		AvatarShape,
		AvatarAccentGradient,
		AvatarEntityType,
		getProjectAvatarAccent,
		ProjectAvatarClass: ProjectAvatar,
		ProjectAvatar: (props) => new ProjectAvatar(props),
	};
});

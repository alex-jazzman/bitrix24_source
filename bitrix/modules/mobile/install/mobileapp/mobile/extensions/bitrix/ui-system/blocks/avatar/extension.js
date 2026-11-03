/**
 * @module ui-system/blocks/avatar
 */
jn.define('ui-system/blocks/avatar', (require, exports, module) => {
	const { Color } = require('tokens');
	const { PropTypes } = require('utils/validation');
	const { PureComponent } = require('layout/pure-component');
	const { reduxConnect } = require('ui-system/blocks/avatar/src/providers/redux');
	const { AvatarView } = require('ui-system/blocks/avatar/src/elements/avatar-view');
	const {
		selectorDataProvider,
		SelectorDataProviderClass,
	} = require('ui-system/blocks/avatar/src/providers/selector');
	const { AvatarShape } = require('ui-system/blocks/avatar/src/enums/shape');
	const { commonDefaultProps } = require('ui-system/blocks/avatar/src/defaults');
	const { EmptyAvatar } = require('ui-system/blocks/avatar/src/enums/empty-avatar');
	const { AvatarEntityType } = require('ui-system/blocks/avatar/src/enums/entity-type');
	const { AvatarAccentGradient } = require('ui-system/blocks/avatar/src/enums/accent-gradient');
	const { AvatarAccentType } = require('ui-system/blocks/avatar/src/enums/accent-type');

	/**
	 * @extends {PureComponent<AvatarComponentProps>}
	 */
	class Avatar extends PureComponent
	{
		/**
		 * @param {boolean} rounded
		 * @param {number} size
		 * @return {number}
		 */
		static resolveBorderRadius(rounded, size)
		{
			return AvatarView.resolveBorderRadius(rounded, size);
		}

		/**
		 * @param {AvatarSelectorParams} params
		 * @return {Partial<AvatarComponentProps>}
		 */
		static resolveEntitySelectorParams(params)
		{
			const {
				onUriLoadFailure,
				onAvatarClick,
				...restParams
			} = selectorDataProvider(params);

			return restParams;
		}

		/**
		 * @return {AvatarRendered}
		 */
		render()
		{
			if (this.withRedux())
			{
				return this.#renderWithRedux();
			}

			return Avatar.getAvatar(this.props);
		}

		/**
		 * @return {AvatarConnected}
		 */
		#renderWithRedux()
		{
			const stateConnector = this.getStateConnector();

			return stateConnector(Avatar.getAvatar)(this.props);
		}

		/**
		 * @param {AvatarComponentProps} props
		 * @return {AvatarView}
		 */
		static getAvatar = (props) => {
			const {
				entityType,
				emptyAvatar: paramsEmptyAvatar,
				...restParams
			} = props;

			const {
				placeholder,
				...restEntityParams
			} = AvatarEntityType.resolveType(entityType).getValue();

			return new AvatarView({
				...restEntityParams,
				...restParams,
				placeholder: {
					...placeholder,
					emptyAvatar: paramsEmptyAvatar || placeholder.emptyAvatar,
				},
			});
		};

		/**
		 * @return {boolean}
		 */
		withRedux()
		{
			const { withRedux } = this.props;

			return Boolean(withRedux);
		}

		/**
		 * @return {AvatarStateConnector}
		 */
		getStateConnector()
		{
			return reduxConnect;
		}
	}

	// Avatar is the public component: it reads withRedux, so the defaults have to reach it and not
	// only the view, which keeps its own pair next to its class
	Avatar.defaultProps = {
		...commonDefaultProps,
		withRedux: true,
	};

	Avatar.propTypes = {
		testId: PropTypes.string.isRequired,
		id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		uri: PropTypes.string,
		name: PropTypes.string,
		size: PropTypes.number,
		outline: PropTypes.number,
		backBorderWidth: PropTypes.number,
		shape: PropTypes.instanceOf(AvatarShape),
		entityType: PropTypes.instanceOf(AvatarEntityType),
		// the view resolves a filled string as a ready path and an object as a library entry
		emptyAvatar: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.shape({
				uri: PropTypes.string,
				named: PropTypes.instanceOf(EmptyAvatar),
			}),
		]),
		accent: PropTypes.bool,
		accentType: PropTypes.instanceOf(AvatarAccentType),
		accentColor: PropTypes.instanceOf(Color),
		accentGradient: PropTypes.instanceOf(AvatarAccentGradient),
		accentGradientColors: PropTypes.arrayOf(PropTypes.string),
		backgroundColor: PropTypes.instanceOf(Color),
		useLetterImage: PropTypes.bool,
		withRedux: PropTypes.bool,
		icon: PropTypes.object,
		style: PropTypes.object,
		forwardRef: PropTypes.func,
		onClick: PropTypes.func,
	};

	module.exports = {
		/**
		 * @param {AvatarComponentProps} props
		 * @return {Avatar}
		 */
		Avatar: (props) => new Avatar(props),
		AvatarClass: Avatar,
		// Props contract of the rendered view, so composite blocks describe an avatar without copying it
		propTypes: AvatarView.propTypes,
		AvatarShape,
		AvatarEntityType,
		AvatarAccentType,
		AvatarAccentGradient,
		SelectorDataProviderClass,
	};
});

/**
 * @module layout/ui/gratitude-list/src/gratitude
 */
jn.define('layout/ui/gratitude-list/src/gratitude', (require, exports, module) => {
	const { Component, Indent, Color } = require('tokens');
	const { GratitudeIcon } = require('assets/icons');
	const { Text2, Text5, Text6 } = require('ui-system/typography/text');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { connect } = require('statemanager/redux/connect');
	const { usersSelector } = require('statemanager/redux/slices/users');
	const { PureComponent } = require('layout/pure-component');
	const {
		selectNameById,
		selectRelatedPostIdById,
		selectCreatedAtById,
		selectTitleById,
	} = require('statemanager/redux/slices/gratitude');

	const BADGE_SIZE = {
		width: 40,
		height: 40,
	};

	class GratitudeView extends PureComponent
	{
		get #postId()
		{
			return this.props.postId ?? null;
		}

		get #showBorder()
		{
			return this.props.showBorder ?? false;
		}

		get #authorId()
		{
			return this.props.author?.id ?? null;
		}

		get #authorName()
		{
			return this.props.author.fullName ?? '';
		}

		get #authorImage()
		{
			return this.props.author.avatarSize100 ?? '';
		}

		get #title()
		{
			return this.props.title ?? '';
		}

		get #gratitudeImageUri()
		{
			const { name } = this.props;

			return name ? GratitudeIcon.getSvgUriByName(name) : '';
		}

		get #gratitudeCreatedAt()
		{
			const { createdAt } = this.props;

			return createdAt
				? new Date(createdAt * 1000).toLocaleDateString('en-GB').replaceAll('/', '.')
				: ''
			;
		}

		getTestId(suffix)
		{
			const prefix = this.props.testId ?? '';

			return suffix ? `${prefix}-${suffix}` : prefix;
		}

		render()
		{
			return View(
				{
					testId: this.getTestId(),
					style: {
						flexDirection: 'row',
						alignItems: 'flex-start',
						justifyContent: 'flex-start',
						paddingHorizontal: Component.paddingLr.toNumber(),
						paddingBottom: Indent.L.toNumber(),
					},
					onClick: () => this.props.itemDetailOpenHandler(this.#postId),
				},
				this.renderBadge(),
				this.renderContent(),
			);
		}

		renderBadge()
		{
			return Image({
				testId: this.getTestId('badge'),
				style: {
					...BADGE_SIZE,
					marginTop: Indent.XL.toNumber(),
				},
				svg: {
					uri: this.#gratitudeImageUri,
				},
			});
		}

		renderContent()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'flex-start',
						justifyContent: 'flex-start',
						position: 'relative',
						width: '95%',
						paddingTop: Indent.XL.toNumber(),
					},
				},
				this.renderTextBlock(),
				this.renderDate(),
				this.#showBorder && this.renderBorder(),
			);
		}

		renderBorder()
		{
			return View({
				style: {
					position: 'absolute',
					height: 1,
					width: '97%',
					backgroundColor: Color.bgSeparatorSecondary.toHex(),
					top: 0,
					right: 0,
				},
			});
		}

		renderTextBlock()
		{
			return View(
				{
					style: {
						flexDirection: 'column',
						alignItems: 'flex-start',
						justifyContent: 'flex-start',
						maxWidth: 210,
						marginHorizontal: Indent.XL2.toNumber(),
					},
				},
				this.renderTitle(),
				this.renderAuthor(),
			);
		}

		renderTitle()
		{
			return Text2({
				testId: this.getTestId('title'),
				text: this.#title,
				numberOfLines: 3,
				ellipsize: 'end',
				color: Color.base0.toHex(),
				style: {
					marginBottom: 5,
				},
			});
		}

		renderAuthor()
		{
			return View(
				{
					testId: this.getTestId(`author-${this.#authorId}`),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'flex-start',
					},
				},
				Avatar({
					id: this.#authorId,
					testId: this.getTestId(`author-${this.#authorId}-avatar`),
					name: this.#authorName,
					size: 18,
					uri: this.#authorImage,
					rounded: true,
					withRedux: true,
				}),
				Text6({
					testId: this.getTestId(`author-${this.#authorId}-name`),
					text: this.#authorName,
					numberOfLines: 1,
					ellipsize: 'end',
					color: Color.base4,
					style: {
						marginLeft: Indent.XS.toNumber(),
					},
				}),
			);
		}

		renderDate()
		{
			return Text5({
				testId: this.getTestId('date'),
				text: this.#gratitudeCreatedAt,
				color: Color.base3,
				style: {
					position: 'absolute',
					top: 16,
					right: 20,
				},
			});
		}
	}

	const mapStateToProps = (state, ownProps) => {
		const author = usersSelector.selectById(state, ownProps.authorId);
		const name = selectNameById(state, ownProps.id);
		const title = selectTitleById(state, ownProps.id);
		const createdAt = selectCreatedAtById(state, ownProps.id);
		const postId = selectRelatedPostIdById(state, ownProps.id);

		return {
			author,
			name,
			title,
			postId,
			createdAt,
		};
	};

	module.exports = {
		ReduxGratitudeView: connect(mapStateToProps)(GratitudeView),
		GratitudeView: (props) => new GratitudeView(props),
	};
});

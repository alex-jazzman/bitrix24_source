/*
* @module call/calls/layout/floor-requests-list
*/
jn.define('call/calls/layout/floor-requests-list', (require, exports, module) => {
	const { Color, Corner } = require('tokens');
	const { Avatar } = require('ui-system/blocks/avatar');
	const Utils = require('src/util');

	const Events = {
		onRequestFloor: 'onRequestFloor',
	};

	const Icons = {
		emptyAvatar: '<svg width="55" height="54" viewBox="0 0 55 54" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="27.5" cy="27" r="26.7" fill="#C4C4C4"/><path fill-rule="evenodd" clip-rule="evenodd" d="M24.8275 14.6978C23.8798 13.203 31.7392 11.9567 32.4892 16.3612L32.5183 16.5653C32.7304 17.966 32.7304 19.3895 32.5183 20.7902L32.5867 20.7894C32.8227 20.8016 33.5583 20.9762 32.9875 22.7497L32.8546 23.1586C32.7064 23.592 32.3202 24.513 31.7915 24.2264L31.7946 24.4308C31.7902 24.965 31.6952 26.3813 30.8251 26.667L30.9021 27.8537L31.8025 27.9876L31.8015 28.1998C31.8052 28.4797 31.8304 28.9453 31.9548 29.0148C32.7762 29.5429 33.6766 29.9433 34.6238 30.2014C37.3262 30.8843 38.7429 32.0399 38.8344 33.0749L38.8391 33.1815L39.5901 36.9888C36.3543 38.3389 32.5989 39.1464 28.5826 39.2309H27.1789C23.1717 39.1466 19.4242 38.3425 16.1934 36.998L16.2873 36.3541C16.4186 35.4854 16.573 34.5999 16.7316 33.9845C17.1569 32.3336 19.5496 31.1074 21.7512 30.1646C22.8907 29.6764 23.1375 29.3835 24.2842 28.884C24.3325 28.656 24.3591 28.4244 24.3638 28.1919L24.3612 27.9593L25.3364 27.8441L25.3489 27.8578C25.3754 27.8715 25.4218 27.7921 25.2589 26.7124L25.2019 26.692C24.9764 26.5984 24.156 26.13 24.1122 24.2579L24.0509 24.272C23.8687 24.303 23.3369 24.3106 23.2487 23.3711L23.2386 23.2148C23.2051 22.3624 22.5612 21.617 23.3893 20.9935L23.5116 20.9092L22.9972 19.5438L22.9709 19.2023C22.8993 18.0413 22.825 14.3374 24.8275 14.6978Z" fill="white"/></svg>',
		hand: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" fill="none"><path fill="#FAA72C" fill-rule="evenodd" d="M11.488 4.524c0-.05.031-.154.162-.264a.76.76 0 0 1 .475-.175c.357 0 .584.274.584.495v6.626c0 .35.24.66.596.717a.678.678 0 0 0 .786-.678V6.531c0-.032.024-.127.16-.237a.73.73 0 0 1 .433-.167.73.73 0 0 1 .44.155c.114.092.16.193.16.294v5.431c0 .412.325.684.658.705.17.01.364-.042.518-.19a.709.709 0 0 0 .214-.515l-.002-.343c-.003-.242-.005-.595-.008-1.02l-.01-1.486v-.006c0-.233.078-.35.151-.414a.607.607 0 0 1 .405-.132c.162 0 .325.059.44.165.106.097.206.263.206.558 0 .305.002.606.004.907a84.35 84.35 0 0 1-.004 1.85v.01c-.015.98-.023 1.497-.16 2.446-.075.522-.476 1.807-1.006 2.977-.263.58-.542 1.097-.807 1.459a1.975 1.975 0 0 1-.334.373.428.428 0 0 1-.076.051H9.845a1.243 1.243 0 0 1-.114-.083 5.545 5.545 0 0 1-.541-.523c-.436-.468-.968-1.119-1.518-1.831a80.861 80.861 0 0 1-2.76-3.824.625.625 0 0 1-.087-.292c-.004-.11.026-.17.074-.212.24-.214.415-.224.57-.193.207.041.427.171.703.357.415.279.71.575.919.82.106.123.19.233.263.329l.015.02c.054.071.144.19.232.267l.023.02.022.02h.001v.001c.015.013.053.047.098.079l.002.001a.624.624 0 0 0 .918-.211.75.75 0 0 0 .08-.248c.008-.053.012-.107.014-.155.004-.095.005-.221.004-.374-.005-1.352-.003-3.503-.002-5.092l.001-1.475c0-.537.163-.773.279-.88a.6.6 0 0 1 .384-.157c.112 0 .305.041.452.142.12.082.211.198.211.428v4.357c0 .218.1.412.26.538a.716.716 0 0 0 .862.015.673.673 0 0 0 .278-.545V4.524Zm5.722 2.882a1.92 1.92 0 0 0-.727.14v-.97a1.57 1.57 0 0 0-.608-1.23 1.93 1.93 0 0 0-1.191-.419c-.27 0-.536.066-.775.177V4.58c0-.974-.858-1.695-1.784-1.695-.47 0-.914.178-1.244.454-.327.273-.593.689-.593 1.185v.242a2.086 2.086 0 0 0-.863-.2c-.333 0-.803.112-1.196.474-.41.377-.667.96-.667 1.763v1.47c-.002 1.24-.003 2.824-.001 4.104a5.67 5.67 0 0 0-.72-.572c-.262-.176-.665-.443-1.137-.538-.525-.105-1.084.01-1.605.475-.378.338-.486.78-.473 1.149.012.354.134.689.29.92.536.799 1.688 2.441 2.806 3.888.558.721 1.116 1.406 1.59 1.915.235.252.463.476.667.64.103.082.213.16.326.221a.983.983 0 0 0 .459.127h5.734c.328 0 .6-.154.799-.312.204-.163.39-.377.556-.605.334-.457.652-1.058.93-1.671.55-1.216 1.002-2.618 1.1-3.301.148-1.024.157-1.605.173-2.586v-.022c.01-.657.007-1.284.004-1.893a154.92 154.92 0 0 1-.004-.883c0-.606-.224-1.101-.593-1.44a1.857 1.857 0 0 0-1.253-.483Z" clip-rule="evenodd"/></svg>',
		handWhite: '<svg xmlns="http://www.w3.org/2000/svg" width="29" height="28" fill="none"><path fill="#fff" fill-rule="evenodd" d="M13.902 4.695c0-.06.037-.18.19-.308a.887.887 0 0 1 .554-.204c.416 0 .681.32.681.577v7.73c0 .408.28.77.696.836a.79.79 0 0 0 .917-.79v-5.5c0-.036.027-.148.186-.276a.85.85 0 0 1 .505-.195c.176 0 .37.067.512.181.134.108.188.225.188.343v6.336c0 .48.379.798.767.822a.8.8 0 0 0 .606-.222.827.827 0 0 0 .249-.6l-.003-.4a778.6 778.6 0 0 1-.009-1.19l-.012-1.734v-.007c0-.271.091-.407.177-.483a.709.709 0 0 1 .472-.153c.19 0 .38.068.514.192.123.113.24.307.24.65 0 .357.002.707.004 1.058.004.702.008 1.407-.004 2.159v.011c-.018 1.144-.027 1.747-.187 2.854-.088.61-.555 2.108-1.174 3.473-.307.677-.632 1.28-.94 1.703a2.308 2.308 0 0 1-.39.435.507.507 0 0 1-.09.06h-6.565c-.03-.02-.075-.05-.133-.098a6.486 6.486 0 0 1-.632-.61c-.508-.546-1.129-1.305-1.77-2.136a94.384 94.384 0 0 1-3.221-4.461.73.73 0 0 1-.1-.34c-.005-.128.03-.199.085-.248.28-.25.484-.262.664-.225.242.048.5.2.821.416.485.326.828.672 1.073.957.123.144.22.272.306.383l.018.024c.063.083.169.222.27.311l.027.024.026.023.001.001c.018.016.062.056.115.092l.002.002c.036.025.2.14.437.137a.727.727 0 0 0 .634-.384.878.878 0 0 0 .093-.289c.01-.062.014-.125.016-.18a9.42 9.42 0 0 0 .005-.437 1548.2 1548.2 0 0 1-.002-5.94l.002-1.721c0-.627.19-.902.325-1.026a.699.699 0 0 1 .448-.184c.13 0 .355.048.527.166.139.095.246.23.246.498v5.084c0 .254.117.481.304.628a.831.831 0 0 0 .506.176.834.834 0 0 0 .5-.158.785.785 0 0 0 .323-.637V4.695Zm6.676 3.363c-.283 0-.574.05-.848.162V7.09c0-.62-.311-1.114-.71-1.434a2.251 2.251 0 0 0-1.389-.49 2.16 2.16 0 0 0-.904.206V4.76c0-1.136-1-1.977-2.081-1.977-.549 0-1.067.208-1.452.53-.38.318-.692.803-.692 1.382v.282a2.434 2.434 0 0 0-1.006-.233c-.388 0-.937.131-1.396.553-.478.44-.777 1.12-.777 2.057L9.32 9.068c0 1.447-.003 3.296 0 4.79a6.611 6.611 0 0 0-.84-.67c-.306-.204-.776-.516-1.326-.626-.612-.123-1.265.01-1.873.554-.441.394-.567.91-.552 1.34.015.413.157.804.338 1.073a95.72 95.72 0 0 0 3.274 4.536c.651.842 1.302 1.641 1.855 2.234.274.295.54.556.779.748.12.095.247.187.38.258.12.064.31.148.535.148h6.69c.382 0 .7-.18.931-.365.238-.19.455-.439.65-.705.389-.534.76-1.235 1.084-1.95.643-1.419 1.17-3.055 1.285-3.851.172-1.195.183-1.873.2-3.017l.001-.026c.012-.766.008-1.498.004-2.209-.002-.347-.004-.69-.004-1.03 0-.706-.261-1.284-.692-1.68a2.166 2.166 0 0 0-1.462-.562Z" clip-rule="evenodd"/></svg>',
	};

	const Styles = {
		body: {
			paddingTop: 12,
			flex: 1,
			backgroundColor: Color.bgContentPrimary.toHex(),
		},
		title: {
			textAlign: 'center',
			fontSize: 17,
			fontWeight: 500,
			lineHeight: 21,
		},
		separator: {
			width: '100%',
			height: 1,
			backgroundColor: Color.bgSeparatorSecondary.toHex(),
		},
		usersContainer: {
			marginTop: 11,
			width: '100%',
		},
		userRow: {
			flexDirection: 'row',
			height: 70,
			width: '100%',
		},
		userRowInner: {
			paddingRight: 18,
			flexDirection: 'row',
			flex: 1,
			alignItems: 'center',
		},
		userName: {
			fontSize: 17,
			fontWeight: 400,
			lineHeight: 23,
			color: Color.base1.toHex(),
		},
		userPosition: {
			fontSize: 13,
			fontWeight: 400,
			lineHeight: 16,
			color: Color.base3.toHex(),
		},
		bottom: {
			marginLeft: 24,
			marginRight: 24,
			marginBottom: device.screen.safeArea.bottom + 12,
			height: 42,
			flexDirection: 'row',
			borderRadius: Corner.M.toNumber(),
			backgroundColor: Color.accentMainWarning.toHex(),
			alignContent: 'center',
			alignItems: 'center',
			justifyContent: 'center',
		},
		button: {
			marginLeft: 4,
			fontSize: 17,
			fontWeight: 500,
			lineHeight: 23,
			color: Color.baseWhiteFixed.toHex(),
		},

	};

	class FloorRequestsList extends LayoutComponent
	{
		constructor(props = {})
		{
			super(props);
			this.state = {
				userList: props.userList,
			};

			if (typeof props[Events.onRequestFloor] === 'function')
			{
				this.on(Events.onRequestFloor, props.onRequestFloor);
			}
		}

		render()
		{
			const users = this.state.userList.map((userModel) => this.renderUser(
				userModel.avatar,
				userModel.name,
				userModel.getDescription(),
				userModel.id,
			));

			return View(
				{
					style: Styles.body,
				},
				Text({
					style: Styles.title,
					text: BX.message('MOBILE_CALL_FLOOR_REQUEST_LIST_TITLE'),
				}),
				ScrollView(
					{
						style: { flex: 1 },
					},
					View(
						{ style: Styles.usersContainer },
						...users,
					),
				),
				View(
					{
						style: Styles.bottom,
						onClick: () => this.emit(Events.onRequestFloor),
					},
					Image(
						{
							style: { height: 28, width: 28 },
							svg: { content: Icons.handWhite },
						},
					),
					Text({
						style: Styles.button,
						text: BX.message('MOBILE_CALL_FLOOR_REQUEST_LIST_BUTTON'),
					}),
				),
			);
		}

		renderUser(avatarPath, name, title, id)
		{
			const avatar = Avatar({
				testId: 'floor-request-list-avatar',
				uri: encodeURI(avatarPath),
				name: BX.utils.html.htmlDecode(name),
				size: 40,
				backgroundColor: Utils.convertHexToColorEnum(CallUtil.userData[id].color),
			});

			return View(
				{
					style: Styles.userRow,
				},
				View(
					{
						style: {
							marginLeft: 19,
							marginRight: 12,
							alignSelf: 'center',
						},
					},
					avatar,
				),
				View(
					{
						style: { flex: 1, width: '100%', flexDirection: 'column' },
					},

					View(
						{
							style: Styles.userRowInner,
						},
						View(
							{
								style: { flex: 1, flexDirection: 'column', justifyContent: 'center' },
							},
							Text({
								style: Styles.userName,
								numberOfLines: 1,
								ellipsize: 'end',
								text: name,
							}),
							Text({
								style: Styles.userPosition,
								numberOfLines: 1,
								ellipsize: 'end',
								text: title,
							}),
						),
						Image({
							style: {
								width: 24, height: 25,
							},
							svg: { content: Icons.hand },
						}),
					),
					View({ style: Styles.separator }),
				),
			);
		}
	}

	module.exports = {
		FloorRequestsList,
	};
});

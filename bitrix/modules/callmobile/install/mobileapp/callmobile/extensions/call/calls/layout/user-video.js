/*
* @module call/calls/layout/floor-requests-list
*/
jn.define('call/calls/layout/user-video', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');

	const styles = {
		videoContainer: {
			objectFit: 'contain',
			backgroundResizeMode: 'cover',
			width: '100%',
			height: '100%',
		},
		remoteVideo: {
			position: 'absolute',
			width: '100%',
			height: '100%',
			flex: 1,
		},
	}

	class UserVideo extends PureComponent
	{
		constructor(props = {})
		{
			super(props);
		}

		shouldComponentUpdate(nextProps)
		{
			if (this.props.stream !== nextProps.stream) return true;
			if (this.props.isLocal !== nextProps.isLocal) return true;
			return false;
		}

		getStream(stream, isLocal = false, scale = true)
		{
			const rendererParams = {};
			if ('getVideoTracks' in stream)
			{
				rendererParams.source = stream.getVideoTracks()[0];
			}
			else
			{
				rendererParams.source = stream;
			}

			return VideoRenderer({
				testId: `callsRemoteVideo_${this.props.id}`,
				resizeMode: 'center', // ? do we need it?
				mirror: isLocal,
				style: {
					backgroundResizeMode: 'cover',
					position: 'absolute',
					width: '100%',
					height: '100%',
					flex: 1,
				},
				...rendererParams,
				local: scale,
			});
		}

		render()
		{
			return View(
				{
					style: {
						...styles.videoContainer,
						borderRadius: 10,
					},
					clickable: false,
				},
				this.props.stream && this.getStream(this.props.stream, this.props.isLocal),
			);
		}

	}

	module.exports = {
		UserVideo,
	};
});

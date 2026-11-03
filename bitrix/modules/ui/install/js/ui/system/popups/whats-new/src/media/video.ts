import { Dom, Loc, Tag } from 'main.core';
import { Icon, Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';

import { type WhatsNewVideo } from '../types';

import './media.css';

const BLOCK_CLASS = 'ui-system-whats-new-video';

// The mark of the backing frame, of the size the mockup draws it in.
const PLAY_ICON_SIZE = 48;

// The frame the video is embedded into: everything an embedded player of any platform asks for, and nothing
// of the playback itself. The address comes from the consumer, and what it plays is the business of the
// platform behind it.
const FRAME_PERMISSIONS = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

/**
 * The backing frame of the video: the picture of the consumer with the mark of the play over it. It lies
 * under the embedded frame and shows through it for as long as the embedded one has nothing to draw - in a
 * corporate network an outer address often never arrives, and the picture is then what stands in the place
 * of the video.
 *
 * It is the embedded frame that covers this one, and nothing is switched over on loading: a switch would
 * take the backing frame away exactly when a failed load reports itself, and it would blink on a load that
 * went fast.
 *
 * A video named no picture gets no backing frame at all. There would be nothing to back it with: the mark of
 * the play alone, with no picture under it, is not a screen but a sign standing on the card.
 */
const renderPoster = (poster: string): HTMLElement => {
	/*
	 * The mark stands over a picture of the consumer, so its colour is the one that stays white on any
	 * surface and in any theme, and it is asked for by the option of the icon: the internal variable of the
	 * set belongs to another component.
	 */
	const icon: HTMLElement = new Icon({
		icon: Outline.PLAY_L,
		size: PLAY_ICON_SIZE,
		color: 'var(--ui-color-base-white-fixed)',
	}).render();

	const picture: HTMLElement = Dom.create('img', {
		props: { className: `${BLOCK_CLASS}__poster-image`, src: poster, alt: '' },
	});

	return Tag.render`
		<div class="${BLOCK_CLASS}__poster" aria-hidden="true" data-testid="announce-dialog-video-poster">
			${picture}
			<span class="${BLOCK_CLASS}__poster-mark">${icon}</span>
		</div>
	`;
};

// The address arrives as a property of the node and never as a substitution in the markup: a property is
// assigned to the node and never parsed, whatever the place the substitution would have stood in.
const renderFrame = (src: string): HTMLElement => {
	return Dom.create('iframe', {
		props: {
			className: `${BLOCK_CLASS}__frame`,
			src,
			// A frame is a document of its own and is named as one: left unnamed, it is read out to
			// assistive technology by its address.
			title: Loc.getMessage('UI_SYSTEM_WHATS_NEW_VIDEO_ARIA') ?? '',
			allowFullscreen: true,
		},
		attrs: { allow: FRAME_PERMISSIONS },
		dataset: { testid: 'announce-dialog-video-frame' },
	});
};

/**
 * The video of the announcement, standing in the media zone of the card: an embedded frame of the proportion
 * of a screen, with the backing frame under it.
 *
 * The address is the business of the consumer: the component neither asks which platform it leads to nor
 * adds parameters of playback of its own.
 */
export const renderVideo = (video: WhatsNewVideo): HTMLElement => {
	return Tag.render`
		<div class="${BLOCK_CLASS}" data-testid="announce-dialog-video">
			<div class="${BLOCK_CLASS}__screen">
				${video.poster === undefined ? '' : renderPoster(video.poster)}
				${renderFrame(video.src)}
			</div>
		</div>
	`;
};

/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Lib = this.BX.Call.Lib || {};
(function (exports) {
	'use strict';

	class MediaStreamRegistry {
		#localStream;
		#renderers;
		#audioElements;
		constructor() {
			this.#localStream = null;
			this.#renderers = new Map();
			this.#audioElements = new Map();
		}
		setLocalStream(stream) {
			this.#localStream = stream ?? null;
		}
		getLocalStream() {
			return this.#localStream;
		}
		removeLocalStream() {
			this.#localStream = null;
		}
		setRenderer(userId, renderer) {
			if (renderer === null || renderer === undefined) {
				this.#renderers.delete(userId);
				return;
			}
			this.#renderers.set(userId, renderer);
		}
		getRenderer(userId) {
			return this.#renderers.get(userId) ?? null;
		}
		removeRenderer(userId) {
			this.#renderers.delete(userId);
		}
		setAudioTrack(userId, track) {
			if (!track) {
				this.removeAudioTrack(userId);
				return;
			}
			let audio = this.#audioElements.get(userId);
			if (!audio) {
				audio = document.createElement('audio');
				audio.autoplay = true;
				audio.style.display = 'none';
				document.body.append(audio);
				this.#audioElements.set(userId, audio);
			}
			audio.srcObject = new MediaStream([track]);
		}
		removeAudioTrack(userId) {
			const audio = this.#audioElements.get(userId);
			if (audio) {
				audio.srcObject = null;
				audio.remove();
				this.#audioElements.delete(userId);
			}
		}
		clear() {
			this.#localStream = null;
			this.#renderers.clear();
			this.#audioElements.forEach(audioElement => {
				const el = audioElement;
				el.srcObject = null;
				el.remove();
			});
			this.#audioElements.clear();
		}
	}
	const mediaStreamRegistry = new MediaStreamRegistry();

	exports.MediaStreamRegistry = mediaStreamRegistry;

})(this.BX.Call.Lib.MediaRegistry = this.BX.Call.Lib.MediaRegistry || {});
//# sourceMappingURL=media-registry.bundle.js.map

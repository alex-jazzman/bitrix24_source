/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events) {
	'use strict';

	const speechConverterEvents = Object.freeze({
		result: 'result',
		start: 'start',
		stop: 'stop',
		error: 'error'
	});
	class SpeechConverter extends main_core_events.EventEmitter {
		#speechRecognition;
		#isRecording;
		constructor(options) {
			if (SpeechConverter.isBrowserSupport() === false) {
				throw new Error('Your browser don\'t support WebSpeechAPI. Please, use last version of Chrome or Safari');
			}
			super();
			this.setEventNamespace('AI:SpeechConverter');
			this.#isRecording = false;
			this.#initSpeechRecognition();
		}
		static isBrowserSupport() {
			return Boolean(window.webkitSpeechRecognition || window.SpeechRecognition);
		}
		start() {
			this.#speechRecognition.start();
		}
		stop() {
			this.#speechRecognition.stop();
		}
		isRecording() {
			return this.#isRecording;
		}
		#initSpeechRecognition() {
			if (window.webkitSpeechRecognition) {
				// eslint-disable-next-line new-cap
				this.#speechRecognition = new window.webkitSpeechRecognition();
			} else if (window.SpeechRecognition) {
				this.#speechRecognition = new window.SpeechRecognition();
			}
			this.#speechRecognition.lang = main_core.Loc.getMessage('LANGUAGE_ID') || 'en';
			this.#speechRecognition.continuous = true;
			this.#speechRecognition.interimResults = true;
			this.#speechRecognition.maxAlternatives = 1;
			main_core.bind(this.#speechRecognition, 'start', this.#handleStartEvent.bind(this));
			main_core.bind(this.#speechRecognition, 'end', this.#handleEndEvent.bind(this));
			main_core.bind(this.#speechRecognition, 'error', this.#handleErrorEvent.bind(this));
			main_core.bind(this.#speechRecognition, 'result', this.#handleResultEvent.bind(this));
		}
		#handleStartEvent() {
			this.#isRecording = true;
			this.emit(speechConverterEvents.start);
		}
		#handleEndEvent() {
			this.#isRecording = false;
			this.emit(speechConverterEvents.stop);
		}
		#handleErrorEvent(e) {
			const event = new main_core_events.BaseEvent({
				data: {
					error: e.error,
					message: e.message
				}
			});
			this.emit(speechConverterEvents.error, event);
		}
		#handleResultEvent(e) {
			const event = new main_core_events.BaseEvent({
				data: {
					text: this.#getTextFromResults(e.results)
				}
			});
			this.emit(speechConverterEvents.result, event);
		}
		#getTextFromResults(results) {
			return [...results].reduce((finalResultText, currentResult) => {
				const alternative = currentResult.item(0);
				return `${finalResultText + alternative.transcript} `;
			}, '');
		}
	}

	exports.SpeechConverter = SpeechConverter;
	exports.speechConverterEvents = speechConverterEvents;

})(this.BX.AI = this.BX.AI || {}, BX, BX.Event);
//# sourceMappingURL=speech-converter.bundle.js.map

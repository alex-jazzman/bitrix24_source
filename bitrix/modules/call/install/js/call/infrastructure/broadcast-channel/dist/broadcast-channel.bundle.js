/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports) {
	'use strict';

	class BroadcastRequestChannel {
		channel;
		senderId;
		requests;
		handle = undefined;
		constructor(name) {
			this.channel = new BroadcastChannel(name);
			this.senderId = Math.random().toString(36).slice(2);
			this.requests = new Map();
			this.channel.onmessage = event => {
				const msg = event.data;
				if (msg.type === 'response' && this.requests.has(msg.requestId)) {
					const req = this.requests.get(msg.requestId);
					if (!req.responders.has(msg.senderId)) {
						req.responders.add(msg.senderId);
						req.responses.push(msg.payload);
						if (Date.now() > req.deadline) {
							req.resolve(req.responses);
							this.requests.delete(msg.requestId);
						}
					}
				}
				if (msg.type === 'request' && msg.senderId !== this.senderId) {
					const result = this.handle ? this.handle(msg.payload) : undefined;
					if (result !== undefined) {
						this.channel.postMessage({
							type: 'response',
							requestId: msg.requestId,
							senderId: this.senderId,
							payload: result
						});
					}
				}
			};
		}
		executer(handler) {
			this.handle = handler;
		}
		async broadcastRequest(payload, {
			timeout = 100
		} = {}) {
			const requestId = Math.random().toString(36).slice(2);
			return new Promise(resolve => {
				this.requests.set(requestId, {
					resolve,
					responses: [],
					responders: new Set(),
					deadline: Date.now() + timeout
				});
				this.channel.postMessage({
					type: 'request',
					requestId,
					senderId: this.senderId,
					payload
				});
				setTimeout(() => {
					if (this.requests.has(requestId)) {
						resolve(this.requests.get(requestId).responses);
						this.requests.delete(requestId);
					}
				}, timeout);
			});
		}
		destroy() {
			this.channel.close();
			this.requests.clear();
		}
	}

	exports.BroadcastRequestChannel = BroadcastRequestChannel;

})(this.BX.Call.Infrastructure = this.BX.Call.Infrastructure || {});
//# sourceMappingURL=broadcast-channel.bundle.js.map

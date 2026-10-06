/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events) {
	'use strict';

	const StatusBatchSize = 100;
	const ActiveStatuses = new Set(['running', 'waiting', 'switching', 'blocked', 'cancelling']);
	const TerminalStatuses = new Set(['done', 'cancelled']);
	let pendingStatusRequests = new Map();
	let statusBatchScheduled = false;
	async function requestStatusChunk(ids) {
		const response = await main_core.ajax.runAction('mail.Migration.getStatuses', {
			data: {
				mailboxIds: ids
			}
		});
		return {
			ids,
			statuses: response?.data?.statuses ?? {}
		};
	}
	function requestStatus(mailboxId) {
		return new Promise((resolve, reject) => {
			const requests = pendingStatusRequests.get(mailboxId) ?? [];
			requests.push({
				resolve,
				reject
			});
			pendingStatusRequests.set(mailboxId, requests);
			if (statusBatchScheduled) {
				return;
			}
			statusBatchScheduled = true;
			void Promise.resolve().then(() => {
				statusBatchScheduled = false;
				const batch = pendingStatusRequests;
				pendingStatusRequests = new Map();
				const mailboxIds = [...batch.keys()];
				const chunks = [];
				for (let offset = 0; offset < mailboxIds.length; offset += StatusBatchSize) {
					chunks.push(mailboxIds.slice(offset, offset + StatusBatchSize));
				}
				void Promise.all(chunks.map(ids => requestStatusChunk(ids))).then(responses => {
					responses.forEach(({
						ids,
						statuses
					}) => {
						ids.forEach(id => {
							const listeners = batch.get(id) ?? [];
							if (!Object.prototype.hasOwnProperty.call(statuses, String(id))) {
								const error = new Error(`Migration status for mailbox ${id} is absent.`);
								listeners.forEach(request => request.reject(error));
								return;
							}
							listeners.forEach(request => request.resolve(statuses[String(id)]));
						});
					});
				}).catch(error => {
					batch.forEach(listeners => {
						listeners.forEach(request => request.reject(error));
					});
				});
			});
		});
	}
	function createHiddenStatus(mailboxId) {
		return {
			mailboxId,
			visibility: 'hidden',
			status: null,
			reason: null
		};
	}
	function normalizeStatus(payload) {
		if (!main_core.Type.isObject(payload)) {
			return null;
		}
		const value = payload;
		const mailboxId = Number(value.mailboxId ?? 0);
		const visibility = value.visibility;
		const status = value.status ?? null;
		if (!Number.isInteger(mailboxId) || mailboxId <= 0) {
			return null;
		}
		if (!['hidden', 'active', 'terminal'].includes(visibility)) {
			return null;
		}
		if (visibility === 'hidden' && status !== null) {
			return null;
		}
		if (visibility === 'active' && !ActiveStatuses.has(status)) {
			return null;
		}
		if (visibility === 'terminal' && !TerminalStatuses.has(status)) {
			return null;
		}
		return {
			mailboxId,
			visibility,
			status,
			reason: main_core.Type.isString(value.reason) ? value.reason : null
		};
	}
	class MigrationState {
		#mailboxId;
		#status;
		#active = false;
		#listeners = new Set();
		#listenerSubscriptions = new Map();
		#subscriptionCount = 0;
		#initialization = null;
		#initialized = false;
		#fingerprint = '';
		#pullRevision = 0;
		#retryTimer = null;
		#retryAttempts = 0;
		#destroyed = false;
		#onUnused;
		constructor(mailboxId, onUnused = () => {}) {
			if (!Number.isInteger(mailboxId) || mailboxId <= 0) {
				throw new TypeError('Mailbox id must be a positive integer.');
			}
			this.#mailboxId = mailboxId;
			this.#status = createHiddenStatus(mailboxId);
			this.#fingerprint = this.#getFingerprint(this.#status);
			this.#onUnused = onUnused;
		}
		initialize() {
			if (this.#initialized) {
				return Promise.resolve(this.#status);
			}
			if (this.#initialization) {
				return this.#initialization;
			}
			const pullRevision = this.#pullRevision;
			const initialization = requestStatus(this.#mailboxId).then(status => {
				if (this.#destroyed) {
					return this.#status;
				}
				if (pullRevision === this.#pullRevision) {
					this.#apply(status ?? createHiddenStatus(this.#mailboxId), 'initial');
				}
				this.#initialized = true;
				this.#retryAttempts = 0;
				this.#clearRetry();
				return this.#status;
			}).catch(() => {
				if (!this.#destroyed) {
					this.#scheduleRetry();
				}
				return this.#status;
			}).finally(() => {
				this.#initialization = null;
			});
			this.#initialization = initialization;
			return initialization;
		}
		getStatus() {
			return {
				...this.#status
			};
		}
		isActive() {
			return this.#active;
		}
		isInitialized() {
			return this.#initialized;
		}
		subscribe(listener) {
			this.#listeners.add(listener);
			this.#listenerSubscriptions.set(listener, (this.#listenerSubscriptions.get(listener) ?? 0) + 1);
			this.#subscriptionCount++;
			let subscribed = true;
			return () => {
				if (!subscribed) {
					return;
				}
				subscribed = false;
				this.#subscriptionCount--;
				const listenerSubscriptionCount = (this.#listenerSubscriptions.get(listener) ?? 1) - 1;
				if (listenerSubscriptionCount === 0) {
					this.#listenerSubscriptions.delete(listener);
					this.#listeners.delete(listener);
				} else {
					this.#listenerSubscriptions.set(listener, listenerSubscriptionCount);
				}
				if (this.#subscriptionCount === 0) {
					this.#listeners.clear();
					this.#listenerSubscriptions.clear();
					this.#onUnused(this);
				}
			};
		}
		destroy() {
			this.#destroyed = true;
			this.#clearRetry();
			this.#listeners.clear();
			this.#listenerSubscriptions.clear();
			this.#subscriptionCount = 0;
		}
		applyPull(payload) {
			if (!this.#destroyed && this.#apply(payload, 'pull')) {
				this.#pullRevision++;
				this.#initialized = true;
				this.#retryAttempts = 0;
				this.#clearRetry();
			}
		}
		#apply(payload, source) {
			const status = normalizeStatus(payload);
			if (!status || status.mailboxId !== this.#mailboxId) {
				return false;
			}
			const fingerprint = this.#getFingerprint(status);
			if (fingerprint === this.#fingerprint) {
				if (source === 'pull' && status.visibility === 'terminal' && status.status === 'done') {
					const change = {
						status: {
							...status
						},
						active: false,
						previousActive: this.#active,
						source
					};
					this.#listeners.forEach(listener => listener(change));
					return true;
				}
				return false;
			}
			const previousActive = this.#active;
			this.#status = status;
			this.#fingerprint = fingerprint;
			if (status.visibility === 'hidden') {
				this.#active = false;
				return true;
			}
			const active = status.visibility === 'active';
			if (active) {
				this.#active = true;
			}
			const change = {
				status: {
					...status
				},
				active,
				previousActive,
				source
			};
			this.#listeners.forEach(listener => listener(change));
			if (!active) {
				this.#active = false;
			}
			return true;
		}
		#scheduleRetry() {
			if (this.#retryTimer !== null || this.#retryAttempts >= 3) {
				return;
			}
			this.#retryAttempts++;
			this.#retryTimer = setTimeout(() => {
				this.#retryTimer = null;
				void this.initialize();
			}, 5000 * this.#retryAttempts);
		}
		#clearRetry() {
			if (this.#retryTimer !== null) {
				clearTimeout(this.#retryTimer);
				this.#retryTimer = null;
			}
		}
		#getFingerprint(status) {
			return [status.mailboxId, status.visibility, status.status, status.reason].join('|');
		}
	}

	const PullCommand = 'mailbox_migration_status_changed';
	const states = new Map();
	let pullSubscribed = false;
	const handlePull = event => {
		const [command, payload] = event.getData();
		if (command !== PullCommand || !main_core.Type.isObject(payload)) {
			return;
		}
		const mailboxId = Number(payload.mailboxId ?? 0);
		states.get(mailboxId)?.applyPull(payload);
	};
	function ensurePullSubscription() {
		if (!pullSubscribed) {
			main_core_events.EventEmitter.subscribe('onPullEvent-mail', handlePull);
			pullSubscribed = true;
		}
	}
	function releaseState(mailboxId, state) {
		if (states.get(mailboxId) !== state) {
			return;
		}
		states.delete(mailboxId);
		state.destroy();
		if (states.size === 0 && pullSubscribed) {
			main_core_events.EventEmitter.unsubscribe('onPullEvent-mail', handlePull);
			pullSubscribed = false;
		}
	}
	function getMigrationState(mailboxId) {
		if (!states.has(mailboxId)) {
			ensurePullSubscription();
			states.set(mailboxId, new MigrationState(mailboxId, state => releaseState(mailboxId, state)));
		}
		return states.get(mailboxId);
	}
	function clearMigrationStates() {
		states.forEach(state => state.destroy());
		states.clear();
		if (pullSubscribed) {
			main_core_events.EventEmitter.unsubscribe('onPullEvent-mail', handlePull);
			pullSubscribed = false;
		}
	}

	exports.MigrationState = MigrationState;
	exports.clearMigrationStates = clearMigrationStates;
	exports.getMigrationState = getMigrationState;

})(this.BX.Mail = this.BX.Mail || {}, BX, BX.Event);
//# sourceMappingURL=migration-state.bundle.js.map

import { type BaseEvent, EventEmitter } from 'main.core.events';

import { Analytics } from 'im.v2.lib.analytics';
import { UploadingService } from 'im.v2.provider.service.uploading';

import { type VoiceRecord } from '../types';

type ReturnedVoiceRecord = {
	record: VoiceRecord,
	failure: string,
};

type VoiceRecordInFlight = {
	dialogId: string,
	record: VoiceRecord,
};

const MAX_RECORDS_PER_DIALOG = 3;
const EVENT_NAMESPACE = 'BX.Messenger.v2.Lib.UnsentVoiceRecords';

export class UnsentVoiceRecords extends EventEmitter
{
	static event = {
		onRecordReturned: 'onRecordReturned',
	};

	static instance: ?UnsentVoiceRecords = null;

	#recordsByDialog: Map<string, ReturnedVoiceRecord[]> = new Map();
	#recordsInFlight: Map<string, VoiceRecordInFlight> = new Map();
	#uploadingService: UploadingService;

	static getInstance(): UnsentVoiceRecords
	{
		this.instance ??= new this();

		return this.instance;
	}

	constructor(uploadingService: UploadingService = UploadingService.getInstance())
	{
		super();
		this.setEventNamespace(EVENT_NAMESPACE);

		this.#uploadingService = uploadingService;
		this.#uploadingService.subscribe(
			UploadingService.event.voiceRecordSendFailed,
			this.#onVoiceRecordSendFailed.bind(this),
		);
		this.#uploadingService.subscribe(
			UploadingService.event.voiceRecordSent,
			this.#onVoiceRecordSent.bind(this),
		);
	}

	hold(uploaderId: string, dialogId: string, record: VoiceRecord): void
	{
		this.#recordsInFlight.set(uploaderId, { dialogId, record });
	}

	release(uploaderId: string): ?VoiceRecordInFlight
	{
		const recordInFlight = this.#recordsInFlight.get(uploaderId) ?? null;
		this.#recordsInFlight.delete(uploaderId);

		return recordInFlight;
	}

	push(dialogId: string, record: VoiceRecord, failure: string): void
	{
		const queue = this.#recordsByDialog.get(dialogId) ?? [];
		queue.push({ record, failure });
		while (queue.length > MAX_RECORDS_PER_DIALOG)
		{
			queue.shift();
		}
		this.#recordsByDialog.set(dialogId, queue);

		Analytics.getInstance().voiceRecorder.onSendRecordError(dialogId, failure);
		this.emit(UnsentVoiceRecords.event.onRecordReturned, { dialogId });
	}

	unshift(dialogId: string, record: VoiceRecord, failure: string): void
	{
		const queue = this.#recordsByDialog.get(dialogId) ?? [];
		queue.unshift({ record, failure });
		while (queue.length > MAX_RECORDS_PER_DIALOG)
		{
			queue.pop();
		}
		this.#recordsByDialog.set(dialogId, queue);
	}

	takeNext(dialogId: string): ?ReturnedVoiceRecord
	{
		const queue = this.#recordsByDialog.get(dialogId);
		if (!queue)
		{
			return null;
		}

		const record = queue.shift() ?? null;
		if (queue.length === 0)
		{
			this.#recordsByDialog.delete(dialogId);
		}

		return record;
	}

	hasFor(dialogId: string): boolean
	{
		return this.#recordsByDialog.has(dialogId);
	}

	#onVoiceRecordSendFailed(
		event: BaseEvent<{ uploaderId: string, failure: string }>,
	): void
	{
		const { uploaderId, failure } = event.getData();
		const recordInFlight = this.release(uploaderId);
		if (!recordInFlight)
		{
			return;
		}

		const { dialogId, record } = recordInFlight;
		this.push(dialogId, record, failure);
	}

	#onVoiceRecordSent(event: BaseEvent<{ uploaderId: string }>): void
	{
		this.release(event.getData().uploaderId);
	}
}

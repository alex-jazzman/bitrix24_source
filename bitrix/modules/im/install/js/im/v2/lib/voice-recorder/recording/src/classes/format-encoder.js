import { Event } from 'main.core';

import { TargetFormat } from 'im.v2.lib.voice-recorder';

// aac-lc always carries this many samples in one frame, so one frame is one sample of the container
const SAMPLES_PER_FRAME = 1024;
const UNDETERMINED_LANGUAGE = 0x55C4;
const IDENTITY_MATRIX = [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000];

const BYTES_IN_UINT32 = 4;
const BOX_HEADER_LENGTH = 8;

// the chunk offset box closes the sample table, and the table closes every box above it up to the
// movie: size, type, version with flags, the number of entries and the single entry itself
const CHUNK_OFFSET_BOX_LENGTH = 20;

// a single byte of length covers a descriptor payload below 128 bytes, and the descriptors of an
// audio-only esds stay far below that: a longer one needs the multi-byte form of the length
const MAX_DESCRIPTOR_PAYLOAD = 127;

const MICROSECONDS_IN_SECOND = 1_000_000;

// the samples of the whole recording stay in memory for the length of the stage: at the target rate
// a minute of them costs about 11 MiB, so ten minutes is where the server stage becomes the cheaper
// way to the target format
const MAX_ENCODED_DURATION_MS = 600_000;

// the encoder is fed the recording in slices, because it copies every slice it is handed: a copy of
// the whole recording would double the cost of the stage on its own
const SLICE_SECONDS = 10;

// slices are not handed over faster than they are taken: a queue left to grow holds exactly the copy
// of the whole recording the slicing was meant to avoid
const MAX_QUEUED_SLICES = 2;

// how often an engine that never learned the dequeue event is asked about its queue instead
const QUEUE_POLL_MS = 10;

export type EncodeContext = {
	durationMs?: number,
	isCancelled?: () => boolean,
};

const zeros = (count: number): Uint8Array => new Uint8Array(count);

const bytes = (...values: number[]): Uint8Array => new Uint8Array(values);

const uint16 = (value: number): Uint8Array => bytes((value >>> 8) & 0xFF, value & 0xFF);

const uint32 = (value: number): Uint8Array => bytes(
	(value >>> 24) & 0xFF,
	(value >>> 16) & 0xFF,
	(value >>> 8) & 0xFF,
	value & 0xFF,
);

const ascii = (text: string): Uint8Array => new Uint8Array([...text].map((char) => char.codePointAt(0)));

const concat = (parts: Uint8Array[]): Uint8Array => {
	const result = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
	let offset = 0;

	parts.forEach((part) => {
		result.set(part, offset);
		offset += part.length;
	});

	return result;
};

const uint32Array = (values: number[]): Uint8Array => {
	const result = new Uint8Array(values.length * BYTES_IN_UINT32);
	const view = new DataView(result.buffer);

	values.forEach((value, index) => view.setUint32(index * BYTES_IN_UINT32, value));

	return result;
};

const toBytes = (source: ArrayBuffer | Uint8Array): Uint8Array => {
	return ArrayBuffer.isView(source)
		? new Uint8Array(source.buffer, source.byteOffset, source.byteLength)
		: new Uint8Array(source);
};

const box = (type: string, parts: Uint8Array[]): Uint8Array => {
	const payload = concat(parts);

	return concat([uint32(payload.length + BOX_HEADER_LENGTH), ascii(type), payload]);
};

// every box of an audio-only container is a version 0 one, so only the flags are worth passing
const fullBox = (type: string, flags: number, parts: Uint8Array[] = []): Uint8Array => {
	return box(type, [bytes(0, (flags >>> 16) & 0xFF, (flags >>> 8) & 0xFF, flags & 0xFF), ...parts]);
};

const descriptor = (tag: number, parts: Uint8Array[]): Uint8Array => {
	const payload = concat(parts);

	if (payload.length > MAX_DESCRIPTOR_PAYLOAD)
	{
		// a length written in one byte would describe a different stream, and a container carrying
		// it plays nowhere: the stage gives up instead, and the recording goes to the server one
		throw new Error('the descriptor does not fit a single-byte length');
	}

	return concat([bytes(tag, payload.length), payload]);
};

const nextPoll = (): Promise<void> => new Promise((resolve) => {
	setTimeout(resolve, QUEUE_POLL_MS);
});

// a timer is clamped to about a second in a background tab, which would stretch a long
// recording by that clamp once per slice; the encoder reports the freed queue itself. An engine
// without the event is still polled: a wait for an event that never arrives would hold the stage
const hasDequeueEvent = (encoder: AudioEncoder): boolean => 'ondequeue' in encoder;

export class FormatEncoder
{
	// the second stage of format delivery. A stage that cannot finish returns null: such a recording
	// goes to the server stage instead of leaving a broken file in the chat
	static async encode(source: Blob, context: EncodeContext = {}): Promise<?Blob>
	{
		const { durationMs = 0, isCancelled = () => false } = context;

		if (durationMs > MAX_ENCODED_DURATION_MS)
		{
			return null;
		}

		try
		{
			const samples = await this.#decodeToTargetSamples(source);
			if (isCancelled())
			{
				return null;
			}

			const { frames, codecDescription } = await this.#encodeFrames(samples, isCancelled);

			if (isCancelled() || frames.length === 0 || !codecDescription)
			{
				return null;
			}

			return new Blob(this.#buildFileParts(frames, codecDescription), { type: TargetFormat.mimeType });
		}
		catch
		{
			return null;
		}
	}

	// decoding runs at the target sample rate and channel count, so the encoder gets exactly what it expects
	static async #decodeToTargetSamples(source: Blob): Promise<Float32Array>
	{
		const { sampleRate, numberOfChannels } = TargetFormat.codecConfig;
		const decoded = await new OfflineAudioContext(numberOfChannels, 1, sampleRate)
			.decodeAudioData(await source.arrayBuffer());

		// decoding brings the target sample rate but leaves the channels the recording was made with:
		// the second pass is for mixing down alone, so an already mono recording skips it and its copy
		if (decoded.numberOfChannels === numberOfChannels)
		{
			return decoded.getChannelData(0);
		}

		const context = new OfflineAudioContext(numberOfChannels, decoded.length, sampleRate);
		const player = context.createBufferSource();
		player.buffer = decoded;
		player.connect(context.destination);
		player.start();

		const rendered = await context.startRendering();

		return rendered.getChannelData(0);
	}

	static async #encodeFrames(
		samples: Float32Array,
		isCancelled: () => boolean,
	): Promise<{ frames: Uint8Array[], codecDescription: ?Uint8Array }>
	{
		const { sampleRate, numberOfChannels } = TargetFormat.codecConfig;
		const frames = [];
		let codecDescription = null;
		let failure = null;
		// an encoder that died takes nothing off its queue any more, so the wait for room in it is
		// woken by the failure as well - otherwise the stage would stand on an event never to come
		let wakeQueueWait = null;

		const encoder = new AudioEncoder({
			output: (chunk: EncodedAudioChunk, metadata: { decoderConfig?: { description?: ArrayBuffer } }) => {
				const frame = new Uint8Array(chunk.byteLength);
				chunk.copyTo(frame);
				frames.push(frame);

				// the codec description comes once, with the first frame - the container stores it as is
				const description = metadata?.decoderConfig?.description;
				if (description && !codecDescription)
				{
					codecDescription = toBytes(description);
				}
			},
			error: (error: Error) => {
				failure = error;
				wakeQueueWait?.();
			},
		});

		encoder.configure(TargetFormat.codecConfig);

		const isStopped = () => Boolean(failure) || isCancelled();
		const takesDequeueEvent = hasDequeueEvent(encoder);

		const awaitQueueChange = (): Promise<void> => {
			if (!takesDequeueEvent)
			{
				return nextPoll();
			}

			return new Promise((resolve) => {
				const stopWaiting = () => {
					Event.unbind(encoder, 'dequeue', stopWaiting);
					wakeQueueWait = null;
					resolve();
				};

				wakeQueueWait = stopWaiting;
				Event.bind(encoder, 'dequeue', stopWaiting);
			});
		};

		// an engine that reports no queue size takes the slices as fast as it can, which is how the
		// stage worked before it was sliced at all
		const awaitFreeQueue = async () => {
			while (encoder.encodeQueueSize > MAX_QUEUED_SLICES && !isStopped())
			{
				// eslint-disable-next-line no-await-in-loop
				await awaitQueueChange();
			}
		};

		// the slices end on frame boundaries: an encoder that pads what it is given up to a whole
		// frame would otherwise leave a gap of silence inside the recording on every slice
		const sliceLength = Math.floor((sampleRate * SLICE_SECONDS) / SAMPLES_PER_FRAME) * SAMPLES_PER_FRAME;

		for (let offset = 0; offset < samples.length && !isStopped(); offset += sliceLength)
		{
			const slice = samples.subarray(offset, Math.min(offset + sliceLength, samples.length));
			const audioData = new AudioData({
				format: 'f32-planar',
				sampleRate,
				numberOfChannels,
				numberOfFrames: slice.length,
				// where a slice belongs in the recording is read off its timestamp and nothing else
				timestamp: Math.round((offset / sampleRate) * MICROSECONDS_IN_SECOND),
				data: slice,
			});

			encoder.encode(audioData);
			audioData.close();

			// eslint-disable-next-line no-await-in-loop
			await awaitFreeQueue();
		}

		if (isCancelled())
		{
			// nobody is waiting for this record any more: what is queued is dropped, not finished
			encoder.close();

			return { frames: [], codecDescription: null };
		}

		await encoder.flush();
		encoder.close();

		if (failure)
		{
			throw failure;
		}

		return { frames, codecDescription };
	}

	static #buildFileParts(frames: Uint8Array[], codecDescription: Uint8Array): Uint8Array[]
	{
		const fileType = box('ftyp', [ascii('M4A '), uint32(0), ascii('M4A mp42isom')]);
		const movie = this.#buildMovie(frames, codecDescription);
		const payloadLength = frames.reduce((size, frame) => size + frame.length, 0);
		const mediaHeader = concat([uint32(payloadLength + BOX_HEADER_LENGTH), ascii('mdat')]);

		this.#writeMediaOffset(movie, fileType.length + movie.length + BOX_HEADER_LENGTH);

		// handed over in parts: a Blob takes them as they are, so the payload is never copied
		return [fileType, movie, mediaHeader, ...frames];
	}

	// the table keeps its size whatever offset it holds, so the movie is built once with a zero offset
	// and the real one - known only after the movie is measured - is written into its last entry
	static #writeMediaOffset(movie: Uint8Array, mediaOffset: number): void
	{
		const tail = movie.subarray(movie.length - CHUNK_OFFSET_BOX_LENGTH);
		const boxType = String.fromCodePoint(...tail.subarray(BYTES_IN_UINT32, BOX_HEADER_LENGTH));

		if (boxType !== 'stco')
		{
			// a layout that stopped ending with the chunk offset box would be written past its bytes
			throw new Error('the movie does not end with the chunk offset box');
		}

		movie.set(uint32(mediaOffset), movie.length - BYTES_IN_UINT32);
	}

	static #buildMovie(frames: Uint8Array[], codecDescription: Uint8Array): Uint8Array
	{
		const { sampleRate } = TargetFormat.codecConfig;
		const duration = frames.length * SAMPLES_PER_FRAME;

		const movieHeader = fullBox('mvhd', 0, [
			zeros(8), uint32(sampleRate), uint32(duration),
			uint32(0x00010000), uint16(0x0100), zeros(10),
			uint32Array(IDENTITY_MATRIX), zeros(24), uint32(2),
		]);

		const trackHeader = fullBox('tkhd', 0x000007, [
			zeros(8), uint32(1), zeros(4), uint32(duration), zeros(8),
			zeros(4), uint16(0x0100), zeros(2),
			uint32Array(IDENTITY_MATRIX), zeros(8),
		]);

		const mediaHeader = fullBox('mdhd', 0, [
			zeros(8), uint32(sampleRate), uint32(duration), uint16(UNDETERMINED_LANGUAGE), zeros(2),
		]);

		const handler = fullBox('hdlr', 0, [zeros(4), ascii('soun'), zeros(12), ascii('SoundHandler'), zeros(1)]);
		const dataInfo = box('dinf', [fullBox('dref', 0, [uint32(1), fullBox('url ', 1)])]);
		const sampleTable = this.#buildSampleTable(frames, codecDescription);
		const mediaInfo = box('minf', [fullBox('smhd', 0, [zeros(4)]), dataInfo, sampleTable]);

		return box('moov', [
			movieHeader,
			box('trak', [trackHeader, box('mdia', [mediaHeader, handler, mediaInfo])]),
		]);
	}

	static #buildSampleTable(frames: Uint8Array[], codecDescription: Uint8Array): Uint8Array
	{
		const sizes = frames.map((frame) => frame.length);

		return box('stbl', [
			fullBox('stsd', 0, [uint32(1), this.#buildSampleDescription(codecDescription)]),
			fullBox('stts', 0, [uint32(1), uint32(frames.length), uint32(SAMPLES_PER_FRAME)]),
			fullBox('stsc', 0, [uint32(1), uint32(1), uint32(frames.length), uint32(1)]),
			fullBox('stsz', 0, [uint32(0), uint32(frames.length), uint32Array(sizes)]),
			// the offset of the payload is known only once the movie is built, and it is written in then
			fullBox('stco', 0, [uint32(1), uint32(0)]),
		]);
	}

	static #buildSampleDescription(codecDescription: Uint8Array): Uint8Array
	{
		const { sampleRate, numberOfChannels, bitrate } = TargetFormat.codecConfig;

		const decoderConfig = descriptor(0x04, [
			// mpeg-4 audio in an audio elementary stream, with the decoder buffer of a voice bitstream
			bytes(0x40, 0x15), bytes(0x00, 0x18, 0x00),
			uint32(bitrate), uint32(bitrate),
			descriptor(0x05, [codecDescription]),
		]);

		const elementaryStream = fullBox('esds', 0, [
			descriptor(0x03, [uint16(1), bytes(0), decoderConfig, descriptor(0x06, [bytes(0x02)])]),
		]);

		return box('mp4a', [
			zeros(6), uint16(1),
			zeros(8),
			uint16(numberOfChannels), uint16(16),
			zeros(4),
			// the sample rate of an audio entry is a 16.16 fixed point number
			uint32(sampleRate * 0x10000),
			elementaryStream,
		]);
	}
}

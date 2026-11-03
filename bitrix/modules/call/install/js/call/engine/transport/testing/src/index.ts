import { err } from 'call.engine.transport';
import type { Cancelled, Result } from 'call.engine.transport';

/**
 * The outcome a fake of a one-shot operation hands back for an already aborted signal. Spelled out
 * once here so every fake states the intent instead of rebuilding the variant.
 */
export function cancelledResult<T>(): Result<T>
{
	const error: Cancelled = { kind: 'cancelled' };

	return err(error);
}

export { FakePullPort } from './fakes/fake-pull-port';
export type { PublishedSignal } from './fakes/fake-pull-port';
export { FakeRestPort } from './fakes/fake-rest-port';
export type { RestActionCall } from './fakes/fake-rest-port';
export { FakeHttpPort } from './fakes/fake-http-port';
export { FakeMediaDevicesPort } from './fakes/fake-media-devices-port';
export type { HeldMediaAnswer } from './fakes/fake-media-devices-port';
export { FakeClockPort } from './fakes/fake-clock-port';
export type { ScheduledTimer } from './fakes/fake-clock-port';
export { FakeEnvironmentPort } from './fakes/fake-environment-port';
export { FakeLoggerPort } from './fakes/fake-logger-port';
export type { LogEntry, LogSeverity } from './fakes/fake-logger-port';
export { FakeMediaTransport } from './fakes/fake-media-transport';
export type { FakeMediaTransportOptions, MediaTransportIntentCall } from './fakes/fake-media-transport';
export { runAcquisitionConformance } from './conformance/acquisition-conformance';
export type {
	AcquisitionChannel,
	AcquisitionConformanceSubject,
	AcquisitionUnderTest,
	ConformanceRunner,
} from './conformance/acquisition-conformance';
export { runMediaTransportConformance } from './conformance/media-transport-conformance';
export type {
	MediaPlaneControl,
	MediaPlaneReporter,
	MediaTransportConformanceSubject,
	MediaTransportUnderTest,
} from './conformance/media-transport-conformance';
export { runSignalingGatewayConformance } from './conformance/signaling-gateway-conformance';
export type {
	PublishedMessage,
	SentAction,
	SignalingGatewayConformanceSubject,
	SignalingGatewayUnderTest,
	SignalingWire,
} from './conformance/signaling-gateway-conformance';

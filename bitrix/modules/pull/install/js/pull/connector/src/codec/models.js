// Protobuf message models
import '../../../protobuf/protobuf';
import '../../../protobuf/model';

// globalThis, not window: this module is also bundled into the SharedWorker
const Response = globalThis.protobuf.roots['push-server'].Response;
const ResponseBatch = globalThis.protobuf.roots['push-server'].ResponseBatch;
const Request = globalThis.protobuf.roots['push-server'].Request;
const RequestBatch = globalThis.protobuf.roots['push-server'].RequestBatch;
const IncomingMessagesRequest = globalThis.protobuf.roots['push-server'].IncomingMessagesRequest;
const IncomingMessage = globalThis.protobuf.roots['push-server'].IncomingMessage;
const Receiver = globalThis.protobuf.roots['push-server'].Receiver;

export {
	Response,
	ResponseBatch,
	Request,
	RequestBatch,
	IncomingMessagesRequest,
	IncomingMessage,
	Receiver,
};

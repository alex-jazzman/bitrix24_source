if (BX.Type.isUndefined(window.frameCacheVars))
{
	BX.Event.ready(() => {
		BX.Runtime.loadExtension('main.rating');
	});
}
else
{
	BX.Event.EventEmitter.subscribe('onFrameDataReceived', () => {
		BX.Runtime.loadExtension('main.rating');
	});
}
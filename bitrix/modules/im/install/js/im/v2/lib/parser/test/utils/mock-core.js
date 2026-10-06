// The parser reaches the messenger core via CoreProxy.getCore() → BX.Messenger.<ns>.Application.Core.
// The im.v2.test harness only sets up the namespace scaffolding, so getCore() returns undefined for
// a test that doesn't stub it. Seed an inert Core in both namespaces (idempotent) so unstubbed
// getCore() calls get a no-op store instead of throwing; tests that need real data still stub getCore.
const mockCore = {
	getApplicationData: () => ({}),
	getStore: () => ({ getters: new Proxy({}, { get: () => () => null }) }),
	getUserId: () => 1,
};

const messenger = window.BX.Messenger ?? (window.BX.Messenger = {});
for (const ns of ['Embedding', 'v2'])
{
	messenger[ns] = messenger[ns] ?? {};
	messenger[ns].Application = messenger[ns].Application ?? {};
	messenger[ns].Application.Core = messenger[ns].Application.Core ?? mockCore;
	messenger[ns].Lib = messenger[ns].Lib ?? {};
	messenger[ns].Const = messenger[ns].Const ?? {};
}

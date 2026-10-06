import 'main.polyfill.intersectionobserver';
import { Type } from 'main.core';

const allowedProtocols = new Set(['http:', 'https:']);

// Guards both sinks of an untrusted url: the link href and the avatar background.
// Parsing collapses obfuscated schemes to a canonical protocol, so the allowlist cannot be bypassed.
function isAllowedUrl(value: ?string): boolean
{
	if (!Type.isStringFilled(value))
	{
		return false;
	}

	try
	{
		return allowedProtocols.has(new URL(value, location.href).protocol);
	}
	catch
	{
		return false;
	}
}

let intersectionObserver;
function observeIntersection(entity, callback)
{
	if (!intersectionObserver)
	{
		intersectionObserver = new IntersectionObserver(function(entries) {
			entries.forEach((entry) => {
				if (entry.isIntersecting)
				{
					intersectionObserver.unobserve(entry.target);
					const observedCallback = entry.target.observedCallback;
					delete entry.target.observedCallback;
					setTimeout(observedCallback);
				}
			});
		}, {
			threshold: 0
		});
	}
	entity.observedCallback = callback;

	intersectionObserver.observe(entity);

	// A caller that drops its nodes before they ever come into view has to release them itself:
	// the observer is shared and would keep the detached nodes and their callbacks alive.
	return () => {
		intersectionObserver.unobserve(entity);
		delete entity.observedCallback;
	};
}


export {
	observeIntersection,
	isAllowedUrl,
}
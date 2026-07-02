export default {
	input: './src/index.ts',
	output: './dist/notification.bundle.js',
	namespace: 'BX.UI.Notification',
	adjustConfigPhp: false,

	// Compile Balloon and Action down to prototype-based constructors so that
	// legacy subclass bundles built with older Babel (e.g. intranet.push-invitations,
	// which uses `babelHelpers.inherits` + `getPrototypeOf(Child).call(this, ...)`)
	// keep working. Native ES `class` would otherwise throw
	// "Class constructor cannot be invoked without 'new'" against the old call sites.
	// Stack/Manager/NotificationEvent stay native — no legacy subclasses depend on them.
	transformClasses: ['Balloon', 'Action'],
};

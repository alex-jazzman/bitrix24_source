export const ChatEmbeddedApplication = {
	task: 'task',
};

export type ChatEmbeddedApplicationType = $Values<typeof ChatEmbeddedApplication>;
export type ChatEmbeddedApplicationInstance = {
	render: (element: HTMLElement | string) => Promise,
};

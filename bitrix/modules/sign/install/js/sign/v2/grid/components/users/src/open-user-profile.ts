import { Runtime } from 'main.core';

type SidePanelExtension = {
	SidePanel: {
		Instance: {
			open: (url: string, options: { cacheable: boolean }) => void,
		},
	},
};

let sidePanelExtensionPromise: Promise<SidePanelExtension> | null = null;

function loadSidePanelExtension(): Promise<SidePanelExtension>
{
	if (sidePanelExtensionPromise === null)
	{
		sidePanelExtensionPromise = Runtime.loadExtension('main.sidepanel') as unknown as Promise<SidePanelExtension>;
	}

	return sidePanelExtensionPromise;
}

export async function openUserProfile(userId: number): Promise<void>
{
	try
	{
		const { SidePanel } = await loadSidePanelExtension();
		const url = `/company/personal/user/${userId}/`;
		SidePanel.Instance.open(url, { cacheable: false });
	}
	catch
	{
		sidePanelExtensionPromise = null;
	}
}

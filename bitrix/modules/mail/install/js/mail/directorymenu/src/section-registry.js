// The left menu lights exactly one section at a time. The folders are the default
// owner: they have no id here and are lit whenever no section is. Every other
// section - favorites, drafts, labels - registers the pair of handlers that turn
// its own highlight on and off, so the sections rendered outside this bundle are
// dropped by the same point as the folders.
export class SectionRegistry
{
	#sections = new Map();
	#activeId = null;
	#deactivateDefault;

	constructor(deactivateDefault)
	{
		this.#deactivateDefault = deactivateDefault;
	}

	// claim is optional and answers a single question: does the list right now show what
	// this section stands for? A section whose state survives the reign of another one -
	// a label, which stays in the filter while drafts are open - hands it over, so that
	// leaving that other section gives the highlight back to the section, not to a folder
	// the list is not showing.
	register(id, { activate, deactivate, claim = null })
	{
		this.#sections.set(id, { activate, deactivate, claim });
	}

	// null means the folders own the highlight.
	getActiveId()
	{
		return this.#activeId;
	}

	activate(id, payload)
	{
		const section = this.#sections.get(id);
		if (!section)
		{
			return;
		}

		this.deactivateAll();
		this.#activeId = id;
		section.activate(payload);
	}

	// A redraw driven by the filter rather than by a pick: the section re-asserts
	// itself only while no other one owns the highlight, so a foreign filter cannot
	// undo what the user has picked.
	sync(id, payload)
	{
		if (this.#activeId !== null && this.#activeId !== id)
		{
			return;
		}

		this.activate(id, payload);
	}

	// Returns true when the section did own the highlight and no other one took it over,
	// so the caller knows it has to give the folders their own highlight back.
	release(id)
	{
		if (this.#activeId !== id)
		{
			return false;
		}

		this.#activeId = null;
		this.#sections.get(id).deactivate();

		return !this.#handOverToClaimant(id);
	}

	// Leaving a section says nothing about the folders: what the list shows is whatever
	// the filter still holds. The sections that can answer that are asked in turn, and
	// the first one recognising its own state takes the highlight instead of the folders.
	#handOverToClaimant(releasedId)
	{
		for (const [id, section] of this.#sections)
		{
			if (id === releasedId || !section.claim)
			{
				continue;
			}

			const payload = section.claim();
			if (payload === null || payload === undefined || payload === false)
			{
				continue;
			}

			this.activate(id, payload);

			return true;
		}

		return false;
	}

	deactivateAll()
	{
		this.#activeId = null;
		this.#deactivateDefault();

		for (const section of this.#sections.values())
		{
			section.deactivate();
		}
	}
}

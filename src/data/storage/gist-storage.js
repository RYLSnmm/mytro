async function getGist(gistid, rev) {
	const response = await fetch(`https://api.github.com/gists/${gistid}` + (rev ? "/" + rev : ""))
	const res_body = await response.json()
	const files = {}
	for (const v of Object.values(res_body.files)) {
		if (!v.truncated) {
			files[v.filename] = v.content
		}
	}
	return { ok: response.status === 200, body: res_body, files }
}

async function createGist(token, files, desc) {
	const req_body = { files: {} }
	if (desc) {
		req_body.description = desc
	}
	for (const [k, v] of Object.entries(files)) {
		req_body.files[k] = { content: v }
	}

	const response = await fetch("https://api.github.com/gists", {
		method: "POST",
		body: JSON.stringify(req_body),
		headers: {
			"Content-Type": "application/json",
			Authorization: `token ${token}`,
		},
	})
	const res_body = await response.json()

	return { ok: response.status === 201, body: res_body }
}

async function updateGist(gistid, token, file_changes, desc) {
	const req_body = { files: {} }
	if (desc) {
		req_body.description = desc
	}
	for (const [k, v] of Object.entries(file_changes)) {
		req_body.files[k] = { content: v }
	}

	const response = await fetch(`https://api.github.com/gists/${gistid}`, {
		method: "PATCH",
		body: JSON.stringify(req_body),
		headers: {
			"Content-Type": "application/json",
			Authorization: `token ${token}`,
		},
	})
	const res_body = await response.json()

	return { ok: response.status === 200, body: res_body }
}

class GSError extends Error {
	constructor(message, info) {
		super(message)
		this.name = "GSError"
		this.info = info
	}
}

export class GistStorage {
	constructor({ gistid, gistname, filename, token }) {
		this.gistid = gistid
		this.gistname = gistname || "GistStorage data"
		this.filename = filename || "_GISTSTORAGE_DATA_"
		this.token = token
	}

	async save(data, pretty_print) {
		if (!this.token) {
			throw new GSError("token is not specified", {})
		}
		const files = {
			[this.filename]: pretty_print ? JSON.stringify(data, null, "\t") : JSON.stringify(data),
		}
		if (this.gistid) {
			const result = await updateGist(this.gistid, this.token, files)
			if (!result.ok) {
				throw new GSError("update failed", result.body)
			}
		} else {
			const result = await createGist(this.token, files, this.gistname)
			if (!result.ok) {
				throw new GSError("create failed", result.body)
			}
			this.gistid = result.body.id
		}
	}

	async load() {
		if (this.gistid) {
			const result = await getGist(this.gistid)
			if (!result.ok) {
				throw new GSError("get failed", result.body)
			}
			return JSON.parse(result.files[this.filename])
		} else {
			throw new GSError("gistid is not specified", {})
		}
	}
}

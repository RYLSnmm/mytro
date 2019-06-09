import { GistStorage } from "./gist-storage.js"

/**
 * Gist を使ったストレージ
 */
export class StorageGist {
	constructor(opt) {
		opt = opt || {}
		this.gs = new GistStorage({
			gistid: opt.gistid,
			token: opt.token,
			gistname: opt.gistname || "mytro export data",
			filename: opt.filename || "mytro-export-data.json",
		})
		this.autoload = opt.autoload
		this.autosave = opt.autosave
	}

	/**
	 * セーブ
	 *
	 * @param {*} data セーブするデータ
	 * @param {*} opt オプション
	 */
	async save(data, opt) {
		opt = opt || {}
		if(!this.autosave && !opt.manually) return
		this.gs.save(data, true)
	}

	/**
	 * ロード
	 * 
	 * @param {*} opt オプション
	 */
	load(opt) {
		opt = opt || {}
		if(!this.autoload && !opt.manually) return
		return this.gs.load()
	}

	/**
	 * バックアップ
	 *
	 * gist は世代管理されているので不要だから何もしない
	 */
	backup() {}
}

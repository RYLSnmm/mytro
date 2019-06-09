/**
 * localStorage を使ったストレージ
 */
export class StorageLocal {
	constructor(opt) {
		opt = opt || {}
		this.storage_key = opt.storage_key || "mytro-data"
		this.backup_storage_key = opt.backup_storage_key || "mytro-backup-data"
	}

	/**
	 * セーブ
	 *
	 * @param {*} data セーブするデータ
	 * @param {*} opt オプション（使わない）
	 */
	save(data, opt) {
		localStorage[this.storage_key] = JSON.stringify(data)
	}

	/**
	 * ロード
	 * 
	 * @param {*} opt オプション（使わない）
	 */
	load(opt) {
		return JSON.parse(localStorage[this.storage_key] || "null")
	}

	/**
	 * バックアップ
	 */
	backup() {
		if (this.storage_key in localStorage) {
			localStorage[this.backup_storage_key] = localStorage[this.storage_key]
		}
	}
}

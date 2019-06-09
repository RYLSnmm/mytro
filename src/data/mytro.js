export default class Mytro {
	constructor() {
		this.data = {
			// タイトル一覧
			titles: [],
			// import/export 用のチェック用キー
			key: "af73c90184b9d1f0",
		}
		this.storage_key = "mytro-data"
		this.load()
	}

	/**
	 * タイトル追加
	 * 同じ名前は禁止
	 *
	 * @param {*} title Title() に追加するプロパティだけ指定したオブジェクト
	 * @returns {boolean} 追加できたら true
	 */
	addTitle(title) {
		if (this.checkTitleNameDuplication(title.name)) {
			return false
		}

		const new_title = Object.assign(Title(), title)
		this.data.titles.push(new_title)
		this.save()
		return true
	}

	/**
	 * タイトル削除
	 * @param {*} target_title 削除するタイトル名 or 削除する title オブジェクト
	 * @returns {boolean} 削除したら true
	 */
	removeTitle(target_title) {
		const [_, idx] = this.findTitle(target_title)

		if (idx < 0) return false
		this.data.titles.splice(idx, 1)
		this.save()
		return true
	}

	/**
	 * タイトル情報の更新
	 * @param {*} target_title 追加対象
	 * @param {*} new_title 追加するプロパティだけ指定したオブジェクト
	 * @returns {boolean} 更新したら true
	 */
	updateTitle(target_title, new_title) {
		const [target] = this.findTitle(target_title)
		if (!target) return false
		if (target.name !== new_title.name && this.checkTitleNameDuplication(new_title.name)) return false
		Object.assign(target, { ...new_title, modified_at: new Date() })
		this.save()
		return true
	}

	/**
	 * タイトルリストを返す
	 */
	listTitle() {
		return this.data.titles
	}

	/**
	 * 名前でタイトルを探す
	 * タイトルオブジェクト自体ならリストにあるか確認する
	 *
	 * @param {*} target_title
	 * @returns {Array} タイトルオブジェクトとその index の 2 要素だけの配列
	 */
	findTitle(target_title) {
		const index = this.data.titles.findIndex(e => {
			return typeof target_title === "string" ? e.name === target_title : e === target_title
		})
		return [this.data.titles[index], index]
	}

	/**
	 * タイトル名の重複チェック
	 *
	 * @param {string} name
	 * @returns {boolean} すでにあったら true
	 */
	checkTitleNameDuplication(name) {
		return this.data.titles.some(e => e.name === name)
	}

	/**
	 * マイトロ追加
	 * 同じ名前は禁止
	 *
	 * @param {*} target_title
	 * @param {*} achievement
	 * @returns {boolean} 追加できたら true
	 */
	addAchievement(target_title, achievement) {
		const [title] = this.findTitle(target_title)
		if (!title || this.checkAchievementNameDuplication(title, achievement.name)) return false
		const new_achievement = Object.assign(Achievement(), achievement)
		title.achievements.push(new_achievement)
		this.save()
		return true
	}

	/**
	 * マイトロ削除
	 *
	 * @param {*} target_title
	 * @param {*} target_achievement
	 * @returns {boolean} 削除できたら true
	 */
	removeAchievement(target_title, target_achievement) {
		const [title] = this.findTitle(target_title)
		if (!title) return false
		const [_, idx] = this.findAchievement(title, target_achievement)
		if (idx < 0) return false
		title.achievements.splice(idx, 1)
		this.save()
		return true
	}

	/**
	 * マイトロ更新
	 *
	 * @param {*} target_title
	 * @param {*} target_achievement
	 * @param {*} new_achievement
	 * @returns {boolean} 更新できたら true
	 */
	updateAchievement(target_title, target_achievement, new_achievement) {
		const [title] = this.findTitle(target_title)
		if (!title) return false
		const [target] = this.findAchievement(title, target_achievement)
		if (!target) return false
		if (target.name !== new_achievement.name && this.checkAchievementNameDuplication(title, new_achievement.name))
			return false
		Object.assign(target, { ...new_achievement, modified_at: new Date() })
		this.save()
		return true
	}

	/**
	 * タイトルリストを返す
	 *
	 * @param {*} target_title
	 */
	listAchievements(target_title) {
		const [title] = this.findTitle(target_title)
		if (!title) return []
		return title.achievements
	}

	/**
	 * 名前でマイトロを探す
	 * マイトロオブジェクト自体ならリストにあるか確認する
	 *
	 * @param {*} title
	 * @param {*} target_achievement
	 * @returns {Array} achievement オブジェクトとその index の 2 要素だけの配列
	 */
	findAchievement(title, target_achievement) {
		const index = title.achievements.findIndex(e => {
			return typeof target_achievement === "string" ? e.name === target_achievement : e === target_achievement
		})
		return [title.achievements[index], index]
	}

	/**
	 * マイトロ名の重複チェック
	 *
	 * @param {*} title
	 * @param {string} name
	 * @returns {boolean} すでにあったら true
	 */
	checkAchievementNameDuplication(title, name) {
		return title.achievements.some(e => e.name === name)
	}

	/**
	 * すべて削除
	 */
	clear() {
		this.data.titles = []
	}

	/**
	 * localStorage にセーブ
	 */
	save() {
		localStorage[this.storage_key] = JSON.stringify(this.data)
	}

	/**
	 * localStorage からロード
	 */
	load() {
		const obj = JSON.parse(localStorage[this.storage_key] || "null")
		if (obj) {
			this.data = obj
		}
	}

	/**
	 * データのインポート
	 *
	 * @param {string} json
	 * @returns {void}
	 */
	import(json) {
		const verify = j => {
			try {
				const obj = JSON.parse(j)
				if (obj && obj.key === this.data.key) {
					return { ok: true, data: obj }
				} else {
					return { ok: false, message: "バージョンが一致しません" }
				}
			} catch (err) {
				return { ok: false, message: "パースできませんでした。不正なファイルフォーマットです" }
			}
		}

		const { ok, data, message } = verify(json)
		if (!ok) throw { user_error: true, message }

		// バックアップ
		if ("data" in localStorage) {
			localStorage["backup"] = localStorage["data"]
		}

		this.data = data
		this.save()
	}

	/**
	 * データのエクスポート
	 * json 文字列を返す
	 *
	 * @returns {string} data の JSON 文字列
	 */
	export(pretty_print) {
		return pretty_print ? JSON.stringify(this.data, null, "\t") : JSON.stringify(this.data)
	}
}

export const Title = () => ({
	name: "",
	platform: "",
	description: "",
	note: "",
	groups: [],
	achievements: [],
	icon: "",
	backimg: "",
	created_at: new Date(),
	modified_at: new Date(),
})

export const Achievement = () => ({
	name: "",
	description: "",
	note: "",
	type: "normal",
	done: false,
	created_at: new Date(),
	modified_at: new Date(),
})

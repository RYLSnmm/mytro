import Mytro, { Title, Achievement } from "../data/mytro.js"
import { html, render } from "https://unpkg.com/lit-html@1.0.0?module"

class MytroApp extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: "open" })
		this.shadowRoot.adoptedStyleSheets = [MytroApp.css]

		this.mytro = new Mytro()
		this.view_state = new WeakMap()
		this.selected_name = null
		this.dialog = null
		this.editable = false
		this.editing_name = null
		// edit title
		this.title_editing = null
		// edit achievement
		this.achievement_editing = null
		// delete achievement
		this.deleting = null
		// import
		this.pending_file = null
		this.file_text = ""
		// export
		this.export_text = null
	}

	async connectedCallback() {
		await MytroApp.css_ready
		this.render()
	}

	onExport(eve) {
		this.dialog = "export"
		this.export_text = this.mytro.export(true)
		this.render()
	}

	onImport(eve) {
		this.dialog = "import"
		this.pending_file = null
		this.file_text = ""
		this.render()
	}

	onImportConfirm(eve) {
		this.dialog = null
		this.mytro.import(this.file_text)
		this.render()
	}

	onInputFile(eve) {
		this.pending_file = eve.target.files[0]
		this.file_text = ""
		const fr = new FileReader()
		fr.onload = () => {
			this.file_text = fr.result
			this.render()
		}
		fr.readAsText(this.pending_file)
		this.render()
	}

	onInputExportText(eve) {
		this.export_text = eve.target.value
		this.render()
	}

	onExportDownload(eve) {
		const a = document.createElement("a")
		a.download = "mytro-export-" + Date.now() + ".json"
		a.href = "data://," + encodeURIComponent(this.export_text)
		a.click()
	}

	onClickDialogBack(eve) {
		if (eve.target === eve.currentTarget) {
			this.dialog = null
			this.render()
		}
	}

	onSelect(eve) {
		const name = eve.target.closest(".item").data.name
		this.selected_name = name
		this.render()
	}

	onBack(eve) {
		this.selected_name = null
		this.render()
	}

	onCreateTitle(eve) {
		this.dialog = "edit-title"
		this.title_editing = Title()
		this.title_editing.groups_text = ""
		this.editing_name = null
		this.render()
	}

	onEditTitle(eve) {
		this.dialog = "edit-title"
		const editing = eve.target.closest(".item").data
		this.title_editing = JSON.parse(JSON.stringify(editing))
		this.title_editing.groups_text = this.title_editing.groups.join(";")
		this.editing_name = editing.name
		this.render()
	}

	onDeleteTitle(eve) {
		this.dialog = "delete"
		this.deleting = {
			type: "title",
			target: eve.target.closest(".item").data,
		}
		this.render()
	}

	onCreateAchievement(eve) {
		this.dialog = "edit-achievement"
		this.achievement_editing = Achievement()
		this.editing_name = null
		this.render()
	}

	onEditAchievement(eve) {
		this.dialog = "edit-achievement"
		const editing = eve.target.closest(".item").data
		this.achievement_editing = JSON.parse(JSON.stringify(editing))
		this.editing_name = editing.name
		this.render()
	}

	onDeleteAchievement(eve) {
		this.dialog = "delete"
		this.deleting = {
			type: "achievement",
			target: eve.target.closest(".item").data,
		}
		this.render()
	}

	onEditTitleSave() {
		this.dialog = null
		const { groups_text, ...title } = this.title_editing
		const groups = groups_text
			.split(";")
			.map(e => e.trim())
			.filter(e => e)
		title.groups = [...new Set(groups)]
		if (this.editing_name === null) {
			this.mytro.addTitle(title)
		} else {
			this.mytro.updateTitle(this.editing_name, title)
		}
		this.title_editing = null
		this.editing_name = null
		this.render()
	}

	onEditTitleCancel(eve) {
		this.dialog = null
		this.title_editing = null
		this.editing_name = null
		this.render()
	}

	onEditAchievementSave() {
		this.dialog = null
		if (this.editing_name === null) {
			this.mytro.addAchievement(this.selected_name, this.achievement_editing)
		} else {
			this.mytro.updateAchievement(this.selected_name, this.editing_name, this.achievement_editing)
		}
		this.achievement_editing = null
		this.editing_name = null
		this.render()
	}

	onEditAchievementCancel(eve) {
		this.dialog = null
		this.achievement_editing = null
		this.editing_name = null
		this.render()
	}

	onDeleteYes(eve) {
		if (this.deleting.type === "title") {
			this.mytro.removeTitle(this.deleting.target.name)
		} else if (this.deleting.type === "achievement") {
			this.mytro.removeAchievement(this.selected_name, this.deleting.target.name)
		}
		if (this.deleting.target.name === this.selected_name) {
			this.selected_name = null
		}
		this.dialog = null
		this.deleting = null
		this.render()
	}

	onDeleteNo(eve) {
		this.dialog = null
		this.deleting = null
		this.render()
	}

	onInputTitle(eve) {
		const name = eve.target.name
		if (name) {
			this.title_editing[name] = eve.target.value
		}
		this.render()
	}

	onInputAchievement(eve) {
		const name = eve.target.name
		if (name) {
			this.achievement_editing[name] = eve.target.value
		}
		this.render()
	}

	onChangeEditable(eve) {
		this.editable = eve.target.checked
		this.render()
	}

	onChangeDone(eve) {
		const target_name = eve.target.closest(".item").data.name
		const done = eve.target.checked
		this.mytro.updateAchievement(this.selected_name, target_name, { done })
		this.render()
	}

	onToggleNote(eve) {
		const data = eve.target.closest(".item").data
		const state = this.view_state.get(data) || {}
		state.open_note = !state.open_note
		this.view_state.set(data, state)
		this.render()
	}

	get template() {
		const viewstate = x => this.view_state.get(x) || {}

		const titleStatus = (title, type) => {
			const items = title.achievements.filter(e => e.type === type)
			const all_num = items.length
			const comp_num = items.filter(e => e.done).length
			const rate = comp_num / all_num || 0
			return { rate, all_num, comp_num }
		}

		const achievementCount = (title, type) => {
			const ts = titleStatus(title, type)
			return html`
				<span class="count" ?data-complete=${ts.all_num && ts.all_num === ts.comp_num}>
					${ts.comp_num}/${ts.all_num}
				</span>
			`
		}

		const rateGauge = (title, type) => {
			const ts = titleStatus(title, type)
			return html`
				<div class=${"gauge-" + type} ?data-empty=${ts.all_num === 0}>
					<div style=${`width: ${ts.rate * 100}%`}></div>
				</div>
			`
		}

		const timestamp = ts => {
			const d = new Date(ts)
			return (
				d.getFullYear() +
				"/" +
				String(d.getMonth() + 1).padStart(2, "0") +
				"/" +
				String(d.getDate()).padStart(2, "0") +
				" " +
				String(d.getHours()).padStart(2, "0") +
				":" +
				String(d.getMinutes()).padStart(2, "0") +
				":" +
				String(d.getSeconds()).padStart(2, "0")
			)
		}

		// prettier-ignore
		const titleTemplate = (title, index) => html`
			<div class="item title" ?data-selected=${title.name === this.selected_name} .data=${title}>
				<div class="summary">
					<div class="icon" @click=${this.onSelect}>
						${title.icon
							? html`<img src=${title.icon} />`
							: html`<div>${name[0]}</div>`
						}
					</div>
					<div class="info">
						<div class="flex-row flex-two-side">
							<div class="name" @click=${this.onSelect}>${title.name}</div>
							<div class="title-top-right">
								<span class="platform">${title.platform}</span>
								<span class="edit-buttons only-editable">
									<button @click=${this.onEditTitle}><i class="material-icons">edit</i></button>
									<button @click=${this.onDeleteTitle}><i class="material-icons">close</i></button>
								</span>
							</div>
						</div>
						<div class="status">
							<div class="status-detail">
								<span class="normal">
									Normal: ${achievementCount(title, "normal")}
								</span>
								<span class="extra">
									Extra: ${achievementCount(title, "extra")}
								</span>
							</div>
							<div class="gauge">
								${rateGauge(title, "normal")}
								${rateGauge(title, "extra")}
							</div>
						</div>
						<div class="groups">${
							title.groups.map(e => html`<span class="group">${e}</span>`)
						}</div>
						<div class="desc" @click=${this.onToggleNote}>${title.description}</div>
					</div>
				</div>
				<div class="note" ?hidden=${!viewstate(title).open_note} @click=${this.onToggleNote}>${title.note}</div>
			</div>
		`

		const achievementTemplate = (achievement, index) => html`
			<div class="item achievement" .data=${achievement} data-type=${achievement.type}>
				<div class="summary">
					<div class="check">
						<label class="toggle-done">
							<input
								type="checkbox"
								.checked=${achievement.done}
								.disabled=${!this.editable}
								@change=${this.onChangeDone}
							/>
							<div>✓</div>
						</label>
					</div>
					<div class="info">
						<div class="flex-row flex-two-side">
							<span class="name">${achievement.name}</span>
							<span class="edit-buttons only-editable">
								<button @click=${this.onEditAchievement}><i class="material-icons">edit</i></button>
								<button @click=${this.onDeleteAchievement}><i class="material-icons">close</i></button>
							</span>
						</div>
						<div class="desc" @click=${this.onToggleNote}>${achievement.description}</div>
						<div class="timestamps">
							Create: ${timestamp(achievement.created_at)}, Update: ${timestamp(achievement.modified_at)}
						</div>
					</div>
				</div>
				<div class="note" ?hidden=${!viewstate(achievement).open_note} @click=${this.onToggleNote}>
					${achievement.note}
				</div>
			</div>
		`

		const editTitleDialogTemplate = () => html`
			<div class="edit-title-dialog dialog" ?hidden=${this.dialog !== "edit-title"}>
				<div class="form" @input=${this.onInputTitle}>
					<table>
						<tr>
							<th>タイトル</th>
							<td><input type="text" name="name" .value=${this.title_editing.name} /></td>
						</tr>
						<tr>
							<th>プラットフォーム</th>
							<td><input type="text" name="platform" .value=${this.title_editing.platform} /></td>
						</tr>
						<tr>
							<th>説明</th>
							<td><textarea name="description" .value=${this.title_editing.description}></textarea></td>
						</tr>
						<tr>
							<th>
								ノート
								<div class="sup">(クリックで表示)</div>
							</th>
							<td><textarea name="note" .value=${this.title_editing.note}></textarea></td>
						</tr>
						<tr>
							<th>グループ</th>
							<td>
								<input
									type="text"
									name="groups_text"
									placeholder="「;」区切りで複数入力"
									title="「;」区切りで複数入力"
									.value=${this.title_editing.groups_text}
								/>
							</td>
						</tr>
						<tr>
							<th>画像</th>
							<td>
								<div class="img-row">
									<span class="img-label">アイコン</span>
									<input
										class="flex-auto"
										type="text"
										name="icon"
										.value=${this.title_editing.icon}
									/>
								</div>
								<div class="img-row">
									<span class="img-label">バナー</span>
									<input
										class="flex-auto"
										type="text"
										name="backimg"
										.value=${this.title_editing.backimg}
									/>
								</div>
							</td>
						</tr>
					</table>
				</div>
				<div class="bottom-btns">
					<button @click=${this.onEditTitleSave}>OK</button>
					<button @click=${this.onEditTitleCancel}>キャンセル</button>
				</div>
			</div>
		`

		const editAchivementDialogTemplate = () => html`
			<div class="edit-achievement-dialog dialog" ?hidden=${this.dialog !== "edit-achievement"}>
				<div class="form" @input=${this.onInputAchievement}>
					<table>
						<tr>
							<th>名前</th>
							<td><input type="text" name="name" .value=${this.achievement_editing.name} /></td>
						</tr>
						<tr>
							<th>説明</th>
							<td>
								<textarea name="description" .value=${this.achievement_editing.description}></textarea>
							</td>
						</tr>
						<tr>
							<th>
								ノート
								<div class="sup">(クリックで表示)</div>
							</th>
							<td><textarea name="note" .value=${this.achievement_editing.note}></textarea></td>
						</tr>
						<tr>
							<th>タイプ</th>
							<td>
								<label class="achievement-type">
									<input
										type="radio"
										name="type"
										value="normal"
										.checked=${this.achievement_editing.type === "normal"}
									/>
									Normal
								</label>
								<label class="achievement-type">
									<input
										type="radio"
										name="type"
										value="extra"
										.checked=${this.achievement_editing.type === "extra"}
									/>
									Extra
								</label>
							</td>
						</tr>
					</table>
				</div>
				<div class="bottom-btns">
					<button @click=${this.onEditAchievementSave}>OK</button>
					<button @click=${this.onEditAchievementCancel}>キャンセル</button>
				</div>
			</div>
		`

		const deleteDialogTemplate = name => html`
			<div class="delete-dialog dialog" ?hidden=${this.dialog !== "delete"}>
				<p>「${this.deleting.target.name}」を削除しますか？</p>
				<div class="bottom-btns">
					<button @click=${this.onDeleteYes}>はい</button>
					<button @click=${this.onDeleteNo}>いいえ</button>
				</div>
			</div>
		`

		// prettier-ignore
		const importDialogTemplate = () => html`
			<div class="import-dialog dialog" ?hidden=${this.dialog !== "import"}>
				<div>
					<div class="dropcatcher">
						<div class="flex-row flex-centering backmessage">ファイルを選択</div>
						<pre class="preview">${
							this.pending_file
								? `【プレビュー】\n${this.pending_file.name}\n${this.pending_file.size} bytes\n\n${this.file_text.substr(0, 4096)}`
								: ""
						}</pre>
						<input @input=${this.onInputFile} class="fileinput" accept="application/json" type="file" />
					</div>
				</div>
				<div class="bottom-btns">
					<button @click=${this.onImportConfirm}>インポート</button>
				</div>
			</div>
		`

		const exportDialogTemplate = () => html`
			<div class="export-dialog dialog" ?hidden=${this.dialog !== "export"}>
				<div>
					<textarea @input=${this.onInputExportText} .value=${this.export_text}></textarea>
				</div>
				<div class="bottom-btns">
					<button @click=${this.onExportDownload}>ダウンロード</button>
				</div>
			</div>
		`

		const backimg = type => {
			if (type === "one" && this.selected_name) {
				const [title] = this.mytro.findTitle(this.selected_name)
				if (title) {
					return `background-image: url(${title.backimg})`
				} else {
					return ""
				}
			} else if (type === "list" && !this.selected_name) {
				return this.mytro
					.listTitle()
					.map(e => e.icon)
					.filter(e => e)
					.map(
						e =>
							html`
								<div class="backimg-cover"><img src=${e} /></div>
							`
					)
			} else {
				return ""
			}
		}

		const selectedTitle = () => {
			const [title] = this.mytro.findTitle(this.selected_name)
			if (!title) return ""
			return html`
				<div class="row1">
					<div class="name">${title.name}</div>
					<div class="platform">${title.platform}</div>
				</div>
				<div class="row2">
					<div class="timestamp">Create: ${timestamp(title.created_at)}</div>
					<div class="rate">
						<span class="gauge-label">Normal: ${achievementCount(title, "normal")}</span>
						<div class="gauge">
							${rateGauge(title, "normal")}
						</div>
					</div>
				</div>
				<div class="row3">
					<div class="timestamp">Update: ${timestamp(title.modified_at)}</div>
					<div class="rate">
						<span class="gauge-label">Extra: ${achievementCount(title, "extra")}</span>
						<div class="gauge">
							${rateGauge(title, "extra")}
						</div>
					</div>
				</div>
			`
		}

		// prettier-ignore
		return html`
			<div class="root" data-mode=${this.editable ? "edit" : "view"}>
				<header class="header">
					<div class="container flex-row flex-two-side">
						<div class="flex-row">
							<h1 class="page-title">まいとろ</h1>
						</div>
						<div class="flex-row flex-cx-centering">
							<label class="toggle-edit">
								<input type="checkbox" .checked=${this.editable} @change=${this.onChangeEditable} />
								<div class="toggle-edit-button">
									<i class="material-icons">edit</i>
									<span>Edit</span>
								</div>
							</label>
							<button @click=${this.onImport}>IMPORT</button>
							<button @click=${this.onExport}>EXPORT</button>
						</div>
					</div>
				</header>
				<section class="body">
					<div class="backimg" data-mode=${this.selected_name ? "one" : "list"} style=${backimg("one")}>${backimg("list")}</div>
					<div class="container" ?data-show-achievement=${!!this.selected_name}>
						<div class="content">
							<div class="title-list hover-scroll">
								${this.mytro.listTitle().map(titleTemplate)}
								<div class="create only-editable" @click=${this.onCreateTitle}>＋</div>
							</div>
							<div class="achievement-list-wrapper">
								<div class="title-status">
									<button class="back" @click=${this.onBack}>➡</button>
									<div class="flex-auto">${selectedTitle()}</div>
								</div>
								<div class="achievement-list hover-scroll">
									${this.mytro.listAchievements(this.selected_name).map(achievementTemplate)}
									<div class="create only-editable" @click=${this.onCreateAchievement}>＋</div>
								</div>
							</div>
						</div>
					</div>
				</section>
				<footer class="footer"></footer>
				<div class="floating">
					<div class="dialog-back" ?hidden=${this.dialog === null} @click=${this.onClickDialogBack}>
						${this.title_editing && editTitleDialogTemplate()}
						${this.achievement_editing && editAchivementDialogTemplate()}
						${this.deleting && deleteDialogTemplate()}
						${importDialogTemplate()}
						${exportDialogTemplate()}
					</div>
				</div>
			</div>
		`
	}

	render() {
		return render(this.template, this.shadowRoot, { eventContext: this })
	}
}

MytroApp.css = new CSSStyleSheet()
MytroApp.css_ready = MytroApp.css.replace(`@import url(${import.meta.url.replace(".js", ".css")})`)

customElements.define("mytro-app", MytroApp)

export class ViewManager {
  constructor () {
    this.tbody = document.querySelector('#tbody')
    this.newFileBtn = document.querySelector('#newFileBtn')
    this.fileElem = document.querySelector('#fileElem')
  }

  configureOnFileChange (callback) {
    this.fileElem.onchange = event => callback(event.target.files)
  }

  configureFileBtnClick () {
    this.newFileBtn.onclick = () => this.fileElem.click()
  }

  getIcon(file) {
    return file.match(/.mp4/i)
      ? 'movie'
      : file.match(/\.jp|png/i)
        ? 'image'
        : 'content_copy'
  }

  makeIcon (file) {
    const icon = this.getIcon(file)
    const colors = {
      image: 'yellow600',
      movie: 'red600',
      file: ''
    }

    return `
      <i class="material-icons ${colors[icon]} left">${icon}</i>
    `
  }

  _formatterDate (date) {
    return new Intl.DateTimeFormat('pt', {
      locale: 'pt-br',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  updateCurrentFiles (files) {
    const template = (item) => `
      <tr>
        <td>${this.makeIcon(item.file)} ${item.file}</td>
        <td>${item.owner}</td>
        <td>${this._formatterDate(item.lastModified)}</td>
        <td>${item.size}</td>
      </tr>
    `
    this.tbody.innerHTML = files.map(template).join('')
  }
}

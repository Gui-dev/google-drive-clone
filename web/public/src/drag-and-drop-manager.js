
export class DragAndDropManager {
  constructor () {
    this.dropArea = document.querySelector('#dropArea')
    this.onDropHandler = () => {}
  }

  initialize ({ onDropHandler }) {
    this.onDropHandler = onDropHandler
    this.disableDragAndDropEvents()
    this.enableHighLightOnDrag()
    this.enableDrop()
  }


  disableDragAndDropEvents () {
    const events = [
      'dragenter',
      'dragover',
      'dragleave',
      'drop'
    ]
    const preventDefaults = event => {
      event.preventDefault()
      event.stopPropagation()
    }

    events.forEach(eventName => {
      this.dropArea.addEventListener(eventName, preventDefaults, false)
      document.body.addEventListener(eventName, preventDefaults, false)
    })
  }

  enableHighLightOnDrag () {
    const events = ['dragenter', 'dragover']
    const highlight = () => {
      this.dropArea.classList.add('highlight')
      this.dropArea.classList.add('drop-area')
    }
    events.forEach(eventName => {
      this.dropArea.addEventListener(eventName, highlight, false)
    })
  }

  enableDrop (event) {
    const drop = (e) => {
      this.dropArea.classList.remove('drop-area')
      const files = e.dataTransfer.files
      return this.onDropHandler(files)
    }
    this.dropArea.addEventListener('drop', drop, false)
  }
}

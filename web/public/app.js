import { AppController } from './src/app-controller.js'
import { ConnectionManager } from './src/connection-manager.js'
import { ViewManager } from './src/view-manager.js'
import { DragAndDropManager } from './src/drag-and-drop-manager.js'

const API_URL = 'https://localhost:3333'

const appController = new AppController({
  connectionManager: new ConnectionManager({
    apiUrl: API_URL,
  }),
  viewManager: new ViewManager(),
  dragAndDropManager: new DragAndDropManager()
})

try {
  appController.initialize()
} catch (error) {
  console.log('ERROR: ', error)
}


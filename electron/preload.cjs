const { contextBridge, ipcRenderer, webUtils } = require('electron')

const call = async (channel, ...args) => {
  const res = await ipcRenderer.invoke(channel, ...args)
  if (!res.ok) throw new Error(res.error)
  return res.data
}

const subscribe = (channel) => (cb) => {
  const listener = (_e, payload) => cb(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

contextBridge.exposeInMainWorld('studio', {
  getStatus: () => call('status:get'),
  getConfig: () => call('config:get'),
  saveConfig: (cfg) => call('config:save', cfg),
  getSettings: () => call('settings:get'),
  saveSettings: (patch) => call('settings:save', patch),
  installSpicetify: () => call('spicetify:install'),
  applyTheme: (cfg) => call('theme:apply', cfg),
  restore: () => call('theme:restore'),
  // file: sürükle-bırakla gelen File nesnesi (isteğe bağlı)
  pickMedia: (kind, file) => call('media:pick', kind, file ? webUtils.getPathForFile(file) : undefined),
  listThemes: () => call('library:list'),
  saveTheme: (cfg) => call('library:save', cfg),
  deleteTheme: (id) => call('library:delete', id),
  exportFile: (cfg) => call('file:export', cfg),
  importFile: () => call('file:import'),
  exportCode: (cfg) => call('share:export', cfg),
  importCode: (code) => call('share:import', code),
  openThemes: () => call('open:themes'),
  relaunch: () => call('app:relaunch'),
  onLog: subscribe('log'),
  onStatus: subscribe('status'),
})

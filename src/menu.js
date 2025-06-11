const { app, Menu, clipboard } = require('electron')
const isMac = process.platform === 'darwin';
const path = require('path');
const getMcpPath = () => {
  return path.join(app.getAppPath(), '../mcp.js');
}
const getMcpConfig = () => {
  return `"sf-toolkit-mcp": {
      "command": "node",
      "args": ["${getMcpPath()}"],
      "env": {}
    }`;
}

const template = [
  // { role: 'appMenu' }
  ...(isMac
    ? [{
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { label: 'MCP Config', click: async () => {
            console.log('MCP Config',getMcpConfig())
            const { dialog } = require('electron')
            const result = await dialog.showMessageBox({
              title: 'Get MCP Config',
              message: `node ${getMcpPath()}`,
              buttons: ['Copy MCP Configuration'],
              defaultId: 0,
              cancelId: 0,
            });
            console.log('result', result);
            if (result.response === 0) {
                clipboard.writeText(getMcpConfig())
            }
          } },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }]
    : []),
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac
        ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' }
          ]
        : [
            { role: 'close' }
          ])
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://sf-toolkit.com')
        }
      }
    ]
  }
];
const menu = Menu.buildFromTemplate(template)

module.exports = { menu };


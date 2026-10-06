const MENU_ID = 'lidar-inspect';
const BLOCKED =
  "Lidar can't run here. Chrome doesn't let extensions into chrome:// pages, the Chrome Web Store, or other extensions' pages.";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: MENU_ID, title: 'Inspect with Lidar', contexts: ['all'] });
});

/** "Lidar (⌥L)" on a Mac, "Lidar (Alt+L)" elsewhere: Chrome reports the shortcut as the user's keyboard prints it. */
async function title(): Promise<string> {
  const cmd = (await chrome.commands.getAll()).find(c => c.name === '_execute_action');
  return cmd?.shortcut ? `Lidar (${cmd.shortcut})` : 'Lidar';
}
void title().then(t => chrome.action.setTitle({ title: t }));

/** Runs content.js in the tab. content.js opens Lidar, or closes it when it's already open. */
async function toggle(tabId: number): Promise<boolean> {
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
    await chrome.action.setBadgeText({ tabId, text: '' });
    await chrome.action.setTitle({ tabId, title: await title() });
    return true;
  } catch {
    await chrome.action.setBadgeBackgroundColor({ tabId, color: '#8e8e93' });
    await chrome.action.setBadgeText({ tabId, text: '–' });
    await chrome.action.setTitle({ tabId, title: BLOCKED });
    return false;
  }
}

chrome.action.onClicked.addListener(tab => {
  if (tab.id != null) void toggle(tab.id);
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || tab?.id == null) return;
  const tabId = tab.id;
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'pin-next' }); // Lidar is already open
  } catch {
    if (await toggle(tabId)) await chrome.tabs.sendMessage(tabId, { type: 'pin-next' });
  }
});

chrome.runtime.onMessage.addListener((msg: { type?: string } | undefined, sender, reply) => {
  if (msg?.type === 'capture' && sender.tab) {
    chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' }).then(
      url => reply({ url }),
      (err: unknown) => reply({ error: String(err) }),
    );
    return true; // replies asynchronously
  }
  if (msg?.type === 'open-shortcuts') void chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  return undefined;
});

if (__TEST__) Object.assign(globalThis, { lidarToggle: toggle });

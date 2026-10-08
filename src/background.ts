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
    await explainBlocked(tabId);
    return false;
  }
}

/** The popup is set only while it opens, so the next click on an allowed page still toggles Lidar.
 *  Chrome before 127 can't open popups this way and keeps just the badge and tooltip. */
async function explainBlocked(tabId: number): Promise<void> {
  const url = (await chrome.tabs.get(tabId).catch(() => undefined))?.url ?? '';
  try {
    await chrome.action.setPopup({ tabId, popup: url.startsWith('file:') ? 'blocked.html?file' : 'blocked.html' });
    await chrome.action.openPopup();
  } catch {
    // No popup (old Chrome or unfocused window): the badge and tooltip still explain.
  } finally {
    await chrome.action.setPopup({ tabId, popup: '' });
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

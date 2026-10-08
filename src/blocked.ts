// blocked.html: the popup background.ts opens when Lidar can't run on a tab. "?file" means a local file that Lidar
// isn't allowed into yet, which the user can fix from Lidar's details page.
if (location.search === '?file') document.body.classList.add('local');

document.getElementById('details')?.addEventListener('click', () => {
  void chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` });
  close();
});

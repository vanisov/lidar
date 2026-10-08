// "?file" means a local file Lidar isn't allowed into yet; the user can fix that from Lidar's details page.
if (location.search === '?file') document.body.classList.add('local');

document.getElementById('details')?.addEventListener('click', () => {
  void chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` });
  close();
});

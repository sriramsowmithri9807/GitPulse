import { mountControls } from '../ui/controls.js';

const DASHBOARD_URL = 'https://gitpulse-dashboard.vercel.app';

mountControls(document.getElementById('app'), { advanced: false });

document.getElementById('open-dashboard').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: DASHBOARD_URL });
});

document.getElementById('open-options').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

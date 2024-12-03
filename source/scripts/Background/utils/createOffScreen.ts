﻿export const createOffscreen = async () => {
  await chrome.offscreen
    .createDocument({
      url: 'offscreen.html',
      reasons: [chrome.offscreen.Reason.BLOBS],
      justification: 'keep service worker running',
    })
    .catch(() => {});
};
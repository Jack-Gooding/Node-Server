// /https://notifyjs.jpillora.com/

// types = success, warn, info, error
export function createNotification(title, type = "info") {
  $.notify(title, type);
};

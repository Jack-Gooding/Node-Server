import {createNotification} from './helpers/notifier.js';
// src/main.js
$(document).ready(function() {

  $("body").css("background","black");
  $("*").click(function() {

    createNotification("hello");
  })
});

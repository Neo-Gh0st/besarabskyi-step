var TELEGRAM_BOT_TOKEN = '8737422467:AAEzLfb8K5SaVhl2ffCpPOaSiYfx5CLiKyY';

var MODERATOR_CHAT_IDS = ['6680739920'];

var ROOM_NAMES = {
  'family': 'Сімейний',
  'family-plus': 'Сімейний+',
  'family-lux': 'Сімейний Люкс',
  'family-2': 'Сімейний 2',
  'family-plus-2': 'Сімейний+ 2',
  'double-lux-1': 'Люкс 1',
  'double-lux-2': 'Люкс 2'
};

var PRICES = {
  'family': 1500,
  'family-plus': 2000,
  'family-lux': 3000,
  'family-2': 1500,
  'family-plus-2': 2000,
  'double-lux-1': 2500,
  'double-lux-2': 2500
};

function formatDate(d) {
  if (!d) return '';
  if (d instanceof Date) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }
  var s = String(d).trim();
  if (s.match(/^\d{4}-\d{2}-\d{2}/)) return s.substring(0, 10);
  return s;
}

function checkOverlap(sheet, roomType, dateIn, dateOut, excludeRow) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 6) return false;
  var data = sheet.getRange(6, 1, lastRow - 5, 9).getValues();
  for (var i = 0; i < data.length; i++) {
    var rowNum = 6 + i;
    if (excludeRow && rowNum === excludeRow) continue;
    var existingRoom = String(data[i][3]).trim();
    var existingStatus = String(data[i][8]).trim();
    var existingDateIn = formatDate(data[i][4]);
    var existingDateOut = formatDate(data[i][5]);
    if (existingRoom !== roomType) continue;
    if (existingStatus === 'Скасована') continue;
    if (dateIn <= existingDateOut && dateOut >= existingDateIn) {
      return { from: existingDateIn, to: existingDateOut, name: data[i][1] || 'Невідомий' };
    }
  }
  return false;
}

function doPost(e) {
  var rawData = {};
  if (e.postData && e.postData.contents) {
    try {
      rawData = JSON.parse(e.postData.contents);
    } catch(err) {
      var raw = e.postData.contents;
      var pairs = raw.split('&');
      for (var i = 0; i < pairs.length; i++) {
        var kv = pairs[i].split('=');
        rawData[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
      }
    }
  }

  if (rawData.update_id) {
    if (rawData.callback_query) {
      handleCallbackQuery(rawData.callback_query);
    }
    return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
  }

  if (rawData.action === 'review') {
    Logger.log('Routing to handleReview');
    return handleReview(rawData);
  }

  var data = rawData;
  if (!data.name && e.parameter && e.parameter.name) {
    data = e.parameter;
  }

  if (!data.name || !data.phone || !data.roomType || !data.dateIn || !data.dateOut) {
    return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
  }

  if (!ROOM_NAMES[data.roomType]) {
    return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();

  sheet.getRange('A1').setValue('База відпочинку «Бесарабський степ» — Заявки з сайту');
  sheet.getRange('A1:J1').merge().setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold').setFontSize(14).setHorizontalAlignment('center');
  sheet.setRowHeight(1, 40);

  sheet.getRange('A2').setValue('Автообробка заявок з сайта besarabskyi-step.github.io');
  sheet.getRange('A2:J2').merge().setBackground('#e2e8f0').setFontColor('#475569').setFontSize(10).setHorizontalAlignment('center');
  sheet.setRowHeight(2, 28);
  sheet.setRowHeight(3, 10);

  var headers = [['Дата / час', 'Ім\'я', 'Телефон', 'Тип розміщення', 'Дата заїзду', 'Дата виїзду', 'Кількість гостей', 'Коментар', 'Статус', 'Сума (грн)']];
  sheet.getRange(4, 1, 1, 10).setValues(headers);
  sheet.getRange(4, 1, 1, 10).setBackground('#1a73e8').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center').setFontSize(11);
  sheet.setRowHeight(4, 35);

  var hints = [['Коли заявлено', 'Як звати', 'Номер для зв\'язку', 'Тип', 'Заїзд', 'Виїзд', 'Гостей', 'Коментар', 'Статус', 'Загальна сума']];
  sheet.getRange(5, 1, 1, 10).setValues(hints);
  sheet.getRange(5, 1, 1, 10).setBackground('#dbeafe').setFontColor('#64748b').setFontStyle('italic').setFontSize(9).setHorizontalAlignment('center');
  sheet.setRowHeight(5, 25);
  sheet.setColumnWidths(1, 10, 150);
  sheet.setFrozenRows(5);

  var newDateIn = formatDate(data.dateIn);
  var newDateOut = formatDate(data.dateOut);
  var isAdmin = data.admin === '1' || data.admin === 1;

  if (!isAdmin) {
    var overlap = checkOverlap(sheet, data.roomType, newDateIn, newDateOut, null);
    if (overlap) {
      var overlapMsg = '❌ Бронювання неможливе!\n\nТип: ' + (ROOM_NAMES[data.roomType] || data.roomType) + '\nВаші дати: ' + newDateIn + ' — ' + newDateOut + '\n\nВже зайнято: ' + overlap.from + ' — ' + overlap.to + '\nКлієнт: ' + overlap.name;
      for (var i = 0; i < MODERATOR_CHAT_IDS.length; i++) {
        try {
          UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage', {
            method: 'post', contentType: 'application/json; charset=utf-8',
            payload: JSON.stringify({ chat_id: MODERATOR_CHAT_IDS[i], text: overlapMsg })
          });
        } catch (err) { Logger.log(err); }
      }
      var html = '<html><body><script>window.parent.postMessage("OVERLAP","*");</script></body></html>';
      return ContentService.createTextOutput(html).setMimeType(ContentService.MimeType.HTML);
    }
  }

  var now = new Date();
  var nights = 0;
  var totalPrice = parseInt(data.totalPrice) || 0;
  if (!totalPrice && data.roomType && data.dateIn && data.dateOut && PRICES[data.roomType]) {
    var d1 = new Date(newDateIn);
    var d2 = new Date(newDateOut);
    nights = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    totalPrice = nights * PRICES[data.roomType];
  } else if (data.nights) {
    nights = parseInt(data.nights) || 0;
  }
  var pricePerDay = PRICES[data.roomType] || 0;

  var rowData = [
    now.toLocaleString('uk-UA'),
    data.name, data.phone, data.roomType,
    data.dateIn, data.dateOut, data.guests,
    (isAdmin ? '[Телефон] ' : '') + (data.comment || ''),
    isAdmin ? 'Підтверджена' : 'Нова',
    totalPrice
  ];

  var newRow = sheet.getLastRow() + 1;
  sheet.getRange(newRow, 1, 1, 10).setValues([rowData]);
  sheet.getRange(newRow, 1, 1, 10).setHorizontalAlignment('center').setVerticalAlignment('middle').setBorder(true, true, true, true, true, true);
  if (newRow % 2 === 0) sheet.getRange(newRow, 1, 1, 10).setBackground('#f0f7ff');
  sheet.getRange(newRow, 9).setFontColor(isAdmin ? '#166534' : '#d93025').setFontWeight('bold');
  sheet.getRange(newRow, 10).setFontWeight('bold').setNumberFormat('#,##0');

  var headerText = isAdmin ? '📞 *БРОНЮВАННЯ ПО ТЕЛЕФОНУ*' : '📩 *НОВА ЗАЯВКА*';
  var tgMsgText = '━━━━━━━━━━━━━━━\n' + headerText + '\n━━━━━━━━━━━━━━━\n\n' +
    '👤 *Ім\'я:* ' + data.name + '\n' +
    '📞 *Телефон:* ' + data.phone + '\n' +
    '🏠 *Тип:* ' + (ROOM_NAMES[data.roomType] || data.roomType) + '\n\n' +
    '📅 *Заїзд:* ' + data.dateIn + '\n' +
    '📅 *Виїзд:* ' + data.dateOut + '\n' +
    '👥 *Гостей:* ' + data.guests + '\n';
  if (totalPrice > 0) {
    tgMsgText += '\n💰 *Сума:* ' + totalPrice.toLocaleString('uk-UA') + ' грн';
    if (nights > 0 && pricePerDay > 0) {
      tgMsgText += ' (' + nights + ' дн. × ' + pricePerDay.toLocaleString('uk-UA') + ' грн)';
    }
    tgMsgText += '\n';
  }
  if (data.comment) tgMsgText += '\n💬 *Коментар:*\n' + data.comment + '\n';
  tgMsgText += '\n━━━━━━━━━━━━━━━\n🆔 Заявка #' + newRow;

  for (var i = 0; i < MODERATOR_CHAT_IDS.length; i++) {
    try {
      UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage', {
        method: 'post', contentType: 'application/json; charset=utf-8',
        payload: JSON.stringify({
          chat_id: MODERATOR_CHAT_IDS[i],
          text: tgMsgText,
          parse_mode: 'Markdown',
          reply_markup: JSON.stringify({
            inline_keyboard: [[
              { text: '✅ Підтвердити', callback_data: 'confirm_' + newRow },
              { text: '❌ Скасувати', callback_data: 'cancel_' + newRow }
            ]]
          })
        })
      });
    } catch (err) { Logger.log(err); }
  }

  var html = '<html><body><script>window.parent.postMessage("OK","*");</script></body></html>';
  return ContentService.createTextOutput(html).setMimeType(ContentService.MimeType.HTML);
}

function getBookedDates(e) {
  checkExpiredBookings();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 6) return ContentService.createTextOutput('[]').setMimeType(ContentService.MimeType.JSON);
  var data = sheet.getRange(6, 1, lastRow - 5, 9).getValues();
  var booked = [];
  for (var i = 0; i < data.length; i++) {
    var status = String(data[i][8]).trim();
    var roomType = String(data[i][3]).trim();
    if (status === 'Підтверджена') {
      var dateIn = formatDate(data[i][4]);
      var dateOut = formatDate(data[i][5]);
      if (dateIn && dateOut) booked.push({ from: dateIn, to: dateOut, room: roomType });
    }
  }
  var result = JSON.stringify(booked);
  var callback = e.parameter.callback;
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + result + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.JSON);
}

function checkExpiredBookings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 6) return 0;
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var data = sheet.getRange(6, 1, lastRow - 5, 9).getValues();
  var updated = 0;
  for (var i = 0; i < data.length; i++) {
    var rowNum = 6 + i;
    var status = String(data[i][8]).trim();
    if (status !== 'Нова' && status !== 'Підтверджена') continue;
    var dateOut = formatDate(data[i][5]);
    if (!dateOut) continue;
    if (new Date(dateOut + 'T00:00:00') < today) {
      sheet.getRange(rowNum, 9).setValue('Завершено').setFontColor('#166534').setFontWeight('bold');
      updated++;
    }
  }
  updateSeasonSummary(sheet);
  return updated;
}

function updateSeasonSummary(sheet) {
  if (!sheet) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.getActiveSheet();
  }
  var lastRow = sheet.getLastRow();
  var totalSum = 0;
  var confirmedCount = 0;
  var totalNights = 0;
  if (lastRow >= 6) {
    var data = sheet.getRange(6, 1, lastRow - 5, 10).getValues();
    for (var i = 0; i < data.length; i++) {
      var status = String(data[i][8]).trim();
      if (status === 'Підтверджена' || status === 'Завершено') {
        var sum = parseInt(data[i][9]) || 0;
        totalSum += sum;
        confirmedCount++;
        var dIn = formatDate(data[i][4]);
        var dOut = formatDate(data[i][5]);
        if (dIn && dOut) {
          var nights = Math.round((new Date(dOut) - new Date(dIn)) / (1000 * 60 * 60 * 24));
          totalNights += nights;
        }
      }
    }
  }
  var summaryRow = 3;
  sheet.getRange(summaryRow, 1).setValue('📊 Сезон: підтверджено ' + confirmedCount + ' бронювань | ' + totalNights + ' ночей | ' + totalSum.toLocaleString('uk-UA') + ' грн').setBackground('#fef3c7').setFontColor('#92400e').setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center');
  sheet.getRange(summaryRow, 1, 1, 10).merge();
}

function handleReview(data) {
  Logger.log('handleReview called: ' + JSON.stringify(data));
  if (!data.name || !data.text || !data.rating) {
    Logger.log('handleReview: missing fields');
    return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var reviewSheet = ss.getSheetByName('Reviews');
  if (!reviewSheet) {
    reviewSheet = ss.insertSheet('Reviews');
    reviewSheet.getRange(1, 1, 1, 5).setValues([['Дата', 'Ім\'я', 'Текст', 'Оцінка', 'Статус']]);
    reviewSheet.getRange(1, 1, 1, 5).setBackground('#1a73e8').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
    reviewSheet.setFrozenRows(1);
    reviewSheet.setColumnWidths(1, 5, 180);
  }
  var now = new Date();
  var rowData = [now.toLocaleString('uk-UA'), data.name, data.text, parseInt(data.rating) || 5, 'Новий'];
  reviewSheet.getRange(reviewSheet.getLastRow() + 1, 1, 1, 5).setValues([rowData]);
  var rowNum = reviewSheet.getLastRow();
  Logger.log('Review saved to row: ' + rowNum);

  var tgMsg = '⭐ НОВИЙ ВІДГУК\n\n👤 ' + data.name + '\n⭐ ' + data.rating + '/5\n\n💬 ' + data.text;
  Logger.log('Sending to chat IDs: ' + MODERATOR_CHAT_IDS.join(', '));
  for (var i = 0; i < MODERATOR_CHAT_IDS.length; i++) {
    try {
      var result = UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage', {
        method: 'post', contentType: 'application/json; charset=utf-8',
        payload: JSON.stringify({
          chat_id: MODERATOR_CHAT_IDS[i],
          text: tgMsg,
          reply_markup: JSON.stringify({
            inline_keyboard: [[
              { text: '✅ Опублікувати', callback_data: 'review_approve_' + rowNum },
              { text: '❌ Відхилити', callback_data: 'review_reject_' + rowNum }
            ]]
          })
        })
      });
      Logger.log('Telegram result for ' + MODERATOR_CHAT_IDS[i] + ': ' + result.getContentText());
    } catch (err) {
      Logger.log('Telegram error for ' + MODERATOR_CHAT_IDS[i] + ': ' + err.toString());
    }
  }

  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
}

function getApprovedReviews() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var reviewSheet = ss.getSheetByName('Reviews');
  if (!reviewSheet) return [];
  var lastRow = reviewSheet.getLastRow();
  if (lastRow < 2) return [];
  var data = reviewSheet.getRange(2, 1, lastRow - 1, 5).getValues();
  var reviews = [];
  for (var i = 0; i < data.length; i++) {
    var status = String(data[i][4]).trim();
    if (status === 'Опубліковано') {
      var monthNames = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
      var d = new Date(data[i][0]);
      var dateLabel = monthNames[d.getMonth()] + ' ' + d.getFullYear();
      reviews.push({ text: String(data[i][2]), author: String(data[i][1]), date: dateLabel, stars: parseInt(data[i][3]) || 5 });
    }
  }
  return reviews;
}

function doGet(e) {
  var action = e.parameter.action;
  if (action === 'booked') return getBookedDates(e);
  if (action === 'reviews') {
    var reviews = getApprovedReviews();
    return ContentService.createTextOutput(JSON.stringify(reviews)).setMimeType(ContentService.MimeType.JSON);
  }
  if (action === 'check') {
    var updated = checkExpiredBookings();
    return ContentService.createTextOutput('Оновлено: ' + updated + ' записів').setMimeType(ContentService.MimeType.TEXT);
  }
  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
}

function handleCallbackQuery(callbackQuery) {
  var data = callbackQuery.data;
  var message = callbackQuery.message;
  if (!data || !message) return;
  var parts = data.split('_');
  var action = parts[0];
  var rowId = parseInt(parts[parts.length - 1]);
  if (!rowId) return;

  if (action === 'review') {
    var reviewAction = parts[1];
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var reviewSheet = ss.getSheetByName('Reviews');
    if (!reviewSheet) return;
    var rowNum = rowId;
    if (rowNum > reviewSheet.getLastRow()) return;
    var newStatus = reviewAction === 'approve' ? 'Опубліковано' : 'Відхилено';
    var emoji = reviewAction === 'approve' ? '✅' : '❌';
    reviewSheet.getRange(rowNum, 5).setValue(newStatus);
    var newText = message.text + '\n\n' + emoji + ' *Статус:* ' + newStatus;
    try {
      UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/editMessageText', {
        method: 'post', contentType: 'application/json; charset=utf-8',
        payload: JSON.stringify({
          chat_id: message.chat.id, message_id: message.message_id,
          text: newText, parse_mode: 'Markdown',
          reply_markup: JSON.stringify({ inline_keyboard: [] })
        })
      });
    } catch (err) { Logger.log(err); }
    try {
      UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/answerCallbackQuery', {
        method: 'post', contentType: 'application/json; charset=utf-8',
        payload: JSON.stringify({ callback_query_id: callbackQuery.id, text: newStatus })
      });
    } catch (err) { Logger.log(err); }
    return;
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var targetRow = -1;
  for (var i = 6; i <= lastRow; i++) {
    if (i === rowId) { targetRow = i; break; }
  }
  if (targetRow === -1) return;
  var newStatus = action === 'confirm' ? 'Підтверджена' : 'Скасована';
  var emoji = action === 'confirm' ? '✅' : '❌';
  var btnText = action === 'confirm' ? 'Підтверджено' : 'Скасовано';
  sheet.getRange(targetRow, 9).setValue(newStatus);
  sheet.getRange(targetRow, 9).setFontColor(action === 'confirm' ? '#166534' : '#dc2626').setFontWeight('bold');
  updateSeasonSummary(sheet);
  var newText = message.text + '\n\n' + emoji + ' *Статус:* ' + btnText;
  try {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/editMessageText', {
      method: 'post', contentType: 'application/json; charset=utf-8',
      payload: JSON.stringify({
        chat_id: message.chat.id, message_id: message.message_id,
        text: newText, parse_mode: 'Markdown',
        reply_markup: JSON.stringify({ inline_keyboard: [] })
      })
    });
  } catch (err) { Logger.log(err); }
  try {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/answerCallbackQuery', {
      method: 'post', contentType: 'application/json; charset=utf-8',
      payload: JSON.stringify({ callback_query_id: callbackQuery.id, text: btnText })
    });
  } catch (err) { Logger.log(err); }
}

function setWebhook() {
  var webAppUrl = 'https://script.google.com/macros/s/AKfycbzNACUD2FO4cCRQw1IcqdKxRYvsPAdRzA4vy-1d3ErKQbe1HGl76mtzPoUHR_Uu3nKTZw/exec';
  var result = UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/setWebhook', {
    method: 'post', contentType: 'application/json; charset=utf-8',
    payload: JSON.stringify({ url: webAppUrl, allowed_updates: ['callback_query', 'message'] })
  });
  return result.getContentText();
}

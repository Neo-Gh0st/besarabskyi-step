var TELEGRAM_BOT_TOKEN = '8737422467:AAEzLfb8K5SaVhl2ffCpPOaSiYfx5CLiKyY';
var TELEGRAM_CHAT_ID = '6680739920';

function doPost(e) {
  var data = {};

  if (e.parameter && e.parameter.name) {
    data = e.parameter;
  } else if (e.postData && e.postData.contents) {
    var raw = e.postData.contents;
    var pairs = raw.split('&');
    for (var i = 0; i < pairs.length; i++) {
      var kv = pairs[i].split('=');
      data[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
    }
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var now = new Date();
  sheet.appendRow([
    now.toLocaleString('uk-UA'),
    data.name || '',
    data.phone || '',
    data.roomType || '',
    data.dateIn || '',
    data.dateOut || '',
    data.guests || '',
    data.comment || '',
    'Новая'
  ]);

  var roomNames = {
    'standart': 'Стандарт',
    'cottage': 'Коттедж',
    'lux': 'Люкс'
  };

  var msg = 'НОВАЯ ЗАЯВКА\n\n' +
    'Имя: ' + (data.name || '-') + '\n' +
    'Телефон: ' + (data.phone || '-') + '\n' +
    'Тип: ' + (roomNames[data.roomType] || data.roomType || '-') + '\n' +
    'Заезд: ' + (data.dateIn || '-') + '\n' +
    'Выезд: ' + (data.dateOut || '-') + '\n' +
    'Гостей: ' + (data.guests || '-') + '\n' +
    'Комментарий: ' + (data.comment || '-');

  try {
    UrlFetchApp.fetch(
      'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage',
      {
        method: 'post',
        contentType: 'application/json; charset=utf-8',
        payload: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: msg
        })
      }
    );
  } catch (err) {
    // Telegram error, still save to sheet
  }

  return ContentService.createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
  return ContentService.createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

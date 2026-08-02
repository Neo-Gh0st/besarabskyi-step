var TELEGRAM_BOT_TOKEN = '8737422467:AAEzLfb8K5SaVhl2ffCpPOaSiYfx5CLiKyY';
var TELEGRAM_CHAT_ID = '6680739920';

function doPost(e) {
  return processRequest(e);
}

function doGet(e) {
  return processRequest(e);
}

function processRequest(e) {
  try {
    var data = e.parameter || {};

    if (!data.name && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch(err) {
        var params = e.postData.contents.split('&');
        for (var i = 0; i < params.length; i++) {
          var pair = params[i].split('=');
          data[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
        }
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

    var telegramMessage = 'НОВАЯ ЗАЯВКА\n\n' +
      'Имя: ' + (data.name || '') + '\n' +
      'Телефон: ' + (data.phone || '') + '\n' +
      'Тип: ' + (roomNames[data.roomType] || data.roomType || '') + '\n' +
      'Заезд: ' + (data.dateIn || '') + '\n' +
      'Выезд: ' + (data.dateOut || '') + '\n' +
      'Гостей: ' + (data.guests || '') + '\n' +
      (data.comment ? 'Комментарий: ' + data.comment + '\n' : '');

    var url = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage';
    var payload = {
      chat_id: TELEGRAM_CHAT_ID,
      text: telegramMessage
    };
    var options = {
      method: 'post',
      contentType: 'application/json; charset=utf-8',
      payload: JSON.stringify(payload)
    };
    UrlFetchApp.fetch(url, options);

    var result = JSON.stringify({status: 'ok'});
    var callback = e.parameter.callback;

    if (callback) {
      return ContentService.createTextOutput(callback + '(' + result + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(result)
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    var result = JSON.stringify({status: 'error', message: error.toString()});
    var callback = e.parameter.callback;

    if (callback) {
      return ContentService.createTextOutput(callback + '(' + result + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(result)
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
}

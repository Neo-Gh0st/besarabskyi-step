var TELEGRAM_BOT_TOKEN = '8737422467:AAEzLfb8K5SaVhl2ffCpPOaSiYfx5CLiKyY';
var TELEGRAM_CHAT_ID = '6680739920';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // Сохраняем в Google Таблицу
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
    
    // Отправляем в Telegram
    var roomNames = {
      'standart': 'Стандарт',
      'cottage': 'Коттедж',
      'lux': 'Люкс'
    };
    
    var telegramMessage = 'НОВАЯ ЗАЯВКА\n\n' +
      'Имя: ' + data.name + '\n' +
      'Телефон: ' + data.phone + '\n' +
      'Тип: ' + (roomNames[data.roomType] || data.roomType) + '\n' +
      'Заезд: ' + data.dateIn + '\n' +
      'Выезд: ' + data.dateOut + '\n' +
      'Гостей: ' + data.guests + '\n' +
      (data.comment ? 'Комментарий: ' + data.comment + '\n' : '');
    
    var url = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage';
    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: telegramMessage,
        parse_mode: 'HTML'
      })
    });
    
    return ContentService.createTextOutput(JSON.stringify({status: 'ok'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('OK');
}

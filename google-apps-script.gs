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

  // === Google Таблица ===
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var lastRow = sheet.getLastRow();

  // Заголовки в первой строке
  if (lastRow <= 1) {
    var headers = [['Дата', 'Имя', 'Телефон', 'Тип', 'Заезд', 'Выезд', 'Гостей', 'Комментарий', 'Статус']];
    sheet.getRange(1, 1, 1, 9).setValues(headers);
    sheet.getRange(1, 1, 1, 9)
      .setBackground('#1a73e8')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setFontSize(11);
    sheet.setColumnWidths(1, 9, 150);
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 150);
    sheet.setColumnWidth(3, 150);
    sheet.setColumnWidth(9, 120);
    sheet.setFrozenRows(1);
  }

  // Данные
  var now = new Date();
  var rowData = [
    now.toLocaleString('uk-UA'),
    data.name || '',
    data.phone || '',
    data.roomType || '',
    data.dateIn || '',
    data.dateOut || '',
    data.guests || '',
    data.comment || '',
    'Новая'
  ];

  var newRow = sheet.getLastRow() + 1;
  sheet.getRange(newRow, 1, 1, 9).setValues([rowData]);
  sheet.getRange(newRow, 1, 1, 9)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true);

  // Цвет строки
  if (newRow % 2 === 0) {
    sheet.getRange(newRow, 1, 1, 9).setBackground('#f0f7ff');
  }

  // Статус "Новая" красным
  sheet.getRange(newRow, 9)
    .setFontColor('#d93025')
    .setFontWeight('bold');

  // === Telegram ===
  var roomNames = {
    'standart': '🏠 Стандарт',
    'cottage': '🏡 Коттедж',
    'lux': '🏰 Люкс'
  };

  var msg = '━━━━━━━━━━━━━━━\n' +
    '📩 *НОВАЯ ЗАЯВКА*\n' +
    '━━━━━━━━━━━━━━━\n\n' +
    '👤 *Имя:* ' + (data.name || '-') + '\n' +
    '📞 *Телефон:* ' + (data.phone || '-') + '\n' +
    '🏠 *Тип:* ' + (roomNames[data.roomType] || data.roomType || '-') + '\n\n' +
    '📅 *Заезд:* ' + (data.dateIn || '-') + '\n' +
    '📅 *Выезд:* ' + (data.dateOut || '-') + '\n' +
    '👥 *Гостей:* ' + (data.guests || '-') + '\n';

  if (data.comment) {
    msg += '\n💬 *Комментарий:*\n' + data.comment + '\n';
  }

  msg += '\n━━━━━━━━━━━━━━━\n' +
    '🆔 Заявка #' + newRow;

  try {
    UrlFetchApp.fetch(
      'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage',
      {
        method: 'post',
        contentType: 'application/json; charset=utf-8',
        payload: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: msg,
          parse_mode: 'Markdown'
        })
      }
    );
  } catch (err) {}

  return ContentService.createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
  return ContentService.createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

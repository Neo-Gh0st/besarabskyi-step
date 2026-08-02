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
    // Строка 1: Название
    sheet.getRange('A1').setValue('База отдыха «Бесарабський степ» — Заявки с сайта');
    sheet.getRange('A1:I1').merge()
      .setBackground('#1e293b')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setFontSize(14)
      .setHorizontalAlignment('center');
    sheet.setRowHeight(1, 40);

    // Строка 2: Описание
    sheet.getRange('A2').setValue('Автообработка заявок с сайта besarabskyi-step.github.io. Заявки приходят в таблицу и Telegram автоматически.');
    sheet.getRange('A2:I2').merge()
      .setBackground('#e2e8f0')
      .setFontColor('#475569')
      .setFontSize(10)
      .setHorizontalAlignment('center');
    sheet.setRowHeight(2, 28);

    // Строка 3: Пустая
    sheet.setRowHeight(3, 10);

    // Строка 4: Заголовки
    var headers = [['Дата / время', 'Имя', 'Телефон', 'Тип размещения', 'Дата заезда', 'Дата выезда', 'Кол-во гостей', 'Комментарий', 'Статус']];
    sheet.getRange(4, 1, 1, 9).setValues(headers);
    sheet.getRange(4, 1, 1, 9)
      .setBackground('#1a73e8')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setFontSize(11);
    sheet.setRowHeight(4, 35);

    // Строка 5: Подсказки
    var hints = [['Когда заявлено', 'Как зовут', 'Номер для связи', 'Стандарт / Коттедж / Люкс', 'С какого числа', 'По какое число', 'Сколько человек', 'Пожелания клиента', 'Новая / Подтверждена / Отменена']];
    sheet.getRange(5, 1, 1, 9).setValues(hints);
    sheet.getRange(5, 1, 1, 9)
      .setBackground('#dbeafe')
      .setFontColor('#64748b')
      .setFontStyle('italic')
      .setFontSize(9)
      .setHorizontalAlignment('center');
    sheet.setRowHeight(5, 25);

    sheet.setColumnWidths(1, 9, 150);
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 150);
    sheet.setColumnWidth(3, 150);
    sheet.setColumnWidth(8, 200);
    sheet.setColumnWidth(9, 140);
    sheet.setFrozenRows(5);
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
  var action = e.parameter.action;

  if (action === 'booked') {
    return getBookedDates(e);
  }

  return ContentService.createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

function getBookedDates(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var lastRow = sheet.getLastRow();

  if (lastRow < 6) {
    return ContentService.createTextOutput('[]')
      .setMimeType(ContentService.MimeType.JSON);
  }

  var data = sheet.getRange(6, 1, lastRow - 5, 9).getValues();
  var booked = [];

  for (var i = 0; i < data.length; i++) {
    var status = String(data[i][8]).trim();
    var dateIn = String(data[i][4]).trim();
    var dateOut = String(data[i][5]).trim();
    var roomType = String(data[i][3]).trim();

    if (status === 'Новая' || status === 'Подтверждена') {
      if (dateIn && dateOut) {
        booked.push({
          from: dateIn,
          to: dateOut,
          room: roomType
        });
      }
    }
  }

  var result = JSON.stringify(booked);
  var callback = e.parameter.callback;

  if (callback) {
    return ContentService.createTextOutput(callback + '(' + result + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    return ContentService.createTextOutput(result)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

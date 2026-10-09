function buildResponse(success, data, message, errorCode) {
  return {
    success: !!success,
    data: data || null,
    message: message || '',
    errorCode: errorCode || null
  };
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function generateId(prefix) {
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'UTC', 'yyyyMMddHHmmss');
  var random = Math.random().toString(36).slice(2, 9);
  return (prefix || 'ID') + '-' + stamp + '-' + random;
}

function normalizeEmail(email) {
  if (!email) {
    return '';
  }
  return String(email).trim().toLowerCase();
}

function sheetToObjects(sheet) {
  if (!sheet) {
    return [];
  }

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return [];
  }

  var headers = values[0];
  var rows = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j] !== undefined ? row[j] : '';
    }
    rows.push(obj);
  }

  return rows;
}

function findRowByKey(sheetName, keyName, keyValue) {
  var sheet = getSystemSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    return null;
  }

  var data = sheetToObjects(sheet);
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][keyName] || '').toLowerCase() === String(keyValue || '').toLowerCase()) {
      return data[i];
    }
  }

  return null;
}

function isEmptyValue(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
}

function ensureScriptProperty(key, value) {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty(key)) {
    props.setProperty(key, value);
  }
}

function getScriptProperty(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

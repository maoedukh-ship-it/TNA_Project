function getSystemSpreadsheet() {
  var spreadsheetId = getScriptProperty(TNA_CONFIG.SPREADSHEET_ID_PROPERTY_KEY);

  if (!spreadsheetId) {
    throw new Error('The TNA spreadsheet is not configured. Set TNA_SPREADSHEET_ID in Apps Script project settings.');
  }

  try {
    return SpreadsheetApp.openById(spreadsheetId);
  } catch (e) {
    throw new Error('Unable to access the configured TNA spreadsheet. Confirm that the account running this Apps Script has Editor access. Details: ' + e.message);
  }
}

function ensureSheet(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  } else {
    var firstRow = sheet.getRange(1, 1, 1, Math.max(headers.length, sheet.getLastColumn())).getValues()[0];
    var missingHeader = false;
    for (var i = 0; i < headers.length; i++) {
      if (!firstRow.includes(headers[i])) {
        missingHeader = true;
        break;
      }
    }

    if (missingHeader) {
      var existingHeaderCount = firstRow.length;
      for (var j = 0; j < headers.length; j++) {
        if (!firstRow.includes(headers[j])) {
          sheet.getRange(1, existingHeaderCount + 1).setValue(headers[j]);
          existingHeaderCount = existingHeaderCount + 1;
        }
      }
    }
  }

  return sheet;
}

function getSheetByName(sheetName) {
  return getSystemSpreadsheet().getSheetByName(sheetName);
}

function getAllSheetNames() {
  return Object.keys(TNA_CONFIG.SHEETS).map(function(key) {
    return TNA_CONFIG.SHEETS[key];
  });
}

function appendRowToSheet(sheetName, rowValues) {
  var sheet = getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }
  sheet.appendRow(rowValues);
  return true;
}

function getTableData(sheetName) {
  var sheet = getSheetByName(sheetName);
  if (!sheet) {
    return [];
  }
  return sheetToObjects(sheet);
}

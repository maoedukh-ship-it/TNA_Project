function createAssessmentSnapshot(tnaId, versionNumber, assessmentData, createdBy, changeReason) {
  var sheet = getSheetByName(TNA_CONFIG.SHEETS.TNA_VERSIONS);
  if (!sheet) {
    throw new Error('TNA_Versions sheet is missing.');
  }

  sheet.appendRow([
    generateId('VER'),
    tnaId,
    versionNumber,
    JSON.stringify(assessmentData || {}),
    createdBy || getCurrentUserEmail(),
    getCurrentTimestamp(),
    changeReason || 'Assessment update'
  ]);

  return true;
}

function getVersionHistory(tnaId) {
  var sheet = getSheetByName(TNA_CONFIG.SHEETS.TNA_VERSIONS);
  if (!sheet) {
    return [];
  }

  var rows = sheetToObjects(sheet).filter(function(row) {
    return String(row.TNAID || '').toLowerCase() === String(tnaId || '').toLowerCase();
  });

  return rows.sort(function(a, b) {
    return Number(a.VersionNumber || 0) - Number(b.VersionNumber || 0);
  });
}

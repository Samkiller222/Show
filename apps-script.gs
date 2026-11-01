// MNCF show results sync. Paste into Extensions > Apps Script in the results Google Sheet,
// then Deploy > New deployment > Web app, Execute as: Me, Who has access: Anyone.
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    (data.tabs || []).forEach(function (t) {
      var sh = ss.getSheetByName(t.name) || ss.insertSheet(t.name);
      sh.clearContents();
      var rows = t.rows || [];
      if (rows.length) {
        var w = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
        var grid = rows.map(function (r) { var x = r.map(function (v) { return v == null ? "" : v; }); while (x.length < w) x.push(""); return x; });
        sh.getRange(1, 1, grid.length, w).setValues(grid);
        sh.getRange(1, 1, 1, w).setFontWeight("bold");
        sh.setFrozenRows(1);
        sh.getRange(1, w + 2).setValue("Updated " + Utilities.formatDate(new Date(), "Europe/Malta", "d MMM HH:mm:ss"));
      }
    });
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
function doGet() {
  return ContentService.createTextOutput("MNCF results sync is running.");
}

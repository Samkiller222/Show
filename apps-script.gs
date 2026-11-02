// MNCF show database. The Google Sheet "MNCF November 2026 Show Results" is the database.
// Deploy as a web app (Execute as: Me, Who has access: Anyone). Every request except the old
// results sync needs the team password from the Settings tab.
// After pasting a new version: run setupSheet once, then Deploy > Manage deployments > Edit > New version.

var SHEET_ID = "1WUewn_cLPeipR-GvvWqZRtmhWd59T8NYRQAh9n6VsgI";
var SITE_URL = "https://samkiller222.github.io/Show/";
var GROUPS = ["Utility", "Hound", "Gundog", "Toy", "Working", "Terrier", "Pastoral"];
var CLASSES = ["Puppy Dog", "Puppy Bitch", "Junior Dog", "Junior Bitch", "Open Dog", "Open Bitch", "Veteran Dog", "Veteran Bitch", "AV Locally Bred", "Junior Handler", "Childrens Class"];
var LEGACY_TABS = ["Sat 31 Oct", "Sun morning", "Sun evening", "Absent", "Best in Show"];
var SEED = {"breeds":[["Boston Terrier","Utility"],["Bulldog","Utility"],["French Bulldog","Utility"],["Japanese Shiba Inu","Utility"],["Poodle (Miniature)","Utility"],["Poodle (Standard)","Utility"],["Poodle (Toy)","Utility"],["Shih Tzu","Utility"],["Basenji","Hound"],["Dachshund (Miniature Long Haired)","Hound"],["Dachshund (Miniature Smooth Haired)","Hound"],["Dachshund (Miniature Wire Haired)","Hound"],["Dachshund (Smooth Haired)","Hound"],["Irish Wolfhound","Hound"],["Pharaoh Hound","Hound"],["Saluki","Hound"],["Whippet","Hound"],["English Setter","Gundog"],["Pointer","Gundog"],["Retriever (Flatcoated)","Gundog"],["Retriever (Golden)","Gundog"],["Retriever (Labrador)","Gundog"],["Spaniel (Cocker)","Gundog"],["Spaniel (English Springer)","Gundog"],["Spanish Water Dog","Gundog"],["Cavalier King Charles Spaniel","Toy"],["Chihuahua (Long Coat)","Toy"],["Chihuahua (Smooth Coat)","Toy"],["Lowchen (Little Lion Dog)","Toy"],["Maltese","Toy"],["Pekingese","Toy"],["Pomeranian","Toy"],["Pug","Toy"],["Border Collie","Working"],["Boxer","Working"],["Bullmastiff","Working"],["Canadian Eskimo Dog","Working"],["Dobermann","Working"],["German Shepherd Dog","Working"],["Rottweiler","Working"],["Siberian Husky","Working"],["Welsh Corgi (Pembroke)","Working"],["Bull Terrier","Terrier"],["Fox Terrier (Wire)","Terrier"],["Staffordshire Bull Terrier","Terrier"]],"dogs":[["LARISSA DI NOBILE MORGANA","Boston Terrier","Bitch"],["LILLIBETH THE QUEEN BRIGHT DIAMOND","Bulldog","Bitch"],["Ch. KAYLA BRIGHT DIAMOND","Bulldog","Bitch"],["KIRA FROM DRACULA'S BLOODLINE","French Bulldog","Bitch"],["HUGO BOSS VILLA LENSSTYLE","French Bulldog","Dog"],["RICVAS MELEK","Japanese Shiba Inu","Bitch"],["NIK MAJESTIK MIRAI","Japanese Shiba Inu","Bitch"],["AKAI HANA B'SEIDI MERC","Japanese Shiba Inu","Dog"],["Ch. DAMYOSHI BUSHI","Japanese Shiba Inu","Dog"],["EVIDDENTE OVER THE EDGE","Poodle (Miniature)","Dog"],["SHUVALOFF OPPOSITES ATTRACT","Poodle (Standard)","Bitch"],["EDIVETTE MI CORAZON NIEVA","Poodle (Standard)","Bitch"],["EDIVETTE COMO MIRARTE","Poodle (Standard)","Dog"],["MALENKAYA LEDI","Poodle (Toy)","Bitch"],["M AND C SIGNATURE ALLURE","Poodle (Toy)","Dog"],["DEMITRA INCANTO D'AMORE","Shih Tzu","Bitch"],["Ch. PERLA SOLO PER I TUOI OCCHI","Shih Tzu","Bitch"],["M WAMI'S SINNERS PRAYER","Basenji","Dog"],["Ch. MANICARO DIESEL DAF","Basenji","Dog"],["MARILYN MONROE DI CAMPO LUNGO","Dachshund (Miniature Long Haired)","Bitch"],["GRACE KELLY DI CAMPO LUNGO","Dachshund (Miniature Long Haired)","Bitch"],["Ch. ESME HISROYALMAJESTY","Dachshund (Miniature Long Haired)","Bitch"],["Ch. GATEAU ROUGE DELLA ROCO DEI PAPI","Dachshund (Miniature Long Haired)","Dog"],["DIFFERENT STRINGS DARLA","Dachshund (Miniature Smooth Haired)","Bitch"],["MAGIK RAINBOW FORD TOM","Dachshund (Miniature Wire Haired)","Dog"],["WAKYWILKS HERCULES","Dachshund (Smooth Haired)","Dog"],["HAZEL DELLA BASSA PAVESE","Irish Wolfhound","Bitch"],["FURIA FARGO MITIS ARAFA","Irish Wolfhound","Dog"],["TOBERCORRAN THUNDER","Irish Wolfhound","Dog"],["RAMSEY","Pharaoh Hound","Dog"],["Ch. GABRA CK ALEXANDER HELIOS","Saluki","Dog"],["NOTABLE DHALIA","Whippet","Bitch"],["DAKOTA ALEXEM DREAM","Whippet","Bitch"],["CHRISOLI DA YA THINK I'M SEXY","Whippet","Bitch"],["NOTABLE CHEDDAR","Whippet","Dog"],["Ch. SUNTACH HE IS","Whippet","Dog"],["Sh.Ch. DINGLI GEM ELEGY FOR THE ARCTIC","English Setter","Dog"],["Sh.Ch. BERSEYDALE FULL HOUSE","Pointer","Bitch"],["CHESTERHOPE LANCELOT","Pointer","Dog"],["Sh.Ch. BERSIFJOR MODO MIRACOLOSO","Retriever (Flatcoated)","Dog"],["RASHKA.B OF DREAMS KENNEL","Retriever (Golden)","Bitch"],["AMAZING GRACE DE LAR DE CASANOVA","Retriever (Golden)","Bitch"],["UNICA SAKURA DEI VASILEVA","Retriever (Golden)","Bitch"],["GOLDEN AURORA DONA SOLECITA PEREGRINA","Retriever (Golden)","Bitch"],["Sh.Ch. GOLDEN AURORA A STAR IS BORN","Retriever (Golden)","Bitch"],["NAVILIS HOLD ME CLOSE","Retriever (Golden)","Bitch"],["SHIVA'S GOLDEN IL MONDO NUOVO","Retriever (Golden)","Bitch"],["GOLDEN AURORA HUGO INVICTUS TRINITATIS","Retriever (Golden)","Dog"],["Sh.Ch. BLUE LIVES PRINCE BENJI","Retriever (Golden)","Dog"],["Sh.Ch. GOLDEN AURORA LOVESTORY","Retriever (Golden)","Dog"],["Sh.Ch. OLVINGLAY TRIQUETRA","Retriever (Golden)","Dog"],["Sh.Ch. SHIVA'S GOLDEN DON CANDELORO","Retriever (Golden)","Dog"],["TOPSKEN LILLY","Retriever (Labrador)","Bitch"],["CRÈME BRULEE FRIEND DEI DUE MARI","Retriever (Labrador)","Dog"],["Sh.Ch. NEVILL OPEN HEART","Retriever (Labrador)","Dog"],["Sh.Ch. CROSSTREE THE ONE AND ONLY","Spaniel (Cocker)","Dog"],["Sh.Ch. GLENTREE HERITAGE","Spaniel (Cocker)","Dog"],["TAL-PITAZZ DUJAN","Spaniel (English Springer)","Dog"],["FAIRRAY COTTON CANDY OF ZORRAZO","Spanish Water Dog","Bitch"],["Sh.Ch. DINGLIGEM BETTY DAVIES EYES","Spanish Water Dog","Bitch"],["DINGLIGEM MINGH MINGH","Spanish Water Dog","Bitch"],["Sh.Ch. DINGLIGEM LOVABLE LUCY","Spanish Water Dog","Bitch"],["FAIRRAY BELLO CARAMELLO DI ZORRAZO","Spanish Water Dog","Dog"],["CASSLONG LUNA DOLCE","Cavalier King Charles Spaniel","Bitch"],["TAURUNUM ANGEL'S TURN OFF LIGHT","Cavalier King Charles Spaniel","Dog"],["GOLDEN PAWS LADY IN RED","Chihuahua (Long Coat)","Bitch"],["CHICOSTARS A LUCKY WHITE CANDY STAR","Chihuahua (Long Coat)","Dog"],["LOGERFOLD KARTANA SWORD DANCE","Chihuahua (Smooth Coat)","Bitch"],["GOLDEN PAWS FOLLOW THE WHITE LINE","Chihuahua (Smooth Coat)","Dog"],["WHY NOT OF DREAMS KENNEL","Chihuahua (Smooth Coat)","Dog"],["EDENISLE CZAR OF CHARM AND CHAOS","Lowchen (Little Lion Dog)","Dog"],["SILKWHITE DREAMS GUNS BLAZING","Maltese","Dog"],["PEQUEST PROSECCO","Pekingese","Dog"],["RKRK PRINCESS BJANA","Pomeranian","Bitch"],["SULTANA-VALMAR APOLLO","Pomeranian","Dog"],["SULTANA-VALMAR EROS","Pomeranian","Dog"],["BORDPOL HUGO THE BOSS","Pomeranian","Dog"],["THAI SILK MAXIMUM POWER","Pomeranian","Dog"],["Ch. THAI SILK MR SUGAR DONUT","Pomeranian","Dog"],["SULTANA-VALMAR STAR ADONIS","Pomeranian","Dog"],["Ch. DAN-STAR-KOM FLAY DE CRISTAL","Pomeranian","Dog"],["ORNELLA MUTI FAN-FAN FAVORI","Pug","Bitch"],["CONNOR DE IALENMAR-ARGENTINA","Pug","Dog"],["Ch. GABRA CK UNSTOPPABLE LOUIE","Pug","Dog"],["SIMARO QUEEN OF DIAMONDS","Border Collie","Bitch"],["JUPAVIA NOBODY CAN STOP TIME","Border Collie","Bitch"],["SILVERCLIFFS A TRIBUTE TO OLD HEMP","Border Collie","Dog"],["BRYNHAFOD SHACARRI ON FIRE","Boxer","Bitch"],["HIGHCREST MYSTIQUE MAKING WAVES","Boxer","Bitch"],["CILEMM MYSTERIOUS GIRL","Boxer","Bitch"],["Ch. CILEMM WALK THE TALK","Boxer","Bitch"],["MAXICE ANA LUNA","Boxer","Bitch"],["Ch. BRYNHAFOD SWEET PEA","Boxer","Bitch"],["SASHBOB NEVER SA NEVER FROM BERWYNFA","Boxer","Dog"],["Ch. BRYNHAFOD JOHNNY BRAVO","Boxer","Dog"],["LEVISBROOKS COSMIC VOYAGER","Boxer","Dog"],["Ch. LIMUBOX WICKED FANTASY","Boxer","Dog"],["FAST AND FURIOUS IS TAMSOS","Bullmastiff","Dog"],["CALIDA QIMMIQ KYASSNOWFLAKE","Canadian Eskimo Dog","Bitch"],["GHOST OF THE DARK CHLOE","Dobermann","Bitch"],["ARYA VAN CONTRA TEAM","German Shepherd Dog","Bitch"],["BLAIR VOM RADHIUS","German Shepherd Dog","Bitch"],["AXEL KAISER VAN CONTRA TEAM","German Shepherd Dog","Dog"],["Ch. CARLY DI POGGIO DEL SOLE","German Shepherd Dog","Dog"],["URAL VAN CONTRA","German Shepherd Dog","Dog"],["XANDY VOM HAUSE NIVEKSUE","Rottweiler","Bitch"],["Ch. HOUSE OF TIROVA TINA","Rottweiler","Bitch"],["LAZZARUS SUNY DAYS","Rottweiler","Dog"],["It.Aus.Ch. ELAN VON DER BLEICHSTRASSE","Rottweiler","Dog"],["MAXIMUS VOM HAUSE FURIMER","Rottweiler","Dog"],["BANELORD THE FIRE STARTER","Siberian Husky","Bitch"],["BANELORD BLASTER BOMB","Siberian Husky","Bitch"],["SIERRA IMPERIO IMANBEK","Siberian Husky","Bitch"],["Ch. BANELORD RAG DOLL","Siberian Husky","Bitch"],["Ch. BANELORD LAVA FLOWING CREST","Siberian Husky","Bitch"],["Ch. AYUKA'S ANGEL OF DISTRUCTION","Siberian Husky","Dog"],["BORN TO BE YOUR FOOLS GOLD","Welsh Corgi (Pembroke)","Bitch"],["ART-CITY PACIFICUS OCEANUS","Welsh Corgi (Pembroke)","Dog"],["UNIQUE PASSION BIG GUN LADY","Bull Terrier","Bitch"],["TRAVELLA SET TO SOAR","Fox Terrier (Wire)","Dog"],["VANGERBULL BARRY","Staffordshire Bull Terrier","Dog"]],"entries":[["11","KYLIE CILIA","Junior Handler"],["54","FRANCESCA ATTARD","Junior Handler"],["36","LARISSA DI NOBILE MORGANA","Junior Bitch"],["17","LILLIBETH THE QUEEN BRIGHT DIAMOND","Puppy Bitch"],["16","Ch. KAYLA BRIGHT DIAMOND","Open Bitch"],["106","KIRA FROM DRACULA'S BLOODLINE","Junior Bitch"],["127","HUGO BOSS VILLA LENSSTYLE","Puppy Dog"],["21","RICVAS MELEK","Puppy Bitch"],["18","NIK MAJESTIK MIRAI","Junior Bitch"],["19","AKAI HANA B'SEIDI MERC","Open Dog"],["71","Ch. DAMYOSHI BUSHI","Open Dog"],["117","EVIDDENTE OVER THE EDGE","Puppy Dog"],["83","SHUVALOFF OPPOSITES ATTRACT","Puppy Bitch"],["82","EDIVETTE MI CORAZON NIEVA","Junior Bitch"],["81","EDIVETTE COMO MIRARTE","Open Dog"],["112","MALENKAYA LEDI","Puppy Bitch"],["95","M AND C SIGNATURE ALLURE","Open Dog"],["85","DEMITRA INCANTO D'AMORE","Open Bitch"],["84","Ch. PERLA SOLO PER I TUOI OCCHI","Veteran Bitch"],["52","M WAMI'S SINNERS PRAYER","Puppy Dog"],["124","Ch. MANICARO DIESEL DAF","Open Dog"],["108","MARILYN MONROE DI CAMPO LUNGO","Puppy Bitch"],["110","GRACE KELLY DI CAMPO LUNGO","Puppy Bitch"],["20","Ch. ESME HISROYALMAJESTY","Open Bitch"],["22","Ch. GATEAU ROUGE DELLA ROCO DEI PAPI","Open Dog"],["109","DIFFERENT STRINGS DARLA","Junior Bitch"],["67","MAGIK RAINBOW FORD TOM","Open Dog"],["111","WAKYWILKS HERCULES","Puppy Dog"],["23","HAZEL DELLA BASSA PAVESE","Junior Bitch"],["25","FURIA FARGO MITIS ARAFA","Junior Dog"],["24","TOBERCORRAN THUNDER","Open Dog"],["26","RAMSEY","Puppy Dog"],["102","Ch. GABRA CK ALEXANDER HELIOS","Veteran Dog"],["34","NOTABLE DHALIA","Puppy Bitch"],["77","DAKOTA ALEXEM DREAM","Puppy Bitch"],["119","CHRISOLI DA YA THINK I'M SEXY","Veteran Bitch"],["35","NOTABLE CHEDDAR","Junior Dog"],["118","Ch. SUNTACH HE IS","Open Dog"],["86","DEMITRA INCANTO D'AMORE","AV Locally Bred"],["105","Sh.Ch. DINGLI GEM ELEGY FOR THE ARCTIC","Open Dog"],["29","Sh.Ch. BERSEYDALE FULL HOUSE","Open Bitch"],["30","CHESTERHOPE LANCELOT","Junior Dog"],["51","Sh.Ch. BERSIFJOR MODO MIRACOLOSO","Open Dog"],["38","RASHKA.B OF DREAMS KENNEL","Puppy Bitch"],["65","AMAZING GRACE DE LAR DE CASANOVA","Puppy Bitch"],["129","UNICA SAKURA DEI VASILEVA","Puppy Bitch"],["59","GOLDEN AURORA DONA SOLECITA PEREGRINA","Junior Bitch"],["61","Sh.Ch. GOLDEN AURORA A STAR IS BORN","Open Bitch"],["91","NAVILIS HOLD ME CLOSE","Open Bitch"],["99","SHIVA'S GOLDEN IL MONDO NUOVO","Open Bitch"],["60","GOLDEN AURORA HUGO INVICTUS TRINITATIS","Puppy Dog"],["31","Sh.Ch. BLUE LIVES PRINCE BENJI","Open Dog"],["58","Sh.Ch. GOLDEN AURORA LOVESTORY","Open Dog"],["62","Sh.Ch. OLVINGLAY TRIQUETRA","Open Dog"],["98","Sh.Ch. SHIVA'S GOLDEN DON CANDELORO","Open Dog"],["56","TOPSKEN LILLY","Open Bitch"],["33","CRÈME BRULEE FRIEND DEI DUE MARI","Junior Dog"],["88","Sh.Ch. NEVILL OPEN HEART","Veteran Dog"],["49","Sh.Ch. CROSSTREE THE ONE AND ONLY","Open Dog"],["50","Sh.Ch. GLENTREE HERITAGE","Veteran Dog"],["55","TAL-PITAZZ DUJAN","Open Dog"],["128","FAIRRAY COTTON CANDY OF ZORRAZO","Puppy Bitch"],["9","Sh.Ch. DINGLIGEM BETTY DAVIES EYES","Open Bitch"],["72","DINGLIGEM MINGH MINGH","Open Bitch"],["113","Sh.Ch. DINGLIGEM LOVABLE LUCY","Open Bitch"],["114","FAIRRAY BELLO CARAMELLO DI ZORRAZO","Puppy Dog"],["12","NICOLE CILIA","Childrens Class"],["107","CASSLONG LUNA DOLCE","Open Bitch"],["126","TAURUNUM ANGEL'S TURN OFF LIGHT","Open Dog"],["87","GOLDEN PAWS LADY IN RED","Puppy Bitch"],["13","CHICOSTARS A LUCKY WHITE CANDY STAR","Open Dog"],["14","LOGERFOLD KARTANA SWORD DANCE","Puppy Bitch"],["15","GOLDEN PAWS FOLLOW THE WHITE LINE","Puppy Dog"],["37","WHY NOT OF DREAMS KENNEL","Puppy Dog"],["28","EDENISLE CZAR OF CHARM AND CHAOS","Junior Dog"],["90","SILKWHITE DREAMS GUNS BLAZING","Open Dog"],["8","PEQUEST PROSECCO","Puppy Dog"],["40","RKRK PRINCESS BJANA","Junior Bitch"],["75","SULTANA-VALMAR APOLLO","Puppy Dog"],["76","SULTANA-VALMAR EROS","Puppy Dog"],["41","BORDPOL HUGO THE BOSS","Open Dog"],["42","THAI SILK MAXIMUM POWER","Open Dog"],["66","Ch. THAI SILK MR SUGAR DONUT","Open Dog"],["73","SULTANA-VALMAR STAR ADONIS","Open Dog"],["74","Ch. DAN-STAR-KOM FLAY DE CRISTAL","Open Dog"],["101","ORNELLA MUTI FAN-FAN FAVORI","Puppy Bitch"],["78","CONNOR DE IALENMAR-ARGENTINA","Puppy Dog"],["100","Ch. GABRA CK UNSTOPPABLE LOUIE","Open Dog"],["32","Sh.Ch. BLUE LIVES PRINCE BENJI","AV Locally Bred"],["43","RKRK PRINCESS BJANA","AV Locally Bred"],["96","SULTANA-VALMAR STAR ADONIS","AV Locally Bred"],["63","SIMARO QUEEN OF DIAMONDS","Puppy Bitch"],["39","JUPAVIA NOBODY CAN STOP TIME","Open Bitch"],["64","SILVERCLIFFS A TRIBUTE TO OLD HEMP","Open Dog"],["3","BRYNHAFOD SHACARRI ON FIRE","Puppy Bitch"],["5","HIGHCREST MYSTIQUE MAKING WAVES","Puppy Bitch"],["7","CILEMM MYSTERIOUS GIRL","Puppy Bitch"],["1","Ch. CILEMM WALK THE TALK","Open Bitch"],["4","MAXICE ANA LUNA","Open Bitch"],["97","Ch. BRYNHAFOD SWEET PEA","Open Bitch"],["103","SASHBOB NEVER SA NEVER FROM BERWYNFA","Junior Dog"],["2","Ch. BRYNHAFOD JOHNNY BRAVO","Open Dog"],["6","LEVISBROOKS COSMIC VOYAGER","Open Dog"],["104","Ch. LIMUBOX WICKED FANTASY","Open Dog"],["121","FAST AND FURIOUS IS TAMSOS","Junior Dog"],["27","CALIDA QIMMIQ KYASSNOWFLAKE","Junior Bitch"],["10","GHOST OF THE DARK CHLOE","Puppy Bitch"],["116","ARYA VAN CONTRA TEAM","Puppy Bitch"],["125","BLAIR VOM RADHIUS","Open Bitch"],["123","AXEL KAISER VAN CONTRA TEAM","Puppy Dog"],["68","Ch. CARLY DI POGGIO DEL SOLE","Open Dog"],["115","URAL VAN CONTRA","Open Dog"],["94","XANDY VOM HAUSE NIVEKSUE","Puppy Bitch"],["92","Ch. HOUSE OF TIROVA TINA","Open Bitch"],["93","LAZZARUS SUNY DAYS","Junior Dog"],["53","It.Aus.Ch. ELAN VON DER BLEICHSTRASSE","Open Dog"],["57","MAXIMUS VOM HAUSE FURIMER","Open Dog"],["69","BANELORD THE FIRE STARTER","Puppy Bitch"],["44","BANELORD BLASTER BOMB","Open Bitch"],["45","SIERRA IMPERIO IMANBEK","Open Bitch"],["46","Ch. BANELORD RAG DOLL","Veteran Bitch"],["47","Ch. BANELORD LAVA FLOWING CREST","Veteran Bitch"],["70","Ch. AYUKA'S ANGEL OF DISTRUCTION","Veteran Dog"],["80","BORN TO BE YOUR FOOLS GOLD","Junior Bitch"],["79","ART-CITY PACIFICUS OCEANUS","Open Dog"],["120","UNIQUE PASSION BIG GUN LADY","Open Bitch"],["89","TRAVELLA SET TO SOAR","Open Dog"],["122","VANGERBULL BARRY","Puppy Dog"],["48","Ch. BANELORD LAVA FLOWING CREST","AV Locally Bred"]]};

// Columns. Names in FORMULA are filled by the sheet itself and never written by the script.
var COLS = {
  "Shows":   ["Show", "Date", "Venue", "Judge", "Status", "Notes"],
  "Dogs":    ["Dog name", "Breed", "Group", "Sex", "Date of birth", "Owner", "Phone", "Address", "Breeder", "Sire", "Dam", "Added"],
  "Entries": ["Show", "Ring No", "Dog name", "Class", "Absent", "Breed", "Group", "Sex", "Owner", "Entered"],
  "Results": ["Show", "Section", "Class / award", "Placing", "Ring No", "Dog", "Breed", "Given", "Updated"],
  "Breeds":  ["Breed", "Group"]
};
var FORMULA = {
  "Dogs": {
    "Group": '={"Group";ARRAYFORMULA(IF(B2:B="",,IFERROR(VLOOKUP(B2:B,Breeds!A:B,2,FALSE),"Add breed to Breeds tab")))}'
  },
  "Entries": {
    "Breed": '={"Breed";ARRAYFORMULA(IF(C2:C="",,IFERROR(VLOOKUP(C2:C,Dogs!A:B,2,FALSE),"")))}',
    "Group": '={"Group";ARRAYFORMULA(IF(F2:F="",,IFERROR(VLOOKUP(F2:F,Breeds!A:B,2,FALSE),"")))}',
    "Sex":   '={"Sex";ARRAYFORMULA(IF(C2:C="",,IFERROR(VLOOKUP(C2:C,{Dogs!A:A,Dogs!D:D},2,FALSE),"")))}',
    "Owner": '={"Owner";ARRAYFORMULA(IF(C2:C="",,IFERROR(VLOOKUP(C2:C,{Dogs!A:A,Dogs!F:F},2,FALSE),"")))}'
  }
};

function ss_() { return SpreadsheetApp.openById(SHEET_ID); }
function tab_(name) { return ss_().getSheetByName(name); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function norm_(s) { return String(s == null ? "" : s).trim().toLowerCase(); }
function now_() { return Utilities.formatDate(new Date(), "Europe/Malta", "d MMM yyyy HH:mm"); }
function fmtDate_(v) { return v instanceof Date ? Utilities.formatDate(v, "Europe/Malta", "yyyy-MM-dd") : String(v == null ? "" : v); }

function password_() {
  var sh = tab_("Settings");
  return sh ? String(sh.getRange("B2").getValue() || "").trim() : "";
}

// Read a tab as objects. _row is the sheet row number.
function read_(name) {
  var sh = tab_(name);
  if (!sh || sh.getLastRow() < 2) return [];
  var cols = COLS[name];
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, cols.length).getValues();
  var out = [];
  vals.forEach(function (r, i) {
    if (r.every(function (v) { return v === "" || v === null; })) return;
    var o = { _row: i + 2 };
    cols.forEach(function (c, j) { o[c] = r[j] instanceof Date ? fmtDate_(r[j]) : r[j]; });
    out.push(o);
  });
  return out;
}

// Write one row, skipping formula columns.
function writeRow_(name, row, obj) {
  var sh = tab_(name), cols = COLS[name], skip = FORMULA[name] || {};
  cols.forEach(function (c, j) {
    if (skip[c] || !(c in obj)) return;
    sh.getRange(row, j + 1).setValue(obj[c] == null ? "" : obj[c]);
  });
}
function firstEmptyRow_(name) {
  var sh = tab_(name);
  var vals = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getValues();
  for (var i = vals.length - 1; i >= 0; i--) if (vals[i][0] !== "") return i + 2;
  return 2;
}

// ---------- web app ----------
function doGet() { return json_({ ok: true, message: "MNCF show database is running." }); }

function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: "Bad request" }); }

  // Results sync from the November 2026 pages (no password, only its own tabs).
  if (d.tabs && !d.action) {
    var lock0 = LockService.getScriptLock(); lock0.waitLock(20000);
    try { d.tabs.forEach(function (t) { if (LEGACY_TABS.indexOf(t.name) >= 0) writeLegacy_(t); }); }
    finally { lock0.releaseLock(); }
    return json_({ ok: true });
  }

  var pw = password_();
  if (d.action === "ping") return json_({ ok: true, passwordSet: !!pw });
  if (!pw) return json_({ ok: false, error: "nopassword" });
  if (String(d.key || "") !== pw) return json_({ ok: false, error: "password" });

  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    switch (d.action) {
      case "bootstrap": return json_({ ok: true, shows: read_("Shows"), breeds: read_("Breeds"), dogs: read_("Dogs"), groups: GROUPS, classes: CLASSES });
      case "show": return json_({ ok: true, show: findShow_(d.show), entries: entriesFor_(d.show), dogs: read_("Dogs"), breeds: read_("Breeds") });
      case "addShow": return json_(addShow_(d));
      case "saveEntry": return json_(saveEntry_(d));
      case "deleteEntry": return json_(deleteEntry_(d));
      case "setAbsent": return json_(setAbsent_(d));
      case "saveResults": return json_(saveResults_(d));
      case "extract": return json_(extract_(d));
      case "syncState": return json_(syncState_(d));
      case "importEntries": return json_(importEntries_(d));
      default: return json_({ ok: false, error: "Unknown action" });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function findShow_(name) {
  return read_("Shows").filter(function (s) { return norm_(s.Show) === norm_(name); })[0] || null;
}
function entriesFor_(show) {
  return read_("Entries").filter(function (e) { return norm_(e.Show) === norm_(show); });
}

function addShow_(d) {
  var s = d.show || {};
  var name = String(s.Show || "").trim();
  if (!name) return { ok: false, error: "Give the show a name." };
  var existing = findShow_(name);
  var row = existing ? existing._row : firstEmptyRow_("Shows");
  writeRow_("Shows", row, { "Show": name, "Date": s.Date || "", "Venue": s.Venue || "", "Judge": s.Judge || "", "Status": s.Status || "Open", "Notes": s.Notes || "" });
  return { ok: true, shows: read_("Shows") };
}

function upsertBreed_(breed, group) {
  breed = String(breed || "").trim();
  if (!breed) return;
  var found = read_("Breeds").filter(function (b) { return norm_(b.Breed) === norm_(breed); })[0];
  if (found) { if (group && !found.Group) writeRow_("Breeds", found._row, { "Group": group }); return; }
  if (!group) throw new Error("Pick a group for the new breed " + breed + ".");
  writeRow_("Breeds", firstEmptyRow_("Breeds"), { "Breed": breed, "Group": group });
}

// Remember the dog by name and breed. Details are updated when given.
function upsertDog_(dog) {
  var name = String(dog["Dog name"] || "").trim();
  if (!name || !dog.Breed) return;
  var found = read_("Dogs").filter(function (x) { return norm_(x["Dog name"]) === norm_(name); })[0];
  var o = { "Dog name": name };
  ["Breed", "Sex", "Date of birth", "Owner", "Phone", "Address", "Breeder", "Sire", "Dam"].forEach(function (k) {
    if (dog[k] !== undefined && dog[k] !== "") o[k] = dog[k];
  });
  if (found) writeRow_("Dogs", found._row, o);
  else { o["Added"] = now_(); writeRow_("Dogs", firstEmptyRow_("Dogs"), o); }
}

function saveEntry_(d) {
  var en = d.entry || {};
  var show = String(en.Show || "").trim(), name = String(en["Dog name"] || "").trim(), cls = String(en.Class || "").trim();
  if (!findShow_(show)) return { ok: false, error: "That show isn't in the Shows tab." };
  if (!name) return { ok: false, error: "Type the dog's name." };
  if (CLASSES.indexOf(cls) < 0) return { ok: false, error: "Pick a class." };
  var person = cls === "Junior Handler" || cls === "Childrens Class";
  if (!person) {
    if (d.dog && d.dog.Breed) upsertBreed_(d.dog.Breed, d.dog.Group);
    upsertDog_(Object.assign({}, d.dog || {}, { "Dog name": name }));
  }
  var all = entriesFor_(show);
  var ring = String(en["Ring No"] || "").trim();
  var clash = all.filter(function (x) { return x._row !== en._row && norm_(x["Dog name"]) === norm_(name) && x.Class === cls; })[0];
  if (clash) return { ok: false, error: name + " is already entered in " + cls + "." };
  var ringClash = ring && all.filter(function (x) { return x._row !== en._row && String(x["Ring No"]).trim() === ring; })[0];
  if (ringClash) return { ok: false, error: "Ring number " + ring + " is already used by " + ringClash["Dog name"] + "." };
  var row;
  if (en._row) {
    var cur = read_("Entries").filter(function (x) { return x._row === en._row; })[0];
    if (!cur || norm_(cur.Show) !== norm_(show)) return { ok: false, error: "That entry changed in the sheet. Reload and try again." };
    row = en._row;
  } else row = firstEmptyRow_("Entries");
  var o = { "Show": show, "Ring No": ring, "Dog name": name, "Class": cls, "Absent": !!en.Absent };
  if (!en._row) o["Entered"] = now_();
  writeRow_("Entries", row, o);
  tab_("Entries").getRange(row, 5).insertCheckboxes();
  SpreadsheetApp.flush();
  return { ok: true, entries: entriesFor_(show), dogs: read_("Dogs"), breeds: read_("Breeds") };
}

function deleteEntry_(d) {
  var cur = read_("Entries").filter(function (x) { return x._row === d._row; })[0];
  if (!cur || norm_(cur.Show) !== norm_(d.show) || norm_(cur["Dog name"]) !== norm_(d.name)) return { ok: false, error: "That entry changed in the sheet. Reload and try again." };
  tab_("Entries").deleteRow(d._row);
  SpreadsheetApp.flush();
  return { ok: true, entries: entriesFor_(d.show) };
}

function setAbsent_(d) {
  var cur = read_("Entries").filter(function (x) { return x._row === d._row; })[0];
  if (!cur || norm_(cur.Show) !== norm_(d.show)) return { ok: false, error: "That entry changed in the sheet. Reload and try again." };
  tab_("Entries").getRange(d._row, 5).setValue(!!d.absent);
  return { ok: true };
}

// Replace one show's rows in the Results tab.
function saveResults_(d) {
  var show = String(d.show || "").trim();
  if (!show) return { ok: false, error: "No show." };
  var sh = tab_("Results"), n = sh.getLastRow();
  if (n > 1) {
    var vals = sh.getRange(2, 1, n - 1, 1).getValues();
    for (var i = vals.length - 1; i >= 0; i--) if (norm_(vals[i][0]) === norm_(show)) sh.deleteRow(i + 2);
  }
  var rows = (d.rows || []).map(function (r) {
    return [show, r[0] || "", r[1] || "", r[2] || "", r[3] || "", r[4] || "", r[5] || "", r[6] === "Yes", now_()];
  });
  if (rows.length) {
    var start = firstEmptyRow_("Results");
    sh.getRange(start, 1, rows.length, 9).setValues(rows);
    sh.getRange(start, 8, rows.length, 1).insertCheckboxes();
  }
  return { ok: true };
}

// ---------- Live results shared between phones ----------
// One row per award per show: the chosen dog (as JSON), when the phone changed it, and when the sheet saved it.
function liveTab_() {
  var ss = ss_(), sh = ss.getSheetByName("Live results");
  if (!sh) {
    sh = ss.insertSheet("Live results");
    sh.getRange(1, 1, 1, 5).setValues([["Show", "Award key", "Value", "Changed (ms)", "Saved (ms)"]]).setFontWeight("bold");
    sh.setFrozenRows(1);
    sh.getRange("C:C").setNumberFormat("@");
    sh.hideSheet();
  }
  return sh;
}
function syncState_(d) {
  var show = String(d.show || "").trim();
  if (!findShow_(show)) return { ok: false, error: "That show isn't in the Shows tab." };
  var sh = liveTab_(), n = sh.getLastRow();
  var vals = n > 1 ? sh.getRange(2, 1, n - 1, 5).getValues() : [];
  var idx = {}, now = Date.now(), changed = false;
  vals.forEach(function (r, i) { if (norm_(r[0]) === norm_(show)) idx[String(r[1])] = i; });
  (d.changes || []).forEach(function (c) {
    var k = String(c[0]), v = (c[1] === null || c[1] === undefined) ? "" : JSON.stringify(c[1]), t = Number(c[2]) || now;
    var i = idx[k];
    if (i === undefined) { vals.push([show, k, v, t, now]); idx[k] = vals.length - 1; changed = true; }
    else if (t >= Number(vals[i][3])) { vals[i][2] = v; vals[i][3] = t; vals[i][4] = now; changed = true; }
  });
  if (changed && vals.length) {
    sh.getRange(2, 3, vals.length, 1).setNumberFormat("@");
    sh.getRange(2, 1, vals.length, 5).setValues(vals);
  }
  var since = Number(d.since) || 0, rows = [];
  vals.forEach(function (r) {
    if (norm_(r[0]) !== norm_(show) || Number(r[4]) <= since) return;
    var v = null;
    if (r[2] !== "" && r[2] !== null) { try { v = JSON.parse(String(r[2])); } catch (e) { v = r[2]; } }
    rows.push([String(r[1]), v, Number(r[3])]);
  });
  return { ok: true, rows: rows, now: now };
}

// ---------- Claude: read an uploaded document ----------
var CLAUDE_MODEL = "claude-sonnet-5-5";

function claudeKey_() {
  return String(PropertiesService.getScriptProperties().getProperty("ANTHROPIC_API_KEY") || "").trim();
}

function callClaude_(content, tools, toolName, maxTokens) {
  var key = claudeKey_();
  if (!key) throw new Error("The Claude API key isn't set up yet. Add ANTHROPIC_API_KEY in the script's Project Settings > Script properties.");
  var res = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", {
    method: "post",
    contentType: "application/json",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens || 16000,
      system: "Answer only by calling the " + toolName + " tool once, with everything you found. Don't reply with plain text.",
      tools: tools,
      tool_choice: { type: "auto" },
      messages: [{ role: "user", content: content }]
    })
  });
  var code = res.getResponseCode(), body = {};
  try { body = JSON.parse(res.getContentText()); } catch (e) {}
  if (code === 401) throw new Error("Claude didn't accept the API key. Check ANTHROPIC_API_KEY in Script properties.");
  if (code === 429 || code === 529) throw new Error("Claude is busy right now. Try again in a minute.");
  if (code === 413) throw new Error("The upload is too big. Try fewer pages or smaller photos.");
  if (code !== 200) throw new Error("Claude couldn't read the file (" + code + "): " + ((body.error && body.error.message) || "unknown error"));
  var block = (body.content || []).filter(function (c) { return c.type === "tool_use" && c.name === toolName; })[0];
  if (!block) {
    // Fallback: Claude answered in text. Use the first JSON object in it.
    var text = (body.content || []).filter(function (c) { return c.type === "text"; }).map(function (c) { return c.text; }).join("\n");
    var m = text.match(/\{[\s\S]*\}/);
    if (m) { try { block = { input: JSON.parse(m[0]) }; } catch (e) {} }
  }
  if (!block) throw new Error("Claude didn't return any entries. Try a clearer file.");
  if (body.stop_reason === "max_tokens") block.input._truncated = true;
  return { input: block.input, usage: body.usage || {} };
}

function extract_(d) {
  var files = d.files || [];
  if (!files.length) return { ok: false, error: "Add a file first." };
  var breeds = read_("Breeds").map(function (b) { return b.Breed + " (" + b.Group + ")"; }).join("; ");
  var content = [];
  files.forEach(function (f) {
    if (f.kind === "text") content.push({ type: "text", text: "File: " + (f.name || "spreadsheet") + "\n\n" + String(f.data).slice(0, 400000) });
    else if (f.kind === "image") content.push({ type: "image", source: { type: "base64", media_type: f.mediaType || "image/jpeg", data: f.data } });
    else if (f.kind === "pdf") content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: f.data } });
  });
  content.push({ type: "text", text: [
    "These files are entries for a dog show run by the Maltese National Canine Federation (MNCF). They may be a spreadsheet, a printed show catalogue, or photos of catalogue pages.",
    "Record every entry with the record_entries tool. One entry is one dog in one class. A dog entered in two classes (for example Open Bitch and AV Locally Bred) is two entries, usually with different ring numbers.",
    "Classes must be one of: " + CLASSES.join(", ") + ". Catalogue class codes: PD Puppy Dog, PB Puppy Bitch, JD Junior Dog, JB Junior Bitch, OD Open Dog, OB Open Bitch, VD Veteran Dog, VB Veteran Bitch, AVLB AV Locally Bred. In catalogues a dog's sex follows its date of birth as D or B.",
    "Junior Handler and Childrens Class entries are people, not dogs: put the person's name in dog_name and leave breed empty.",
    "Keep dog names exactly as printed, including titles like Ch. or Sh.Ch. Use the breed names below when they match; otherwise write the breed as printed and give its group.",
    "Known breeds and groups: " + breeds,
    "Groups: " + GROUPS.join(", ") + ".",
    "Leave a field empty when the document doesn't show it. Don't guess ring numbers. If something is unclear, still record the entry and explain in note.",
    "If the documents show the show's name, date, venue or judge, fill in show."
  ].join("\n") });
  var tool = {
    name: "record_entries",
    description: "Record the show details and every entry found in the documents.",
    input_schema: {
      type: "object",
      properties: {
        show: { type: "object", properties: { name: { type: "string" }, date: { type: "string" }, venue: { type: "string" }, judge: { type: "string" } } },
        entries: {
          type: "array",
          items: {
            type: "object",
            properties: {
              ring_no: { type: "string" }, dog_name: { type: "string" }, breed: { type: "string" },
              group: { type: "string", enum: GROUPS.concat([""]) }, sex: { type: "string", enum: ["Dog", "Bitch", ""] },
              "class": { type: "string", enum: CLASSES }, date_of_birth: { type: "string", description: "YYYY-MM-DD" },
              owner: { type: "string" }, phone: { type: "string" }, address: { type: "string" },
              breeder: { type: "string" }, sire: { type: "string" }, dam: { type: "string" }, note: { type: "string" }
            },
            required: ["dog_name", "class"]
          }
        }
      },
      required: ["entries"]
    }
  };
  var out = callClaude_(content, [tool], "record_entries", 32000);
  return { ok: true, show: out.input.show || {}, entries: out.input.entries || [], truncated: !!out.input._truncated, usage: out.usage };
}

// Bulk save checked entries from the Import page.
function importEntries_(d) {
  var show = String(d.show || "").trim();
  if (!findShow_(show)) return { ok: false, error: "That show isn't in the Shows tab." };
  var list = d.entries || [], added = 0, skipped = [], now = now_();
  // breeds
  var breeds = read_("Breeds"), bmap = {};
  breeds.forEach(function (b) { bmap[norm_(b.Breed)] = b; });
  var newBreeds = [];
  list.forEach(function (e) {
    var b = String(e.Breed || "").trim();
    if (!b || bmap[norm_(b)]) return;
    if (!e.Group) return;
    bmap[norm_(b)] = { Breed: b, Group: e.Group }; newBreeds.push([b, e.Group]);
  });
  if (newBreeds.length) tab_("Breeds").getRange(firstEmptyRow_("Breeds"), 1, newBreeds.length, 2).setValues(newBreeds);
  // dogs
  var dogs = read_("Dogs"), dmap = {};
  dogs.forEach(function (x) { dmap[norm_(x["Dog name"])] = x; });
  var newDogs = [], fill = ["Sex", "Date of birth", "Owner", "Phone", "Address", "Breeder", "Sire", "Dam"];
  var sh = tab_("Dogs");
  list.forEach(function (e) {
    var name = String(e["Dog name"] || "").trim();
    if (!name || !e.Breed || e.Class === "Junior Handler" || e.Class === "Childrens Class") return;
    var cur = dmap[norm_(name)];
    if (cur) {
      if (cur._new) return;
      // fill in details the register doesn't have yet; never overwrite
      var row = cur._row, cols = COLS.Dogs;
      fill.forEach(function (k) { if ((cur[k] === "" || cur[k] == null) && e[k]) { sh.getRange(row, cols.indexOf(k) + 1).setValue(e[k]); cur[k] = e[k]; } });
      return;
    }
    var r = [name, e.Breed, e.Sex || "", e["Date of birth"] || "", e.Owner || "", e.Phone || "", e.Address || "", e.Breeder || "", e.Sire || "", e.Dam || "", now];
    newDogs.push(r); dmap[norm_(name)] = { _new: true };
  });
  if (newDogs.length) {
    var start = firstEmptyRow_("Dogs");
    sh.getRange(start, 1, newDogs.length, 2).setValues(newDogs.map(function (r) { return r.slice(0, 2); }));
    sh.getRange(start, 4, newDogs.length, 9).setValues(newDogs.map(function (r) { return r.slice(2); }));
  }
  // entries
  var existing = entriesFor_(show), seen = {}, rings = {};
  existing.forEach(function (x) { seen[norm_(x["Dog name"]) + "|" + x.Class] = 1; var n = String(x["Ring No"]).trim(); if (n) rings[n] = x["Dog name"]; });
  var rows = [];
  list.forEach(function (e) {
    var name = String(e["Dog name"] || "").trim(), cls = e.Class, ring = String(e["Ring No"] || "").trim();
    if (!name) return;
    if (CLASSES.indexOf(cls) < 0) { skipped.push({ name: name, reason: "no class" }); return; }
    if (seen[norm_(name) + "|" + cls]) { skipped.push({ name: name, reason: "already entered in " + cls }); return; }
    if (ring && rings[ring]) { skipped.push({ name: name, reason: "ring number " + ring + " is used by " + rings[ring] }); return; }
    seen[norm_(name) + "|" + cls] = 1; if (ring) rings[ring] = name;
    rows.push([show, ring, name, cls, !!e.Absent]); added++;
  });
  if (rows.length) {
    var es = tab_("Entries"), at = firstEmptyRow_("Entries");
    es.getRange(at, 1, rows.length, 5).setValues(rows);
    es.getRange(at, 5, rows.length, 1).insertCheckboxes();
    es.getRange(at, 10, rows.length, 1).setValue(now);
  }
  SpreadsheetApp.flush();
  return { ok: true, added: added, skipped: skipped, newDogs: newDogs.length, newBreeds: newBreeds.length };
}

// One-off repair of the November seed: an AV Locally Bred entry was saved with a broken name.
function fixNovemberSeed() {
  var bad = "Sh.Ch. BLUE LIVES PRINCE BENJI (Retriever";
  var dogs = tab_("Dogs"), dv = dogs.getRange(1, 1, dogs.getLastRow(), 1).getValues();
  for (var i = dv.length - 1; i >= 1; i--) if (dv[i][0] === bad) dogs.deleteRow(i + 1);
  var en = tab_("Entries"), ev = en.getRange(1, 3, en.getLastRow(), 1).getValues();
  for (var j = 1; j < ev.length; j++) if (ev[j][0] === bad) en.getRange(j + 1, 3).setValue("Sh.Ch. BLUE LIVES PRINCE BENJI");
}

// Run once from the editor after adding the key: it asks Google for permission to reach the Claude API and checks the key.
function checkClaudeKey() {
  var out = callClaude_([{ type: "text", text: "Reply with ok." }], [{ name: "reply", description: "Reply", input_schema: { type: "object", properties: { text: { type: "string" } } } }], "reply", 50);
  Logger.log("Claude API key works. Model: " + CLAUDE_MODEL + ". Reply: " + JSON.stringify(out.input));
}

function writeLegacy_(t) {
  var sh = tab_(t.name) || ss_().insertSheet(t.name);
  sh.clearContents();
  var rows = t.rows || [];
  if (!rows.length) return;
  var w = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
  var grid = rows.map(function (r) { var x = r.map(function (v) { return v == null ? "" : v; }); while (x.length < w) x.push(""); return x; });
  sh.getRange(1, 1, grid.length, w).setValues(grid);
  sh.getRange(1, 1, 1, w).setFontWeight("bold");
  sh.setFrozenRows(1);
  sh.getRange(1, w + 2).setValue("Updated " + now_());
}

// ---------- one-off setup: run from the editor ----------
function setupSheet() {
  var ss = ss_();
  var HEAD_BG = "#1f2d5c", HEAD_FG = "#ffffff", FORMULA_BG = "#eef1f8";

  function ensure(name, index) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    ss.setActiveSheet(sh); ss.moveActiveSheet(index);
    return sh;
  }
  function header(sh, name, widths) {
    var cols = COLS[name], f = FORMULA[name] || {};
    cols.forEach(function (c, j) {
      var cell = sh.getRange(1, j + 1);
      if (f[c]) cell.setFormula(f[c]); else cell.setValue(c);
      if (widths && widths[j]) sh.setColumnWidth(j + 1, widths[j]);
      if (f[c]) sh.getRange(2, j + 1, sh.getMaxRows() - 1, 1).setBackground(FORMULA_BG).setFontColor("#5d6475");
    });
    sh.getRange(1, 1, 1, cols.length).setBackground(HEAD_BG).setFontColor(HEAD_FG).setFontWeight("bold").setVerticalAlignment("middle");
    sh.setRowHeight(1, 32);
    sh.setFrozenRows(1);
    sh.getBandings().forEach(function (b) { b.remove(); });
    sh.getRange(1, 1, sh.getMaxRows(), cols.length).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
    sh.getRange(1, 1, 1, cols.length).setBackground(HEAD_BG).setFontColor(HEAD_FG);
    if (sh.getMaxColumns() > cols.length) sh.deleteColumns(cols.length + 1, sh.getMaxColumns() - cols.length);
    sh.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function (p) { p.remove(); });
    Object.keys(f).forEach(function (c) {
      var j = cols.indexOf(c) + 1;
      sh.getRange(1, j, sh.getMaxRows(), 1).protect().setDescription("Filled in automatically").setWarningOnly(true);
    });
  }
  function list(values, allowOther) {
    return SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(!!allowOther).build();
  }
  function fromRange(rng, allowOther, help) {
    var b = SpreadsheetApp.newDataValidation().requireValueInRange(rng, true).setAllowInvalid(!!allowOther);
    if (help) b.setHelpText(help);
    return b.build();
  }

  // Start here
  var start = ensure("Start here", 1);
  start.clear();
  start.getRange("A1:A14").setValues([
    ["MNCF show database"],
    ["This sheet is the database behind the show website: " + SITE_URL],
    [""],
    ["How to use it"],
    ["1. Add a show on the website (Shows page) or as a new row in the Shows tab."],
    ["2. Register dogs on the website's Register page, or add them to the Dogs tab. A dog only needs to be added once: name and breed are remembered for later shows."],
    ["3. Enter dogs into a show on the Register page, or in the Entries tab: pick the show, type the ring number, pick the dog and the class."],
    ["4. Grey columns fill in by themselves. Don't type in them."],
    ["5. Breeds missing from the dropdown go in the Breeds tab with their group."],
    ["6. Results arrive in the Results tab while the awards page is being used. Entries can also be imported from an Excel file, a catalogue PDF or photos on the website's Import page."],
    [""],
    ["The website asks for the team password set in the Settings tab. Change it there at any time."],
    ["Tabs called Sat 31 Oct, Sun morning, Sun evening, Absent and Best in Show hold the November 2026 results from the first version of the site."],
    [""]
  ]);
  start.getRange("A1").setFontSize(18).setFontWeight("bold").setFontColor(HEAD_BG);
  start.getRange("A4").setFontWeight("bold").setFontSize(12);
  start.setColumnWidth(1, 900);
  start.getRange("A1:A14").setWrap(true).setVerticalAlignment("middle");
  start.setHiddenGridlines(true);

  var shows = ensure("Shows", 2);   header(shows, "Shows", [320, 160, 200, 200, 110, 300]);
  var dogs = ensure("Dogs", 3);     header(dogs, "Dogs", [300, 230, 110, 80, 120, 200, 120, 280, 180, 220, 220, 150]);
  var entries = ensure("Entries", 4); header(entries, "Entries", [280, 80, 300, 150, 80, 230, 110, 80, 200, 150]);
  var results = ensure("Results", 5); header(results, "Results", [280, 220, 220, 100, 80, 300, 230, 80, 150]);
  var breeds = ensure("Breeds", 6); header(breeds, "Breeds", [280, 140]);
  var settings = ensure("Settings", 7);

  // Seed breeds and the November show once.
  if (breeds.getLastRow() < 2) breeds.getRange(2, 1, SEED.breeds.length, 2).setValues(SEED.breeds);
  if (dogs.getLastRow() < 2) {
    var added = now_();
    dogs.getRange(2, 1, SEED.dogs.length, 2).setValues(SEED.dogs.map(function (d) { return [d[0], d[1]]; }));
    dogs.getRange(2, 4, SEED.dogs.length, 1).setValues(SEED.dogs.map(function (d) { return [d[2]]; }));
    dogs.getRange(2, 12, SEED.dogs.length, 1).setValue(added);
  }
  var NOV = "MNCF Championship Show November 2026";
  if (shows.getLastRow() < 2) shows.getRange(2, 1, 1, 6).setValues([[NOV, "31 Oct – 1 Nov 2026", "", "Mr Adrian Bicknell", "Finished", "First show on the system"]]);
  if (entries.getLastRow() < 2) {
    entries.getRange(2, 1, SEED.entries.length, 5).setValues(SEED.entries.map(function (e) { return [NOV, e[0], e[1], e[2], false]; }));
    entries.getRange(2, 10, SEED.entries.length, 1).setValue(now_());
  }

  // Dropdowns and checkboxes
  var R = function (sh) { return Math.max(sh.getMaxRows() - 1, 1); };
  shows.getRange(2, 5, R(shows), 1).setDataValidation(list(["Open", "Closed", "Finished"]));
  dogs.getRange(2, 2, R(dogs), 1).setDataValidation(fromRange(breeds.getRange("A2:A"), true, "Pick a breed. New breeds go in the Breeds tab first."));
  dogs.getRange(2, 4, R(dogs), 1).setDataValidation(list(["Dog", "Bitch"]));
  dogs.getRange(2, 5, R(dogs), 1).setNumberFormat("yyyy-mm-dd");
  entries.getRange(2, 1, R(entries), 1).setDataValidation(fromRange(shows.getRange("A2:A"), false, "Pick a show from the Shows tab."));
  entries.getRange(2, 3, R(entries), 1).setDataValidation(fromRange(dogs.getRange("A2:A"), true, "Pick a registered dog, or type a handler's name for Junior Handler and Childrens Class."));
  entries.getRange(2, 4, R(entries), 1).setDataValidation(list(CLASSES));
  entries.getRange(2, 5, R(entries), 1).insertCheckboxes();
  entries.getRange(2, 2, R(entries), 1).setHorizontalAlignment("center").setNumberFormat("@");
  results.getRange(2, 5, R(results), 1).setHorizontalAlignment("center");
  breeds.getRange(2, 2, R(breeds), 1).setDataValidation(list(GROUPS));
  results.getRange(2, 8, R(results), 1).insertCheckboxes();

  // Settings
  var keepPw = settings.getRange("B2").getValue();
  settings.clear();
  settings.getRange("A1:B1").setValues([["Setting", "Value"]]).setBackground(HEAD_BG).setFontColor(HEAD_FG).setFontWeight("bold");
  settings.getRange("A2:B2").setValues([["Team password", keepPw]]);
  settings.getRange("B2").setBackground("#fff7d6");
  settings.getRange("A3:B3").setValues([["Website", SITE_URL]]);
  settings.getRange("A5").setValue("Type the team password in B2. Everyone using the website types the same password once on their phone.").setFontColor("#5d6475");
  settings.setColumnWidth(1, 200); settings.setColumnWidth(2, 360);
  settings.setFrozenRows(1);

  // Tidy: drop the empty default tab, keep legacy tabs at the end.
  var s1 = ss.getSheetByName("Sheet1");
  if (s1 && s1.getLastRow() === 0) ss.deleteSheet(s1);
  var i = 8;
  LEGACY_TABS.forEach(function (n) { var sh = ss.getSheetByName(n); if (sh) { ss.setActiveSheet(sh); ss.moveActiveSheet(i++); sh.setTabColor("#9aa1b4"); } });
  [start, shows, dogs, entries, results, breeds, settings].forEach(function (sh) { sh.setTabColor(HEAD_BG); });
  ss.setActiveSheet(start);
}

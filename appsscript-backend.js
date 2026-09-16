/* ─────────────────────────────────────────────
   전략 진단 — 응답 저장용 백엔드 (Google Apps Script)

   설치 방법
   1. sheets.new 로 새 구글 시트를 하나 만든다
   2. 확장 프로그램 → Apps Script 클릭
   3. 기본 코드를 지우고 이 파일 내용을 전부 붙여넣는다
   4. 배포 → 새 배포 → 유형: 웹 앱
        - 실행 계정: 나
        - 액세스 권한: 모든 사용자
   5. 생성된 URL을 복사해서
      strategy-diagnostic.html 상단의 ENDPOINT 에 붙여넣는다
   ───────────────────────────────────────────── */

var SHEET = "responses";

var HEAD = ["ts","code","name","sid","grade","age","gender","major","major2",
            "want","fit","total",
            "구조화","수치화","가설수립","정보탐색","커뮤니케이션","실행지구력",
            "gpa","wl","items","ans","sans"];

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
  }
  return sh;
}

/* 학생이 진단을 마치면 호출됨 */
function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var a = d.a || [];
    sheet_().appendRow([
      d.ts || new Date().toISOString(),
      d.code || "",
      d.name || "", d.sid || "", d.grade || "", d.age || "", d.gender || "",
      d.major || "", d.major2 || "",
      d.want || "", d.fit || "", d.total || 0,
      a[0]||0, a[1]||0, a[2]||0, a[3]||0, a[4]||0, a[5]||0,
      d.gpa || "", d.wl == null ? "" : d.wl,
      (d.items || []).join("|"),
      JSON.stringify(d.ans || []),
      JSON.stringify(d.sans || [])
    ]);
    return ContentService.createTextOutput(JSON.stringify({ok: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ok: false, err: String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* 강사용 대시보드가 호출함 */
function doGet(e) {
  var sh = sheet_();
  var v = sh.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < v.length; i++) {
    var r = v[i];
    out.push({
      ts: String(r[0]), code: r[1], name: r[2], sid: String(r[3]),
      grade: r[4], age: r[5], gender: r[6], major: r[7], major2: r[8],
      want: r[9], fit: r[10], total: Number(r[11]),
      a: [r[12], r[13], r[14], r[15], r[16], r[17]].map(Number),
      gpa: r[18], wl: r[19] === "" ? null : Number(r[19]),
      items: String(r[20] || "").split("|").filter(String),
      ans: safe_(r[21]), sans: safe_(r[22])
    });
  }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

function safe_(x) {
  try { return JSON.parse(x); } catch (e) { return []; }
}

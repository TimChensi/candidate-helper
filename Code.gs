const SPREADSHEET_ID = '16xoI3uN2-wgVq2qNNu1y8SKGHaYj1phJES3tJ-zVlpQ';
const OWNER_SHEETS = {'Тимофей':'Тимофей','Никита':'Никита'};
const HEADERS = ['Дата добавления','Телефон','Статус контакта','ФИО','Возраст','Город проживания','Город прописки','Гражданство','Категория ВБ','Ограничения по здоровью','Инвалидность','Судимости','ВУ','Пожелания по направлению','Готовность отправления','Готовый текст'];

function safeCell(value) {
  const text = String(value ?? '').trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}
function getCandidateSheet_(owner) {
  const sheetName = OWNER_SHEETS[owner];
  if (!sheetName) throw new Error('Не выбран владелец кандидата');
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  return sheet;
}

function findWriteRow_(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 1);
  if (lastRow < 2) return 2;
  const phones = sheet.getRange(2,2,lastRow - 1,1).getDisplayValues();
  for (let i = 0; i < phones.length; i++) {
    if (!String(phones[i][0] || '').trim()) return i + 2;
  }
  return lastRow + 1;
}
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!d.candidateOwner) throw new Error('Не выбран владелец кандидата');
    if (!d.phone) throw new Error('Не заполнен телефон');
    const unknown = 'Не дал ответ';
    const v = x => (x == null || String(x).trim() === '') ? unknown : x;
    const row = [new Date(),d.phone,v(d.contactStatus),v(d.fullName),v(d.age),v(d.residenceCity),v(d.registrationCity),v(d.citizenship),v(d.militaryCategory),v(d.healthLimits),v(d.disability),v(d.criminalRecord),v(d.driverLicense),v(d.directionWish),v(d.departureReadiness),v(d.agreementText)].map((x,i)=>i===0?x:safeCell(x));
    const sheet=getCandidateSheet_(d.candidateOwner);
    const writeRow=findWriteRow_(sheet);
    sheet.getRange(writeRow,1,1,row.length).setValues([row]);
    return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err)})).setMimeType(ContentService.MimeType.JSON);
  } finally { try{lock.releaseLock()}catch(_){} }
}
function doGet(){return ContentService.createTextOutput('Candidate Helper API is running');}
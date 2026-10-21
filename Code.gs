const SPREADSHEET_ID = '16xoI3uN2-wgVq2qNNu1y8SKGHaYj1phJES3tJ-zVlpQ';
const SHEET_NAME = 'Кандидаты';
const HEADERS = ['Дата добавления','Телефон','Статус контакта','ФИО','Возраст','Город проживания','Город прописки','Гражданство','Категория ВБ','Ограничения по здоровью','Инвалидность','Судимости','ВУ','Пожелания по направлению','Готовность отправления','Готовый текст'];

function safeCell(value) {
  const text = String(value ?? '').trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}
function getCandidateSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  return sheet;
}
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!d.fullName || !d.phone) throw new Error('Не заполнены ФИО или телефон');
    const row = [new Date(),d.phone,d.contactStatus,d.fullName,d.age,d.residenceCity,d.registrationCity,d.citizenship,d.militaryCategory,d.healthLimits,d.disability,d.criminalRecord,d.driverLicense,d.directionWish,d.departureReadiness,d.agreementText].map((v,i)=>i===0?v:safeCell(v));
    const sheet=getCandidateSheet_();
    sheet.getRange(sheet.getLastRow()+1,1,1,row.length).setValues([row]);
    return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err)})).setMimeType(ContentService.MimeType.JSON);
  } finally { try{lock.releaseLock()}catch(_){} }
}
function doGet(){return ContentService.createTextOutput('Candidate Helper API is running');}
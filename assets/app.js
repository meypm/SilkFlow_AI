const app = document.getElementById('app');
const roleSelect = document.getElementById('roleSelect');
const roleLabel = document.getElementById('roleLabel');
const dbStatus = document.getElementById('dbStatus');

let role = new URLSearchParams(location.search).get('role') || localStorage.getItem('silkflow_role_v2') || 'client';
let shipments = [];
let jobs = [];
let dbMode = 'local';
let currentReceiverCode = new URLSearchParams(location.search).get('track') || 'SF-2026-0012';

const notifications = [
  'Smart Split: SF-2026-0012 распределён на Узбекистан',
  'SF-2026-0010 ожидает проверки ТН ВЭД',
  'SF-2026-0011 готов к выдаче'
];

const roleNames = {
  client: 'Клиент', sender: 'Отправитель', warehouse: 'Склад / Карго', driver: 'Водитель', receiver: 'Получатель'
};

function roleName(r){ return roleNames[r] || 'Клиент'; }
function esc(v=''){return String(v).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}
function money(v){return '$'+Number(v||0).toLocaleString('en-US');}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.remove('hidden');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.add('hidden'),2800);}
function setDbStatus(mode){dbMode=mode;dbStatus.className='db-status '+(mode==='cloud'?'cloud':'local');dbStatus.innerHTML=`<i></i><span>${mode==='cloud'?'Общая база':'Демо-база'}</span>`;dbStatus.title=mode==='cloud'?'Supabase: данные общие для всех устройств':'localStorage: данные только в этом браузере';}
function statusClass(s){return ['Получено','Доставлено','Готово к выдаче','Оплачено'].includes(s)?'success':['Таможня','Расчет готов','Ожидает документы','Ожидает подтверждения'].includes(s)?'warn':'info';}
function statusPill(s){return `<span class="status ${statusClass(s)}">${esc(s)}</span>`;}
function stat(icon,value,label,hint,tone=''){return `<div class="stat-card"><span class="stat-icon ${tone}">${icon}</span><div><strong>${value}</strong><b>${label}</b><small>${hint}</small></div></div>`;}
function section(title,subtitle='',action='',icon='●'){return `<div class="section-head"><div class="section-title"><span class="mini-icon">${icon}</span><div><h2>${title}</h2>${subtitle?`<p>${subtitle}</p>`:''}</div></div>${action?`<button class="link-btn">${action}</button>`:''}</div>`;}
function hero(kind,title,text,actions,cardTitle,cardText){return `<section id="overview" class="hero"><div><span class="eyebrow">${kind==='sender'?'SHIPPER WORKSPACE':kind==='receiver'?'RECEIVER PORTAL':kind==='warehouse'?'SMART WAREHOUSE':kind==='driver'?'P2P LAST MILE':'B2B LOGISTICS OS'}</span><h1>${title}</h1><p>${text}</p><div class="hero-actions">${actions}</div></div><div class="hero-art ${kind}"><div class="hero-card"><b>${cardTitle}</b><span>${cardText}</span><strong>Китай → КР → Узбекистан</strong></div></div></section>`;}
function routeMap(from='Китай',to='Узбекистан'){return `<div class="route-map"><div class="map-grid"></div><span class="route-point from">${esc(from)}</span><span class="route-point mid">Джалал-Абад</span><span class="route-point to">${esc(to)}</span><svg class="route-svg" viewBox="0 0 600 180" preserveAspectRatio="none"><path d="M70 125 C180 70 265 145 338 90 S475 55 540 82" fill="none" stroke="#ff5a1f" stroke-width="4" stroke-dasharray="8 8"/><circle cx="70" cy="125" r="7" fill="#ff5a1f"/><circle cx="338" cy="90" r="7" fill="#ff5a1f"/><circle cx="540" cy="82" r="7" fill="#ff5a1f"/></svg><span class="truck-on-map">🚚</span></div>`;}
function support(){return `<section id="support" class="support-strip"><div class="support-main"><span style="font-size:32px">🎧</span><div><h3>Нужна помощь?</h3><p>Команда SilkFlow AI поможет с расчётом, документами, таможней и получением груза.</p></div></div><div class="support-item">💬<span><b>Онлайн-чат</b><small>Быстрые ответы</small></span></div><div class="support-item">☎️<span><b>+996 700 123-456</b><small>09:00–18:00</small></span></div><div class="support-item">✉️<span><b>support@silkflow.ai</b><small>Ответим в течение часа</small></span></div></section>`;}
function footer(){return `<footer class="footer"><div class="brand small"><span class="brand-mark">S</span><span>SilkFlow <b>AI</b></span></div><p>Цифровая логистика Нового Шёлкового Пути · ${dbMode==='cloud'?'общая облачная база':'локальный демо-режим'}</p><div class="footer-links"><a href="#overview">О платформе</a><a href="#shipments">Отправки</a><a href="#support">Поддержка</a></div><span>RU</span></footer>`;}
function table(rows=shipments){return `<div class="table-wrap"><table><thead><tr><th>№</th><th>Маршрут</th><th>Груз</th><th>Вес / Объём</th><th>Статус</th><th>Водитель</th><th>Дата</th></tr></thead><tbody>${rows.map(s=>`<tr><td><b>${esc(s.tracking_code)}</b></td><td>${esc(s.route)}</td><td>${esc(s.cargo)}</td><td>${Number(s.weight||0)} кг / ${Number(s.volume||0)} м³</td><td>${statusPill(s.status)}</td><td>${esc(s.assigned_driver||'—')}</td><td>${esc(s.date_label||'—')}</td></tr>`).join('')}</tbody></table></div>`;}
function info(l,v){return `<div class="info-row"><span>${esc(l)}</span><b>${esc(v??'—')}</b></div>`;}
function progress(status){const steps=['Принят','Отправлен','В пути','В стране','Таможня','К выдаче','Получено'];let idx=1;if(status==='В пути')idx=2;if(status==='Таможня')idx=4;if(status==='Готово к выдаче'||status==='Ожидает подтверждения')idx=5;if(status==='Получено')idx=6;if(status==='Последняя миля')idx=5;return `<div class="progress-row">${steps.map((x,i)=>`<div class="progress-step ${i<=idx?'done':''}"><span class="progress-dot">${i<idx?'✓':i+1}</span><small>${x}</small></div>`).join('')}</div>`;}
function downloadText(name,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/plain'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);toast('Пропуск скачан');}
function calcPrice(w,v,type='Авто'){const mult=type==='Ж/Д'?0.82:type==='Авиа'?2.4:type==='Мультимодальная'?0.94:1;return Math.round((620+Number(w||0)*1.05+Number(v||0)*75)*mult);}
function todayLabel(){return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric'}).format(new Date());}

async function refreshData(){shipments=await SilkDB.listShipments();jobs=await SilkDB.listJobs();}
async function switchRole(newRole){role=newRole;localStorage.setItem('silkflow_role_v2',role);const url=new URL(location.href);url.searchParams.set('role',role);history.replaceState({},'',url);roleSelect.value=role;roleLabel.textContent=roleName(role);await refreshData();await render();}

roleSelect.addEventListener('change',()=>switchRole(roleSelect.value));
document.getElementById('notifyBtn').onclick=()=>{let pop=document.querySelector('.notice-pop');if(pop){pop.remove();return;}pop=document.createElement('div');pop.className='notice-pop';pop.innerHTML='<b>Уведомления</b>'+notifications.map(n=>`<p>${n}</p>`).join('');document.body.appendChild(pop);};

dbStatus.onclick=async()=>{await refreshData();await render();toast(dbMode==='cloud'?'Данные синхронизированы с общей базой':'Локальные данные обновлены');};

async function render(){
  if(role==='sender') return renderSender();
  if(role==='warehouse') return renderWarehouse();
  if(role==='driver') return renderDriver();
  if(role==='receiver') return renderReceiver();
  return renderClient();
}

async function renderClient(){
  const active=shipments.filter(s=>s.status!=='Получено').length;
  app.innerHTML=hero('client','Кабинет клиента','Создавайте заявки, рассчитывайте стоимость и отслеживайте международные перевозки Китай — Кыргызстан — Узбекистан.','<button class="primary" id="goRequest">+ Создать заявку</button><button class="secondary" id="goTrack">🔎 Отследить груз</button>','SilkFlow AI','Маршрут в одном цифровом окне')+
  `<section class="stats-grid">${stat('📦',active,'Активные грузы','Общая цифровая очередь')}${stat('🚚',shipments.filter(s=>['В пути','Последняя миля'].includes(s.status)).length,'В пути','На маршруте сейчас')}${stat('📄',shipments.filter(s=>['Таможня','Ожидает документы'].includes(s.status)).length,'Требуют внимания','Документы / таможня')}${stat('✓',shipments.filter(s=>s.status==='Получено').length,'Завершено','Подтверждено получателем','green')}</section>`+
  `<section id="request" class="panel">${section('Создать заявку на перевозку','Быстрый предварительный расчёт. Для реальной отправки перейдите в роль «Отправитель».','','🧮')}<div class="form-grid request-grid"><label>Откуда<input id="cFrom" value="Иу, Китай"></label><label>Куда<input id="cTo" value="Ташкент, Узбекистан"></label><label>Тип перевозки<select id="cType"><option>Авто</option><option>Ж/Д</option><option>Авиа</option><option>Мультимодальная</option></select></label><label>Дата отправки<input id="cDate" type="date" value="2026-10-15"></label><label>Характер груза<input id="cCargo" value="Электроника"></label><label>Вес, кг<input id="cWeight" type="number" value="1200"></label><label>Объём, м³<input id="cVolume" type="number" step="0.1" value="6.5"></label><div class="estimate-box"><small>Предварительно</small><strong id="clientPrice">${money(calcPrice(1200,6.5))}</strong><span>12–16 дней</span><button id="createRequest" class="primary">Получить расчёт</button></div></div></section>`+
  `<div class="two-col"><section id="tracking" class="panel">${section('Отслеживание груза','Введите номер из общей базы','','🔎')}<div class="tracking-search"><input id="trackId" value="${esc(currentReceiverCode)}"><button id="trackBtn" class="primary">Найти</button></div><div id="trackResult"></div></section><section class="panel">${section('Что уже работает','Демонстрационная цепочка MVP','','⚡')}<div class="feature-list"><div><b>1. Создание груза</b><span>Отправитель создаёт единую цифровую карточку.</span></div><div><b>2. Smart Split</b><span>Склад определяет, куда направить коробку.</span></div><div><b>3. P2P последняя миля</b><span>Водитель принимает заказ из общей базы.</span></div><div><b>4. Получение</b><span>Получатель видит статус и подтверждает выдачу.</span></div></div></section></div>`+
  `<section id="shipments" class="panel">${section('Последние заказы','','','📦')}${table(shipments.slice(0,8))}</section>${support()}${footer()}`;
  document.getElementById('goRequest').onclick=()=>document.getElementById('request').scrollIntoView({behavior:'smooth'});
  document.getElementById('goTrack').onclick=()=>document.getElementById('tracking').scrollIntoView({behavior:'smooth'});
  const recalc=()=>document.getElementById('clientPrice').textContent=money(calcPrice(+document.getElementById('cWeight').value,+document.getElementById('cVolume').value,document.getElementById('cType').value));
  ['cWeight','cVolume','cType'].forEach(id=>document.getElementById(id).oninput=recalc);
  document.getElementById('createRequest').onclick=()=>toast('Расчёт готов. Для создания реальной записи откройте «Отправитель».');
  document.getElementById('trackBtn').onclick=trackFromClient;
  await trackFromClient();
}

async function trackFromClient(){
  const input=document.getElementById('trackId'); if(!input)return;
  const code=input.value.trim(); const s=await SilkDB.getShipment(code); const r=document.getElementById('trackResult');
  if(!s){r.innerHTML='<div class="empty-state">Груз не найден в базе.</div>';return;}
  const events=await SilkDB.listEvents(s.tracking_code);
  r.innerHTML=`<div class="track-summary"><strong>${esc(s.tracking_code)}</strong> ${statusPill(s.status)}<p>${esc(s.route)}</p><small>ETA: ${esc(s.eta_label||'уточняется')}</small></div>${routeMap(s.from_location.split(',').pop().trim(),s.to_location.split(',').pop().trim())}<div class="event-mini">${events.slice(-4).map(e=>`<span><b>${esc(e.stage)}</b>${esc(e.description||'')}</span>`).join('')}</div>`;
}

async function renderSender(){
  app.innerHTML=hero('sender','Кабинет отправителя','Создайте груз один раз — и та же запись станет доступна складу, водителю и получателю.','<button class="primary" id="goCreate">+ Создать отправку</button><button class="secondary" id="syncSender">↻ Синхронизировать</button>','Единая запись груза',dbMode==='cloud'?'Сохраняется в общей базе':'Сейчас работает локальный fallback')+
  `<section class="stats-grid">${stat('📦',shipments.filter(s=>s.status!=='Получено').length,'Активные отправки','В общей очереди')}${stat('📄',shipments.filter(s=>s.status==='Ожидает документы').length,'Ожидают документы','Требуется действие')}${stat('🚚',shipments.filter(s=>['В пути','Последняя миля'].includes(s.status)).length,'В пути','На маршруте')}${stat('✓',shipments.filter(s=>s.status==='Получено').length,'Доставлено','Подтверждено','green')}</section>`+
  `<section id="createShipment" class="panel">${section('Создать отправку','Рабочая форма MVP: запись сохраняется в общей базе при подключённом Supabase.','','＋')}<div class="form-split"><div class="subpanel"><h3>Данные отправителя</h3><div class="form-grid"><label>Компания<input id="sSender" value="ООО АзияТрейд"></label><label>Контактное лицо<input id="sSenderPerson" value="Иван Петров"></label></div></div><div class="subpanel"><h3>Данные получателя</h3><div class="form-grid"><label>Компания<input id="sReceiver" value="Silk Import LLC"></label><label>Контактное лицо<input id="sReceiverPerson" value="Алишер Каримов"></label></div></div></div><div class="form-grid four"><label>Описание груза<input id="sCargo" value="Электроника"></label><label>HS / ТН ВЭД<input id="sHs" value="8517 12 000 0"></label><label>Вес, кг<input id="sWeight" type="number" value="1200"></label><label>Объём, м³<input id="sVolume" type="number" step="0.1" value="6.5"></label><label>Количество мест<input id="sPlaces" type="number" value="50"></label><label>Откуда<input id="sFrom" value="Иу, Китай"></label><label>Куда<input id="sTo" value="Ош, Кыргызстан"></label><label>Тип<select id="sType"><option>Авто</option><option>Ж/Д</option><option>Мультимодальная</option></select></label></div><div class="sender-bottom"><div id="documents" class="upload-box"><span style="font-size:38px">☁️</span><h3>Документы</h3><p>Инвойс, Packing List, сертификаты</p><input id="docs" type="file" multiple><small id="fileCount">В MVP фиксируем факт выбора; Storage подключается следующим этапом.</small></div><div class="estimate-box large"><small>Предварительный расчёт</small><div><span>Стоимость доставки</span><strong id="senderPrice">${money(calcPrice(1200,6.5))}</strong></div><div><span>Таможенные сборы</span><strong id="customFee">${money(Math.round(calcPrice(1200,6.5)*.18))}</strong></div><div><span>Срок</span><strong>12–16 дней</strong></div><button id="submitShipment" class="primary">Создать отправку</button></div></div></section>`+
  `<section class="panel">${section('Маршрут','Через хаб SilkFlow AI в Джалал-Абаде','','📍')}${routeMap('Китай','Кыргызстан / Узбекистан')}</section><section id="shipments" class="panel">${section('Последние отправки','','','📦')}${table(shipments.slice(0,10))}</section>${support()}${footer()}`;
  document.getElementById('goCreate').onclick=()=>document.getElementById('createShipment').scrollIntoView({behavior:'smooth'});
  document.getElementById('syncSender').onclick=()=>syncAndRender();
  document.getElementById('docs').onchange=e=>document.getElementById('fileCount').textContent=`Выбрано файлов: ${e.target.files.length}`;
  ['sWeight','sVolume','sType'].forEach(id=>document.getElementById(id).oninput=recalcSender);
  document.getElementById('submitShipment').onclick=createShipmentFromForm;
}
function recalcSender(){const p=calcPrice(+document.getElementById('sWeight').value,+document.getElementById('sVolume').value,document.getElementById('sType').value);document.getElementById('senderPrice').textContent=money(p);document.getElementById('customFee').textContent=money(Math.round(p*.18));}
async function createShipmentFromForm(){
  const btn=document.getElementById('submitShipment');btn.disabled=true;btn.textContent='Создаём…';
  try{
    const w=+document.getElementById('sWeight').value||0,v=+document.getElementById('sVolume').value||0,type=document.getElementById('sType').value,p=calcPrice(w,v,type);
    const row=await SilkDB.createShipment({from_location:document.getElementById('sFrom').value,to_location:document.getElementById('sTo').value,cargo:document.getElementById('sCargo').value,weight:w,volume:v,status:'Создан',date_label:todayLabel(),eta_label:'12–16 дней',sender:document.getElementById('sSender').value,receiver:document.getElementById('sReceiver').value,hs_code:document.getElementById('sHs').value,places:+document.getElementById('sPlaces').value||0,price:p,delivery_method:'Не выбран'});
    currentReceiverCode=row.tracking_code;toast(`Отправка ${row.tracking_code} создана в ${dbMode==='cloud'?'общей базе':'демо-базе'}`);await refreshData();await renderSender();
  }catch(e){console.error(e);toast('Ошибка создания: '+e.message);btn.disabled=false;btn.textContent='Создать отправку';}
}

function smartSplitFor(s){
  const to=(s.to_location||'').toLowerCase();
  if(to.includes('джалал')) return {decision:'Выдать на складе Джалал-Абад',confidence:.99,needsJob:false};
  if(to.includes('ош')) return {decision:'Передать на рейс в Ош',confidence:.98,needsJob:true};
  if(to.includes('сузак')) return {decision:'Передать на последнюю милю в Сузак',confidence:.97,needsJob:true};
  if(to.includes('ташкент')||to.includes('андижан')||to.includes('узбек')) return {decision:'Направить в Узбекистан',confidence:.96,needsJob:true};
  return {decision:'Ручная проверка маршрута',confidence:.72,needsJob:false};
}
function customsFor(cargo=''){
  const c=cargo.toLowerCase();
  if(c.includes('обув')||c.includes('кроссов')) return {name:'Спортивная обувь',hs:'6404 11 000 0',confidence:.94,duty:12,vat:12};
  if(c.includes('одеж')) return {name:'Одежда',hs:'6204 62 390 0',confidence:.91,duty:10,vat:12};
  if(c.includes('авто')) return {name:'Автозапчасти',hs:'8708 99 970 9',confidence:.93,duty:5,vat:12};
  if(c.includes('текст')) return {name:'Текстиль',hs:'5407 61 300 0',confidence:.90,duty:8,vat:12};
  return {name:'Электроника / устройства связи',hs:'8517 13 000 0',confidence:.94,duty:12,vat:12};
}

async function renderWarehouse(){
  const target=shipments.find(s=>s.status!=='Получено')||shipments[0];
  app.innerHTML=hero('warehouse','Склад / Smart Split','Сканируем цифровой ID коробки, получаем решение маршрутизации и создаём заказ последней мили.','<button class="primary" id="goScan">📷 Сканировать коробку</button><button class="secondary" id="syncWh">↻ Синхронизировать</button>','Smart Split AI','1 коробка → 1 понятное действие')+
  `<section class="stats-grid">${stat('📦',shipments.length,'Грузов в системе','Общая база')}${stat('🧠',shipments.filter(s=>s.split_decision).length,'Smart Split','Уже распределены')}${stat('🚚',jobs.filter(j=>j.status==='available').length,'Заказов водителям','Доступно сейчас')}${stat('✓',shipments.filter(s=>s.status==='Получено').length,'Завершено','Цикл закрыт','green')}</section>`+
  `<section id="operations" class="panel">${section('Smart Split — сканирование коробки','Введите или отсканируйте tracking ID','','📷')}<div class="scan-row"><div class="scan-input"><label>Tracking ID<input id="scanCode" value="${esc(target?.tracking_code||'')}"></label><button class="primary" id="scanBtn">Сканировать</button></div><div id="scanResult" class="smart-result"></div></div></section>`+
  `<div class="two-col"><section class="panel">${section('ИИ-Таможенник','MVP-подсказка по товару; не является юридическим решением','','🧠')}<div class="customs-form"><label>Описание товара<input id="customsCargo" value="${esc(target?.cargo||'Электроника')}"></label><button class="primary" id="customsBtn">Анализировать</button></div><div id="customsResult"></div></section><section class="panel">${section('Очередь последней мили','Созданные Smart Split задания','','🚚')}<div id="warehouseJobs">${jobs.slice(0,5).map(jobCardSmall).join('')||'<div class="empty-state">Пока нет заданий</div>'}</div></section></div>`+
  `<section id="shipments" class="panel">${section('Все грузы склада','','','📦')}${table(shipments)}</section>${support()}${footer()}`;
  document.getElementById('goScan').onclick=()=>document.getElementById('operations').scrollIntoView({behavior:'smooth'});
  document.getElementById('syncWh').onclick=()=>syncAndRender();
  document.getElementById('scanBtn').onclick=runSmartSplit;
  document.getElementById('customsBtn').onclick=runCustoms;
  if(target) await showScanResult(target.tracking_code,false);
}
function jobCardSmall(j){return `<div class="job-mini"><div><b>${esc(j.shipment_code)}</b><span>${esc(j.pickup)} → ${esc(j.dropoff)}</span></div><div>${money(j.reward)} ${statusPill(j.status==='available'?'Доступен':j.status==='accepted'?'Принят':'Доставлен')}</div></div>`;}
async function showScanResult(code,apply=false){
  const box=document.getElementById('scanResult');const s=await SilkDB.getShipment(code);
  if(!s){box.innerHTML='<div class="empty-state">Коробка не найдена</div>';return;}
  const d=smartSplitFor(s);
  box.innerHTML=`<div class="smart-head"><span class="scan-box">📦</span><div><small>${esc(s.tracking_code)}</small><h3>${esc(s.cargo)}</h3><p>${esc(s.to_location)} · ${s.weight} кг · ${s.places} мест</p></div></div><div class="ai-decision"><span>SMART SPLIT</span><strong>${esc(d.decision)}</strong><small>Уверенность алгоритма: ${Math.round(d.confidence*100)}%</small></div>${s.assigned_driver?`<div class="driver-note">🚚 Водитель: <b>${esc(s.assigned_driver)}</b></div>`:''}<button class="primary full" id="applySplit">Применить решение</button>`;
  document.getElementById('applySplit').onclick=()=>applySmartSplit(s,d);
}
async function runSmartSplit(){await showScanResult(document.getElementById('scanCode').value.trim(),true);}
async function applySmartSplit(s,d){
  try{
    await SilkDB.updateShipment(s.tracking_code,{split_decision:d.decision,split_confidence:d.confidence,status:'Smart Split'});
    await SilkDB.addEvent(s.tracking_code,'Smart Split',d.decision);
    if(d.needsJob){const reward=Math.max(900,Math.round((Number(s.weight||0)*1.7+900)/100)*100);await SilkDB.createJob({shipment_code:s.tracking_code,pickup:'Хаб Джалал-Абад',dropoff:s.to_location,reward});}
    toast('Smart Split применён. Данные доступны водителю.');await refreshData();await renderWarehouse();
  }catch(e){console.error(e);toast('Ошибка: '+e.message);}
}
function runCustoms(){const result=customsFor(document.getElementById('customsCargo').value);const el=document.getElementById('customsResult');el.innerHTML=`<div class="customs-result"><div class="confidence-ring">${Math.round(result.confidence*100)}%</div><div><small>Предполагаемый товар</small><h3>${esc(result.name)}</h3><p><b>ТН ВЭД:</b> ${esc(result.hs)}</p><p><b>Пошлина:</b> ${result.duty}% · <b>НДС:</b> ${result.vat}%</p></div></div><div class="legal-note">⚠️ Рекомендательная подсказка MVP. Код и платежи должны быть проверены специалистом / брокером.</div>`;}

async function renderDriver(){
  const available=jobs.filter(j=>j.status==='available');const mine=jobs.filter(j=>j.driver_name==='Азамат Т.' && j.status!=='delivered');
  app.innerHTML=hero('driver','P2P-биржа водителей','Берите попутные заказы со склада SilkFlow AI и меняйте статус груза в той же общей базе.','<button class="primary" id="goJobs">Показать заказы</button><button class="secondary" id="syncDriver">↻ Синхронизировать</button>','Водитель: Азамат Т.','Рейтинг 4.9 · проверенный водитель')+
  `<section class="stats-grid">${stat('🚚',available.length,'Доступные рейсы','Можно принять')}${stat('📦',mine.length,'Мои активные','В работе')}${stat('💰',money(mine.reduce((a,j)=>a+Number(j.reward||0),0)),'Потенциальный доход','По активным заказам')}${stat('★','4.9','Рейтинг','Проверенный водитель','green')}</section>`+
  `<section id="operations" class="panel">${section('Доступные заказы','Заказы появляются после Smart Split склада','','🚚')}<div class="jobs-grid">${available.map(driverJobCard).join('')||'<div class="empty-state wide">Нет свободных заказов. На складе выполните Smart Split для нового груза.</div>'}</div></section>`+
  `<section class="panel">${section('Мои рейсы','Принятые вами заказы','','✓')}<div class="jobs-grid">${jobs.filter(j=>j.driver_name==='Азамат Т.').map(driverJobCard).join('')||'<div class="empty-state wide">Вы ещё не приняли заказ</div>'}</div></section>${support()}${footer()}`;
  document.getElementById('goJobs').onclick=()=>document.getElementById('operations').scrollIntoView({behavior:'smooth'});
  document.getElementById('syncDriver').onclick=()=>syncAndRender();
  document.querySelectorAll('[data-accept-job]').forEach(b=>b.onclick=()=>acceptDriverJob(b.dataset.acceptJob));
  document.querySelectorAll('[data-complete-job]').forEach(b=>b.onclick=()=>completeDriverJob(b.dataset.completeJob));
}
function driverJobCard(j){const s=shipments.find(x=>x.tracking_code===j.shipment_code);return `<article class="job-card"><div class="job-top"><span class="job-icon">🚚</span><div><small>${esc(j.shipment_code)}</small><h3>${esc(j.pickup)} → ${esc(j.dropoff)}</h3></div><strong>${money(j.reward)}</strong></div><div class="job-meta"><span>📦 ${s?esc(s.cargo):'Груз'}</span><span>⚖️ ${s?Number(s.weight):'—'} кг</span><span>📍 ${s?esc(s.places):'—'} мест</span></div><div class="job-actions">${j.status==='available'?`<button class="primary" data-accept-job="${j.id}">Принять заказ</button>`:j.status==='accepted'&&j.driver_name==='Азамат Т.'?`<button class="primary" data-complete-job="${j.id}">Доставил груз</button>`:`${statusPill(j.status==='delivered'?'Доставлен':'Принят')} ${j.driver_name?`<small>${esc(j.driver_name)}</small>`:''}`}</div></article>`;}
async function acceptDriverJob(id){try{await SilkDB.acceptJob(id,'Азамат Т.');toast('Заказ принят. Получатель увидит статус «Последняя миля».');await refreshData();await renderDriver();}catch(e){toast(e.message);}}
async function completeDriverJob(id){try{await SilkDB.completeJob(id);toast('Доставка отмечена. Ожидается подтверждение получателя.');await refreshData();await renderDriver();}catch(e){toast(e.message);}}

async function renderReceiver(){
  let s=await SilkDB.getShipment(currentReceiverCode);if(!s)s=shipments[0];if(!s){app.innerHTML='<div class="empty-state">Нет грузов</div>';return;}currentReceiverCode=s.tracking_code;
  const events=await SilkDB.listEvents(s.tracking_code);
  app.innerHTML=hero('receiver','Кабинет получателя','Откройте ту же отправку с другого устройства, проверьте маршрут и подтвердите получение.','<button class="primary" id="goIncoming">Отследить доставку</button><button class="secondary" id="syncReceiver">↻ Синхронизировать</button>','Ваш груз под контролем',s.tracking_code)+
  `<section class="stats-grid">${stat('📦',shipments.filter(x=>x.status!=='Получено').length,'Ожидается доставка','Входящие')}${stat('✓',shipments.filter(x=>x.status==='Готово к выдаче').length,'Готово к выдаче','Можно получить')}${stat('💳',shipments.filter(x=>x.payment_status==='Оплачено').length,'Оплачено','Платежи')}${stat('✓',shipments.filter(x=>x.status==='Получено').length,'Получено','Закрыто','green')}</section>`+
  `<section id="incoming" class="panel">${section('Отслеживание входящей отправки','Номер можно открыть по QR / ссылке','','🚚')}<div class="tracking-search receiver-search"><input id="receiverTrack" value="${esc(s.tracking_code)}"><button id="receiverFind" class="primary">Открыть</button></div><div class="incoming-top"><div><small>Номер отслеживания</small><h2>${esc(s.tracking_code)}</h2>${statusPill(s.status)}</div><div class="route-inline"><span>🇨🇳 ${esc(s.from_location)}</span><b>→</b><span>📍 ${esc(s.to_location)}</span></div></div>${progress(s.status)}<div class="three-col"><div class="subpanel"><h3>Информация об отправке</h3>${info('Отправитель',s.sender)}${info('Получатель',s.receiver)}${info('Груз',s.cargo)}${info('Вес / Объём',`${s.weight} кг / ${s.volume} м³`)}${info('Количество мест',s.places)}${info('ТН ВЭД',s.hs_code)}${info('Водитель',s.assigned_driver||'Ещё не назначен')}</div><div class="subpanel"><h3>Доставка и получение</h3><button class="delivery-option ${s.delivery_method==='Самовывоз'?'selected':''}" data-delivery="Самовывоз"><span>◉</span><div><b>Самовывоз</b><small>Со склада / хаба</small></div></button><button class="delivery-option ${s.delivery_method==='Курьер'?'selected':''}" data-delivery="Курьер"><span>○</span><div><b>Доставка курьером</b><small>Последняя миля</small></div></button><div class="address-box"><b>Хаб SilkFlow AI</b><small>Джалал-Абад · зона сортировки / выдачи</small></div><button id="confirmReceive" class="primary full" ${s.status==='Получено'?'disabled':''}>${s.status==='Получено'?'✓ Уже получено':'✓ Подтвердить получение'}</button></div><div class="subpanel qr-card"><h3>QR для получения</h3><div id="realQr" class="real-qr"></div><b>${esc(s.tracking_code)}</b><small>QR открывает эту отправку</small><button id="downloadPass" class="secondary">Скачать пропуск</button></div></div></section>`+
  `<div class="two-col"><section class="panel">${section('История статусов','События из общей базы','','🕘')}<div class="timeline">${events.length?events.map(e=>`<div><i></i><span><b>${esc(e.stage)}</b><small>${esc(e.description||'')}</small></span><time>${new Date(e.created_at).toLocaleString('ru-RU',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</time></div>`).join(''):'<div class="empty-state">Событий пока нет</div>'}</div></section><section class="panel">${section('Местоположение груза','','','📍')}${routeMap(s.from_location.split(',').pop().trim(),s.to_location.split(',').pop().trim())}<div class="payment-lines"><div><span>Стоимость доставки</span><b>${money(s.price)}</b></div><div><span>Оплата</span><span id="paymentStatus">${statusPill(s.payment_status||'Не оплачено')}</span></div></div><button id="payBtn" class="primary full" ${s.payment_status==='Оплачено'?'disabled':''}>${s.payment_status==='Оплачено'?'Оплачено':'Демо-оплата'}</button></section></div>`+
  `<section id="shipments" class="panel">${section('Последние входящие отправки','','','📦')}${table(shipments)}</section>${support()}${footer()}`;
  document.getElementById('goIncoming').onclick=()=>document.getElementById('incoming').scrollIntoView({behavior:'smooth'});
  document.getElementById('syncReceiver').onclick=()=>syncAndRender();
  document.getElementById('receiverFind').onclick=async()=>{const code=document.getElementById('receiverTrack').value.trim();const found=await SilkDB.getShipment(code);if(!found){toast('Груз не найден');return;}currentReceiverCode=found.tracking_code;const u=new URL(location.href);u.searchParams.set('track',currentReceiverCode);history.replaceState({},'',u);await refreshData();await renderReceiver();};
  document.querySelectorAll('.delivery-option').forEach(btn=>btn.onclick=async()=>{await SilkDB.updateShipment(s.tracking_code,{delivery_method:btn.dataset.delivery});toast('Способ получения сохранён');await refreshData();await renderReceiver();});
  document.getElementById('confirmReceive').onclick=async()=>{if(s.status==='Получено')return;await SilkDB.updateShipment(s.tracking_code,{status:'Получено'});await SilkDB.addEvent(s.tracking_code,'Получено','Получатель подтвердил получение груза');toast('Получение подтверждено');await refreshData();await renderReceiver();};
  document.getElementById('payBtn').onclick=async()=>{if(s.payment_status==='Оплачено')return;await SilkDB.updateShipment(s.tracking_code,{payment_status:'Оплачено'});await SilkDB.addEvent(s.tracking_code,'Оплата','Демо-оплата подтверждена');toast('Демо-оплата подтверждена');await refreshData();await renderReceiver();};
  document.getElementById('downloadPass').onclick=()=>downloadText(`${s.tracking_code}-pass.txt`,`SilkFlow AI — пропуск\nГруз: ${s.tracking_code}\nПолучатель: ${s.receiver}\nСтатус: ${s.status}\nToken: ${s.qr_token||''}`);
  buildQr(s);
}
function buildQr(s){const el=document.getElementById('realQr');if(!el)return;const url=new URL(location.href);url.searchParams.set('role','receiver');url.searchParams.set('track',s.tracking_code);if(window.QRCode){new QRCode(el,{text:url.toString(),width:132,height:132,colorDark:'#111827',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});}else{el.textContent=s.tracking_code;}}

async function syncAndRender(){await refreshData();await render();toast(dbMode==='cloud'?'Синхронизировано с общей базой':'Обновлено локально');}

async function boot(){
  try{
    const state=await SilkDB.init();setDbStatus(state.mode);await refreshData();
  }catch(e){console.error(e);setDbStatus('local');await refreshData();}
  if(!roleNames[role])role='client';roleSelect.value=role;roleLabel.textContent=roleName(role);await render();
}

boot();

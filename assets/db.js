(function () {
  const cfg = window.SILKFLOW_CONFIG || {};
  const hasCloudConfig = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  const supa = hasCloudConfig ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  const K = {
    shipments: 'silkflow_shipments_v2',
    events: 'silkflow_events_v2',
    jobs: 'silkflow_jobs_v2'
  };

  const seedShipments = [
    {tracking_code:'SF-2026-0012',route:'Китай → Узбекистан',from_location:'Иу, Китай',to_location:'Ташкент, Узбекистан',cargo:'Электроника',weight:1200,volume:6.5,status:'В пути',date_label:'10 окт 2026',eta_label:'16 окт 2026',sender:'Shenzhen Tech Co., Ltd.',receiver:'ООО АзияТрейд',hs_code:'8517 12 000 0',places:50,price:2350,delivery_method:'Самовывоз',payment_status:'Не оплачено',split_decision:'Направить в Узбекистан',split_confidence:0.96,assigned_driver:null,qr_token:'SF0012-DEMO'},
    {tracking_code:'SF-2026-0011',route:'Китай → Кыргызстан',from_location:'Кашгар, Китай',to_location:'Джалал-Абад, Кыргызстан',cargo:'Одежда',weight:800,volume:4.2,status:'Готово к выдаче',date_label:'7 окт 2026',eta_label:'11 окт 2026',sender:'Yiwu Trading Co.',receiver:'ОсОО Нур Логистик',hs_code:'6204 62 390 0',places:32,price:1280,delivery_method:'Самовывоз',payment_status:'Оплачено',split_decision:'Выдать на складе Джалал-Абад',split_confidence:0.99,assigned_driver:null,qr_token:'SF0011-DEMO'},
    {tracking_code:'SF-2026-0010',route:'Китай → Узбекистан',from_location:'Гуанчжоу, Китай',to_location:'Андижан, Узбекистан',cargo:'Автозапчасти',weight:950,volume:5.1,status:'Таможня',date_label:'3 окт 2026',eta_label:'12 окт 2026',sender:'Guangzhou Auto',receiver:'Andijan Motors',hs_code:'8708 99 970 9',places:18,price:1980,delivery_method:'Курьер',payment_status:'Не оплачено',split_decision:null,split_confidence:null,assigned_driver:null,qr_token:'SF0010-DEMO'},
    {tracking_code:'SF-2026-0009',route:'Китай → Кыргызстан',from_location:'Шэньчжэнь, Китай',to_location:'Ош, Кыргызстан',cargo:'Электроника',weight:450,volume:2.8,status:'Получено',date_label:'28 сен 2026',eta_label:'4 окт 2026',sender:'Shenzhen Tech Co.',receiver:'ОсОО Азия Электро',hs_code:'8517 13 000 0',places:15,price:870,delivery_method:'Курьер',payment_status:'Оплачено',split_decision:'Передать на рейс в Ош',split_confidence:0.98,assigned_driver:'Азамат Т.',qr_token:'SF0009-DEMO'},
    {tracking_code:'SF-2026-0008',route:'Китай → Узбекистан',from_location:'Иу, Китай',to_location:'Ташкент, Узбекистан',cargo:'Текстиль',weight:1500,volume:8,status:'Получено',date_label:'21 сен 2026',eta_label:'30 сен 2026',sender:'Yiwu Trading Co.',receiver:'Tashkent Textile',hs_code:'5407 61 300 0',places:64,price:2850,delivery_method:'Курьер',payment_status:'Оплачено',split_decision:'Направить в Узбекистан',split_confidence:0.95,assigned_driver:'Бекжан М.',qr_token:'SF0008-DEMO'}
  ];

  const seedEvents = [
    {shipment_code:'SF-2026-0012',stage:'Принят',description:'Груз зарегистрирован в SilkFlow AI',created_at:'2026-10-10T09:00:00Z'},
    {shipment_code:'SF-2026-0012',stage:'Отправлен',description:'Груз отправлен из Китая',created_at:'2026-10-10T12:00:00Z'},
    {shipment_code:'SF-2026-0012',stage:'В пути',description:'Контейнер следует к хабу',created_at:'2026-10-11T05:00:00Z'},
    {shipment_code:'SF-2026-0011',stage:'Готово к выдаче',description:'Груз доступен на складе Джалал-Абад',created_at:'2026-10-11T07:30:00Z'}
  ];

  const seedJobs = [
    {id:1,shipment_code:'SF-2026-0010',pickup:'Хаб Джалал-Абад',dropoff:'Андижан, Узбекистан',reward:3200,status:'available',driver_name:null,created_at:'2026-10-11T06:00:00Z'},
    {id:2,shipment_code:'SF-2026-0012',pickup:'Хаб Джалал-Абад',dropoff:'Ташкент, Узбекистан',reward:4200,status:'available',driver_name:null,created_at:'2026-10-11T06:10:00Z'}
  ];

  const clone = (x) => JSON.parse(JSON.stringify(x));
  const readLocal = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      if (Array.isArray(value)) return value;
    } catch (_) {}
    localStorage.setItem(key, JSON.stringify(fallback));
    return clone(fallback);
  };
  const writeLocal = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  async function seedCloudIfEmpty() {
    const { data, error } = await supa.from('shipments').select('tracking_code').limit(1);
    if (error) throw error;
    if (data && data.length) return;
    const { error: sErr } = await supa.from('shipments').insert(seedShipments);
    if (sErr) throw sErr;
    const { error: eErr } = await supa.from('shipment_events').insert(seedEvents);
    if (eErr) throw eErr;
    const jobs = seedJobs.map(({id, ...j}) => j);
    const { error: jErr } = await supa.from('delivery_jobs').insert(jobs);
    if (jErr) throw jErr;
  }

  async function init() {
    if (supa) {
      try {
        await seedCloudIfEmpty();
        return { mode: 'cloud', label: 'Общая база' };
      } catch (error) {
        console.warn('SilkFlow: Supabase unavailable, falling back to localStorage.', error);
      }
    }
    readLocal(K.shipments, seedShipments);
    readLocal(K.events, seedEvents);
    readLocal(K.jobs, seedJobs);
    return { mode: 'local', label: 'Демо-база' };
  }

  async function listShipments() {
    if (supa) {
      const { data, error } = await supa.from('shipments').select('*').order('created_at', { ascending: false });
      if (!error) return data || [];
      console.warn(error);
    }
    return readLocal(K.shipments, seedShipments);
  }

  async function getShipment(code) {
    const key = String(code || '').trim();
    if (!key) return null;
    if (supa) {
      const { data, error } = await supa.from('shipments').select('*').eq('tracking_code', key).maybeSingle();
      if (!error) return data || null;
      console.warn(error);
    }
    return readLocal(K.shipments, seedShipments).find(s => s.tracking_code.toLowerCase() === key.toLowerCase()) || null;
  }

  async function createShipment(payload) {
    const data = {
      tracking_code: payload.tracking_code || makeTrackingCode(),
      route: payload.route || inferRoute(payload.to_location),
      from_location: payload.from_location,
      to_location: payload.to_location,
      cargo: payload.cargo,
      weight: Number(payload.weight || 0),
      volume: Number(payload.volume || 0),
      status: payload.status || 'Создан',
      date_label: payload.date_label || todayLabel(),
      eta_label: payload.eta_label || 'Ожидает расчёта',
      sender: payload.sender || '—',
      receiver: payload.receiver || '—',
      hs_code: payload.hs_code || '',
      places: Number(payload.places || 0),
      price: Number(payload.price || 0),
      delivery_method: payload.delivery_method || 'Не выбран',
      payment_status: payload.payment_status || 'Не оплачено',
      split_decision: payload.split_decision || null,
      split_confidence: payload.split_confidence ?? null,
      assigned_driver: payload.assigned_driver || null,
      qr_token: payload.qr_token || token()
    };
    if (supa) {
      const { data: row, error } = await supa.from('shipments').insert(data).select().single();
      if (!error) {
        await addEvent(row.tracking_code, 'Создан', 'Отправка создана отправителем');
        return row;
      }
      throw error;
    }
    const rows = readLocal(K.shipments, seedShipments);
    rows.unshift({ ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    writeLocal(K.shipments, rows);
    await addEvent(data.tracking_code, 'Создан', 'Отправка создана отправителем');
    return data;
  }

  async function updateShipment(code, patch) {
    const cleanPatch = { ...patch, updated_at: new Date().toISOString() };
    if (supa) {
      const { data, error } = await supa.from('shipments').update(cleanPatch).eq('tracking_code', code).select().single();
      if (!error) return data;
      throw error;
    }
    let rows = readLocal(K.shipments, seedShipments);
    let changed = null;
    rows = rows.map(s => {
      if (s.tracking_code !== code) return s;
      changed = { ...s, ...cleanPatch };
      return changed;
    });
    writeLocal(K.shipments, rows);
    return changed;
  }

  async function listEvents(code) {
    if (supa) {
      const { data, error } = await supa.from('shipment_events').select('*').eq('shipment_code', code).order('created_at', { ascending: true });
      if (!error) return data || [];
      console.warn(error);
    }
    return readLocal(K.events, seedEvents).filter(e => e.shipment_code === code).sort((a,b) => new Date(a.created_at)-new Date(b.created_at));
  }

  async function addEvent(code, stage, description) {
    const row = { shipment_code: code, stage, description, created_at: new Date().toISOString() };
    if (supa) {
      const { data, error } = await supa.from('shipment_events').insert(row).select().single();
      if (!error) return data;
      throw error;
    }
    const rows = readLocal(K.events, seedEvents);
    rows.push({ id: Date.now(), ...row });
    writeLocal(K.events, rows);
    return row;
  }

  async function listJobs() {
    if (supa) {
      const { data, error } = await supa.from('delivery_jobs').select('*').order('created_at', { ascending: false });
      if (!error) return data || [];
      console.warn(error);
    }
    return readLocal(K.jobs, seedJobs);
  }

  async function getJobForShipment(code) {
    const jobs = await listJobs();
    return jobs.find(j => j.shipment_code === code) || null;
  }

  async function createJob(payload) {
    const existing = await getJobForShipment(payload.shipment_code);
    if (existing) return existing;
    const row = { shipment_code: payload.shipment_code, pickup: payload.pickup || 'Хаб Джалал-Абад', dropoff: payload.dropoff, reward: Number(payload.reward || 0), status:'available', driver_name:null };
    if (supa) {
      const { data, error } = await supa.from('delivery_jobs').insert(row).select().single();
      if (!error) return data;
      throw error;
    }
    const rows = readLocal(K.jobs, seedJobs);
    const stored = { id: Date.now(), created_at:new Date().toISOString(), ...row };
    rows.unshift(stored); writeLocal(K.jobs, rows); return stored;
  }

  async function acceptJob(id, driverName='Азамат Т.') {
    if (supa) {
      const { data, error } = await supa.from('delivery_jobs').update({status:'accepted',driver_name:driverName}).eq('id', id).eq('status','available').select().maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Заказ уже принят другим водителем');
      await updateShipment(data.shipment_code,{assigned_driver:driverName,status:'Последняя миля'});
      await addEvent(data.shipment_code,'Последняя миля',`Заказ принят водителем ${driverName}`);
      return data;
    }
    let rows = readLocal(K.jobs, seedJobs), changed=null;
    rows = rows.map(j => j.id == id && j.status==='available' ? (changed={...j,status:'accepted',driver_name:driverName}) : j);
    if (!changed) throw new Error('Заказ уже принят');
    writeLocal(K.jobs, rows);
    await updateShipment(changed.shipment_code,{assigned_driver:driverName,status:'Последняя миля'});
    await addEvent(changed.shipment_code,'Последняя миля',`Заказ принят водителем ${driverName}`);
    return changed;
  }

  async function completeJob(id) {
    if (supa) {
      const { data, error } = await supa.from('delivery_jobs').update({status:'delivered'}).eq('id',id).select().single();
      if (error) throw error;
      await updateShipment(data.shipment_code,{status:'Ожидает подтверждения'});
      await addEvent(data.shipment_code,'Доставлен',`Водитель ${data.driver_name || ''} доставил груз. Ожидается подтверждение получателя.`);
      return data;
    }
    let rows=readLocal(K.jobs,seedJobs), changed=null;
    rows=rows.map(j=>j.id==id?(changed={...j,status:'delivered'}):j); writeLocal(K.jobs,rows);
    if(changed){await updateShipment(changed.shipment_code,{status:'Ожидает подтверждения'});await addEvent(changed.shipment_code,'Доставлен',`Водитель ${changed.driver_name || ''} доставил груз. Ожидается подтверждение получателя.`)}
    return changed;
  }

  async function resetDemo() {
    if (supa) throw new Error('Сброс облачной базы отключён из интерфейса');
    writeLocal(K.shipments, clone(seedShipments));
    writeLocal(K.events, clone(seedEvents));
    writeLocal(K.jobs, clone(seedJobs));
    return true;
  }

  function inferRoute(to='') {
    const t=String(to).toLowerCase();
    if (t.includes('узбек') || t.includes('ташкент') || t.includes('андижан')) return 'Китай → Кыргызстан → Узбекистан';
    return 'Китай → Кыргызстан';
  }
  function makeTrackingCode(){return `SF-2026-${String(Date.now()).slice(-4)}`}
  function token(){return Math.random().toString(36).slice(2,10).toUpperCase()+Date.now().toString(36).slice(-5).toUpperCase()}
  function todayLabel(){return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric'}).format(new Date())}

  window.SilkDB = {
    init, isCloud: () => Boolean(supa), listShipments, getShipment, createShipment, updateShipment,
    listEvents, addEvent, listJobs, createJob, getJobForShipment, acceptJob, completeJob, resetDemo,
    inferRoute
  };
})();

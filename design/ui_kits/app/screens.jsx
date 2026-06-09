/* InvestAnalitic UI kit — screens */
const K = window.IAKit;
const { Icon, money, RUB, NUM0, Button, IconButton, Input, Select, Switch,
        Card, StatCard, PnLValue, Badge, AllocationBar, Avatar, Tabs,
        AIMessage, AIComposer, React } = K;
const { useState } = React;
const D = window.IA_DATA;

/* ===== Positions table ===== */
function EquityTable() {
  return (
    <table className="ia-table">
      <thead>
        <tr>
          <th>Тикер</th><th className="r">Кол-во</th><th className="r">Средняя</th>
          <th className="r">Цена</th><th className="r">Стоимость</th>
          <th className="r">За день</th><th className="r">Доход</th><th className="r">Вес</th>
        </tr>
      </thead>
      <tbody>
        {D.equities.map((p) => (
          <tr key={p.ticker}>
            <td>
              <div className="ia-cell-tk">
                <Avatar name={p.ticker} size="sm" />
                <div><div className="ia-cell-tk__t ia-mono">{p.ticker}</div><div className="ia-cell-tk__n">{p.name}</div></div>
              </div>
            </td>
            <td className="r ia-num">{NUM0.format(p.qty)}</td>
            <td className="r ia-num">{RUB.format(p.avg)}</td>
            <td className="r ia-num">{RUB.format(p.price)}</td>
            <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{money(p.value)}</td>
            <td className="r"><PnLValue percent={p.dayPct} display="percent" size="sm" /></td>
            <td className="r"><PnLValue value={p.pnl} percent={p.pnlPct} display="both" size="sm" /></td>
            <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{RUB.format(p.weight).replace(',00', '')}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BondTable() {
  return (
    <table className="ia-table">
      <thead>
        <tr>
          <th>Выпуск</th><th className="r">Кол-во</th><th className="r">Цена</th>
          <th className="r">Стоимость</th><th className="r">Купон</th>
          <th className="r">YTM</th><th>Погашение</th>
        </tr>
      </thead>
      <tbody>
        {D.bonds.map((p) => (
          <tr key={p.ticker}>
            <td>
              <div className="ia-cell-tk">
                <Avatar name={p.ticker} size="sm" color="var(--ink-600)" />
                <div><div className="ia-cell-tk__t ia-mono">{p.ticker}</div><div className="ia-cell-tk__n">{p.name}</div></div>
              </div>
            </td>
            <td className="r ia-num">{NUM0.format(p.qty)}</td>
            <td className="r ia-num">{RUB.format(p.price)}</td>
            <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{money(p.value)}</td>
            <td className="r ia-num">{RUB.format(p.coupon)} ₽</td>
            <td className="r"><Badge tone="positive" size="sm">{RUB.format(p.ytm).replace(',00','')}%</Badge></td>
            <td className="ia-num" style={{ color: 'var(--text-3)' }}>{p.maturity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ===== Dashboard ===== */
function Dashboard() {
  const [tab, setTab] = useState('eq');
  const p = D.portfolio;
  return (
    <div className="ia-screen">
      <div className="ia-grid-top">
        <Card>
          <div className="ia-eyebrow" style={{ marginBottom: 10 }}>Сводка портфеля</div>
          <StatCard size="xl" label="Стоимость" value={p.total}
            delta={p.dayDelta} deltaPercent={p.dayPct} caption="за сегодня" />
          <div className="ia-summ-row">
            <div><div className="ia-summ-k">Вложено</div><div className="ia-summ-v ia-num">{p.invested}</div></div>
            <div><div className="ia-summ-k">Доход за всё время</div><PnLValue value={p.allDelta} percent={p.allPct} size="md" /></div>
          </div>
          <div style={{ marginTop: 18 }}>
            <div className="ia-eyebrow" style={{ marginBottom: 10 }}>Состав</div>
            <AllocationBar size="lg" segments={D.alloc} />
          </div>
        </Card>
        <Card className="ia-ai-aside">
          <div className="ia-ai-aside__head"><Icon n="sparkles" size={16} /><span>Аналитик заметил</span></div>
          <div className="ia-signal ia-signal--warn">
            <span className="ia-signal__emoji">⚠️</span>
            <div><b>LKOH — 28,9% портфеля</b><p>Выше цели 12%. Высокая концентрация в одном эмитенте увеличивает риск.</p>
            <Button variant="soft" size="sm">Ребалансировать</Button></div>
          </div>
          <div className="ia-signal">
            <span className="ia-signal__emoji">📅</span>
            <div><b>SBER: дивиденд через 4 дня</b><p>~12,50 ₽ на акцию · ожидается ~6 250 ₽ до налогов.</p></div>
          </div>
          <div className="ia-signal">
            <span className="ia-signal__emoji">🧾</span>
            <div><b>GAZP в минусе −25 530 ₽</b><p>Можно зафиксировать убыток до конца года и уменьшить налог.</p></div>
          </div>
        </Card>
      </div>

      <Card tightBody>
        <div className="ia-table-head">
          <Tabs value={tab} onChange={setTab} items={[
            { value: 'eq', label: 'Акции', count: D.equities.length },
            { value: 'bond', label: 'Облигации', count: D.bonds.length },
            { value: 'cash', label: 'Деньги' },
          ]} />
          <div className="ia-table-head__r">
            <Select size="sm" defaultValue="all">
              <option value="all">Все счета</option>
              <option>Сбер Инвестиции</option>
              <option>Т-Банк Инвестиции</option>
            </Select>
            <IconButton variant="outlined" label="Экспорт"><Icon n="download" size={16} /></IconButton>
          </div>
        </div>
        {tab === 'eq' && <EquityTable />}
        {tab === 'bond' && <BondTable />}
        {tab === 'cash' && (
          <div className="ia-cash">
            <div className="ia-cash__row"><span className="ia-mono">RUB</span><span className="ia-num">180 350,00 ₽</span></div>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ===== Assistant ===== */
function Assistant() {
  const [msgs, setMsgs] = useState([
    { role: 'ai', body: <><p>Привет! Я твой инвестиционный ИИ-аналитик. Знаю твой портфель досконально — спрашивай или добавляй сделки в любой форме.</p></> },
    { role: 'user', body: 'Как мой портфель за месяц?' },
    { role: 'ai', body: <><p>За месяц портфель <strong>+4,8%</strong> (+114 200 ₽). Основной вклад — YDEX (+17,5%) и SBER (+31,1% за всё время).</p><p>Что настораживает: GAZP в минусе на −21%, тянет результат вниз. И LKOH разросся до 28,9% — стоит присмотреться к балансу.</p></>,
      actions: [<K.Button key="1" variant="soft" size="sm">Разобрать GAZP</K.Button>, <K.Button key="2" variant="ghost" size="sm">Показать график</K.Button>] },
  ]);
  const [typing, setTyping] = useState(false);

  const send = (text) => {
    setMsgs((m) => [...m, { role: 'user', body: text }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { role: 'ai', body: <><p>Считаю по твоим данным… Записал запрос: «{text}». В демо-режиме ответ заглушка, но в продукте здесь будет конкретный разбор с цифрами из портфеля и вариантами действий.</p></> }]);
    }, 1400);
  };

  return (
    <div className="ia-screen ia-chat">
      <div className="ia-chat__feed">
        {msgs.map((m, i) => (
          <AIMessage key={i} role={m.role} actions={m.actions}>{m.body}</AIMessage>
        ))}
        {typing && <AIMessage role="ai" typing />}
      </div>
      <div className="ia-chat__composer">
        <AIComposer onSend={send}
          suggestions={['Когда ближайшие дивиденды?', 'Стоит ли ребалансировать?', 'Какой у меня налог при продаже LKOH?']} />
      </div>
    </div>
  );
}

/* ===== Rebalance ===== */
function Rebalance() {
  const rows = [
    { tk: 'LKOH', cur: 28.9, tgt: 12, action: 'Продать', amount: '−418 600 ₽' },
    { tk: 'YDEX', cur: 10.9, tgt: 12, action: 'Купить', amount: '+27 200 ₽' },
    { tk: 'SBER', cur: 9.2, tgt: 15, action: 'Купить', amount: '+143 900 ₽' },
    { tk: 'GAZP', cur: 3.9, tgt: 8, action: 'Купить', amount: '+101 700 ₽' },
  ];
  return (
    <div className="ia-screen ia-grid-reb">
      <Card title="Целевые веса" subtitle="Перетащи или задай % — аналитик рассчитает сделки">
        {rows.map((r) => (
          <div key={r.tk} className="ia-reb-row">
            <span className="ia-mono ia-reb-row__tk">{r.tk}</span>
            <div className="ia-reb-bar"><div className="ia-reb-bar__cur" style={{ width: r.cur + '%' }} /><div className="ia-reb-bar__tgt" style={{ left: r.tgt + '%' }} /></div>
            <span className="ia-num ia-reb-row__cur">{RUB.format(r.cur).replace(',00','')}%</span>
            <Icon n="arrow-right" size={14} />
            <span className="ia-num ia-reb-row__tgt">{r.tgt}%</span>
          </div>
        ))}
        <div className="ia-reb-legend"><span><i className="dot cur" />Текущий</span><span><i className="dot tgt" />Цель</span></div>
      </Card>
      <Card title="План сделок" actions={<Button size="sm">Применить</Button>}>
        <table className="ia-table ia-table--plain">
          <thead><tr><th>Тикер</th><th>Действие</th><th className="r">Сумма</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.tk}>
                <td className="ia-mono">{r.tk}</td>
                <td><Badge tone={r.action === 'Купить' ? 'positive' : 'negative'} size="sm">{r.action}</Badge></td>
                <td className="r ia-num" style={{ color: r.action === 'Купить' ? 'var(--pnl-up)' : 'var(--pnl-down)' }}>{r.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ia-note"><Icon n="info" size={14} /><span>Не индивидуальная инвестиционная рекомендация. Комиссии и налоги ориентировочные.</span></div>
      </Card>
    </div>
  );
}

/* ===== Calendar ===== */
function Calendar() {
  return (
    <div className="ia-screen">
      <div className="ia-cal-stats">
        <Card><StatCard label="Ожидается за 30 дней" value="67 270,00 ₽" icon={<Icon n="calendar" size={15} />} /></Card>
        <Card><StatCard label="Получено в этом году" value="184 320,00 ₽" icon={<Icon n="banknote" size={15} />} /></Card>
        <Card><StatCard label="Форвардная доходность" value="8,4" unit="%" icon={<Icon n="trending-up" size={15} />} /></Card>
      </div>
      <Card title="Ближайшие выплаты" tightBody>
        <table className="ia-table">
          <thead><tr><th>Дата</th><th>Инструмент</th><th>Тип</th><th className="r">На бумагу</th><th className="r">Сумма</th><th>Статус</th></tr></thead>
          <tbody>
            {D.payments.map((p, i) => (
              <tr key={i}>
                <td className="ia-num" style={{ color: 'var(--text-2)', fontWeight: 600 }}>{p.date}</td>
                <td><div className="ia-cell-tk"><Avatar name={p.ticker} size="sm" color={p.type==='coupon'?'var(--ink-600)':undefined} /><div><div className="ia-cell-tk__t ia-mono">{p.ticker}</div><div className="ia-cell-tk__n">{p.name}</div></div></div></td>
                <td><Badge tone={p.type === 'dividend' ? 'accent' : 'neutral'} size="sm">{p.type === 'dividend' ? '💰 Дивиденд' : '🧾 Купон'}</Badge></td>
                <td className="r ia-num">{p.perShare}</td>
                <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{p.amount}</td>
                <td>{p.status === 'paid' ? <Badge tone="positive" dot size="sm">Выплачено</Badge> : <Badge tone="warning" size="sm">Через {p.days} дн.</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

window.IAScreens = { Dashboard, Assistant, Rebalance, Calendar };

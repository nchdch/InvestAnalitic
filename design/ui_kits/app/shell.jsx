/* InvestAnalitic UI kit — app shell, tables and screens.
   Built on the design-system bundle (window.InvestAnaliticDesignSystem_81c80b)
   + tokens from styles.css. Lucide for icons. */

const DS = window.InvestAnaliticDesignSystem_81c80b;
const { Button, IconButton, Input, Select, Switch,
        Card, StatCard, PnLValue, Badge, AllocationBar, Avatar,
        Tabs, AIMessage, AIComposer } = DS;
const { useState, useEffect, useRef } = React;

const RUB = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (v) => RUB.format(v) + ' ₽';
const NUM0 = new Intl.NumberFormat('ru-RU');

function Icon({ n, size }) {
  const ref = useRef(null);
  useEffect(() => { if (window.lucide) window.lucide.createIcons({ nameAttr: 'data-lucide', icons: window.lucide.icons, attrs: {} }); });
  return <i data-lucide={n} style={size ? { width: size, height: size } : undefined} ref={ref} />;
}

/* ---------------- Sidebar ---------------- */
function Sidebar({ nav, setNav }) {
  const items = [
    { id: 'dashboard', label: 'Портфель', icon: 'layout-dashboard' },
    { id: 'assistant', label: 'ИИ-аналитик', icon: 'sparkles' },
    { id: 'rebalance', label: 'Ребалансировка', icon: 'scale' },
    { id: 'calendar', label: 'Выплаты', icon: 'calendar' },
  ];
  return (
    <aside className="ia-sidebar">
      <div className="ia-sidebar__brand">
        <img src="../../assets/logo-mark.svg" alt="" width="32" height="32" />
        <span className="ia-sidebar__word">Invest<b>Analitic</b></span>
      </div>
      <nav className="ia-sidebar__nav">
        {items.map((it) => (
          <button key={it.id}
            className={'ia-navitem' + (nav === it.id ? ' is-active' : '')}
            onClick={() => setNav(it.id)}>
            <Icon n={it.icon} size={18} />
            <span>{it.label}</span>
            {it.id === 'assistant' && <span className="ia-navitem__pip" />}
          </button>
        ))}
      </nav>
      <div className="ia-sidebar__accounts">
        <div className="ia-eyebrow" style={{ padding: '0 4px 8px' }}>Счета</div>
        {window.IA_DATA.accounts.map((a) => (
          <div key={a.id} className="ia-acctmini">
            <Avatar name={a.name} size="sm" />
            <div className="ia-acctmini__txt">
              <div className="ia-acctmini__name">{a.name}</div>
              <div className="ia-acctmini__val ia-num">{a.value}</div>
            </div>
          </div>
        ))}
        <button className="ia-navitem ia-navitem--ghost"><Icon n="plus" size={16} /><span>Добавить счёт</span></button>
      </div>
      <div className="ia-sidebar__user">
        <Avatar name="Алексей М" shape="circle" size="sm" color="var(--ink-600)" />
        <span>Алексей М.</span>
        <IconButton label="Настройки" size="sm"><Icon n="settings" size={16} /></IconButton>
      </div>
    </aside>
  );
}

/* ---------------- Top bar ---------------- */
function Topbar({ title, sub }) {
  return (
    <header className="ia-topbar">
      <div>
        <h1 className="ia-topbar__title">{title}</h1>
        {sub && <p className="ia-topbar__sub">{sub}</p>}
      </div>
      <div className="ia-topbar__actions">
        <div className="ia-search">
          <Icon n="search" size={16} />
          <input placeholder="Поиск тикера, эмитента…" />
        </div>
        <IconButton variant="outlined" label="Уведомления"><Icon n="bell" size={18} /></IconButton>
        <Button leftIcon={<Icon n="plus" size={18} />}>Добавить сделку</Button>
      </div>
    </header>
  );
}

window.IAKit = { DS, Icon, Sidebar, Topbar, money, RUB, NUM0,
  Button, IconButton, Input, Select, Switch, Card, StatCard, PnLValue,
  Badge, AllocationBar, Avatar, Tabs, AIMessage, AIComposer, React };

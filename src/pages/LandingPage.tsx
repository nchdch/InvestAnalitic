
import logoMark from '../assets/logo-mark.svg'
import { Button } from '../components'
import {
  Sparkles, BarChart2, Scale, CalendarDays,
  ShieldCheck, Zap, ArrowRight
} from 'lucide-react'

const CSS = `
.ia-landing{
  min-height:100vh; background:var(--surface-app);
  font-family:var(--font-sans); color:var(--text-2);
  display:flex; flex-direction:column;
}

/* ---- header ---- */
.ia-lp-header{
  display:flex; align-items:center; justify-content:space-between;
  padding:18px 48px; background:var(--surface-card);
  border-bottom:1px solid var(--border-1); position:sticky; top:0; z-index:var(--z-sticky);
}
.ia-lp-brand{ display:flex; align-items:center; gap:10px; text-decoration:none; }
.ia-lp-brand__word{ font-size:18px; font-weight:500; color:var(--text-1); letter-spacing:-0.01em; }
.ia-lp-brand__word b{ font-weight:700; color:var(--accent); }

/* ---- hero ---- */
.ia-lp-hero{
  flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
  text-align:center; padding:80px 24px 72px;
  background:radial-gradient(ellipse 70% 50% at 50% 0%, oklch(0.88 0.055 258 / 0.35) 0%, transparent 70%);
}
.ia-lp-hero__kicker{
  display:inline-flex; align-items:center; gap:7px;
  font-size:var(--text-sm); font-weight:var(--fw-semibold);
  color:var(--accent); background:var(--accent-soft);
  padding:5px 14px; border-radius:var(--radius-pill); margin-bottom:24px;
}
.ia-lp-hero__h1{
  font-size:clamp(36px, 5.5vw, 68px); font-weight:var(--fw-extrabold);
  color:var(--text-1); letter-spacing:var(--tracking-tight);
  line-height:1.05; max-width:860px; margin:0 0 20px; text-wrap:balance;
}
.ia-lp-hero__h1 mark{
  background:none; color:var(--accent);
}
.ia-lp-hero__sub{
  font-size:clamp(var(--text-base), 2vw, var(--text-lg));
  color:var(--text-3); max-width:560px; line-height:1.6; margin:0 0 40px;
}
.ia-lp-hero__cta{ display:flex; align-items:center; gap:12px; flex-wrap:wrap; justify-content:center; }
.ia-lp-hero__hint{ font-size:var(--text-xs); color:var(--text-4); margin-top:16px; }

/* ---- mock chat preview ---- */
.ia-lp-preview{
  margin:0 auto; max-width:680px; width:100%;
  background:var(--surface-card); border:1px solid var(--border-1);
  border-radius:var(--radius-xl); box-shadow:var(--shadow-lg);
  overflow:hidden; margin-top:56px;
}
.ia-lp-preview__bar{
  display:flex; align-items:center; gap:8px; padding:10px 16px;
  background:var(--surface-sunken); border-bottom:1px solid var(--border-1);
}
.ia-lp-preview__dot{ width:11px; height:11px; border-radius:50%; }
.ia-lp-preview__msgs{ padding:24px 20px; display:flex; flex-direction:column; gap:14px; }
.ia-lp-preview__msg{
  padding:11px 14px; border-radius:var(--radius-lg); font-size:var(--text-sm); line-height:1.5;
  max-width:78%; color:var(--text-1);
}
.ia-lp-preview__msg--ai{
  background:var(--surface-ai); border:1px solid var(--ai-soft);
  border-top-left-radius:var(--radius-xs); align-self:flex-start;
}
.ia-lp-preview__msg--user{
  background:var(--accent); color:var(--text-on-accent);
  border-top-right-radius:var(--radius-xs); align-self:flex-end;
}
.ia-lp-preview__msg strong{ font-weight:var(--fw-semibold); }
.ia-lp-preview__msg .chip{
  display:inline-flex; font-size:var(--text-2xs); font-weight:var(--fw-semibold);
  background:var(--accent-soft); color:var(--accent-hover);
  padding:2px 8px; border-radius:var(--radius-pill); margin:6px 4px 0 0; cursor:pointer;
}

/* ---- features ---- */
.ia-lp-feats{
  display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));
  gap:20px; max-width:1100px; width:100%; margin:0 auto; padding:72px 48px;
}
.ia-lp-feat{
  background:var(--surface-card); border:1px solid var(--border-1);
  border-radius:var(--radius-lg); padding:24px; box-shadow:var(--shadow-xs);
  transition:box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out);
}
.ia-lp-feat:hover{ box-shadow:var(--shadow-md); border-color:var(--border-2); }
.ia-lp-feat__icon{
  width:42px; height:42px; border-radius:var(--radius-md); margin-bottom:16px;
  display:flex; align-items:center; justify-content:center; color:#fff;
}
.ia-lp-feat__title{ font-size:var(--text-h4); font-weight:var(--fw-semibold); color:var(--text-1); margin:0 0 8px; }
.ia-lp-feat__desc{ font-size:var(--text-sm); color:var(--text-3); line-height:1.55; margin:0; }

/* ---- compare ---- */
.ia-lp-compare{
  background:var(--surface-card); border-top:1px solid var(--border-1); border-bottom:1px solid var(--border-1);
  padding:64px 48px; display:flex; flex-direction:column; align-items:center;
}
.ia-lp-compare h2{ font-size:var(--text-h2); font-weight:var(--fw-bold); color:var(--text-1); margin:0 0 8px; text-align:center; }
.ia-lp-compare p{ font-size:var(--text-base); color:var(--text-3); margin:0 0 40px; text-align:center; }
.ia-lp-compare__grid{
  display:grid; grid-template-columns:1fr 1fr; gap:20px;
  max-width:760px; width:100%;
}
.ia-lp-compare__col{ border-radius:var(--radius-lg); padding:20px 24px; }
.ia-lp-compare__col--them{ background:var(--surface-sunken); border:1px solid var(--border-1); }
.ia-lp-compare__col--us{ background:var(--accent-soft); border:1px solid var(--azure-200); }
.ia-lp-compare__head{ font-size:var(--text-sm); font-weight:var(--fw-bold); margin:0 0 14px; }
.ia-lp-compare__head--them{ color:var(--text-3); }
.ia-lp-compare__head--us{ color:var(--accent-hover); }
.ia-lp-compare__item{ display:flex; gap:9px; font-size:var(--text-sm); color:var(--text-2); margin-bottom:10px; line-height:1.4; }
.ia-lp-compare__item svg{ flex:none; margin-top:1px; }

/* ---- cta-bottom ---- */
.ia-lp-cta{
  padding:80px 24px; display:flex; flex-direction:column; align-items:center;
  text-align:center; gap:20px;
  background:radial-gradient(ellipse 60% 80% at 50% 100%, oklch(0.88 0.055 258 / 0.25) 0%, transparent 70%);
}
.ia-lp-cta h2{ font-size:clamp(28px, 4vw, 46px); font-weight:var(--fw-extrabold); color:var(--text-1); margin:0; letter-spacing:var(--tracking-tight); }
.ia-lp-cta p{ font-size:var(--text-base); color:var(--text-3); margin:0; max-width:480px; }

/* ---- footer ---- */
.ia-lp-footer{
  border-top:1px solid var(--border-1); padding:20px 48px;
  display:flex; align-items:center; justify-content:space-between;
  font-size:var(--text-xs); color:var(--text-4);
}

@media (max-width: 680px) {
  .ia-lp-header, .ia-lp-footer{ padding:14px 20px; }
  .ia-lp-feats{ padding:48px 20px; }
  .ia-lp-compare{ padding:48px 20px; }
  .ia-lp-compare__grid{ grid-template-columns:1fr; }
}
`

function injectLandingCSS() {
  if (typeof document === 'undefined') return
  if (document.getElementById('ia-landing-css')) return
  const el = document.createElement('style')
  el.id = 'ia-landing-css'
  el.textContent = CSS
  document.head.appendChild(el)
}

const FEATURES = [
  {
    icon: <Sparkles size={20} />,
    bg: 'linear-gradient(135deg, var(--violet-500), var(--azure-500))',
    title: 'ИИ-аналитик в центре',
    desc: 'Добавляй сделки в любой форме — «купил 5 лотов Сбера по 286». Аналитик сам разберёт, запишет и предупредит о рисках.',
  },
  {
    icon: <BarChart2 size={20} />,
    bg: 'var(--azure-600)',
    title: 'Точный учёт P&L',
    desc: 'Нереализованный и реализованный P&L, дивидендная доходность, разбивка по периодам — по каждой позиции и всему портфелю.',
  },
  {
    icon: <Scale size={20} />,
    bg: 'var(--gain-600)',
    title: 'Умная ребалансировка',
    desc: 'Укажи целевые веса — аналитик рассчитает план сделок с учётом комиссий, налогов и свободного кэша.',
  },
  {
    icon: <CalendarDays size={20} />,
    bg: 'var(--amber-600)',
    title: 'Календарь выплат',
    desc: 'Дивиденды и купоны с уведомлениями за 4 дня до отсечки. Форвардная доходность всегда перед глазами.',
  },
  {
    icon: <ShieldCheck size={20} />,
    bg: 'var(--ink-700)',
    title: 'Налоговая оптимизация',
    desc: 'В конце года аналитик находит убыточные позиции для сальдирования и считает экономию НДФЛ — конкретной суммой.',
  },
  {
    icon: <Zap size={20} />,
    bg: 'var(--violet-600)',
    title: 'Акции и облигации',
    desc: 'YTM, дюрация, НКД, оферта — всё посчитано. Несколько счетов у разных брокеров в одном окне.',
  },
]

const THEM = [
  'Таблица — ты сам интерпретируешь цифры',
  'Форма для ввода каждого поля по отдельности',
  'Уведомления нужно настраивать вручную',
  'Налоги — отдельный экран, без рекомендаций',
]

const US = [
  'Аналитик говорит: что хорошо, что настораживает',
  'Пишешь как другу — он всё разбирает сам',
  'Проактивно предупреждает за 3–5 дней',
  'Считает экономию и предлагает конкретные сделки',
]

interface Props {
  onStart: () => void
}

export function LandingPage({ onStart }: Props) {
  injectLandingCSS()

  return (
    <div className="ia-landing">
      {/* Header */}
      <header className="ia-lp-header">
        <a href="#" className="ia-lp-brand">
          <img src={logoMark} alt="" width={28} height={28} />
          <span className="ia-lp-brand__word">Invest<b>Analitic</b></span>
        </a>
        <Button variant="secondary" size="sm" onClick={onStart}>Войти</Button>
      </header>

      {/* Hero */}
      <section className="ia-lp-hero">
        <div className="ia-lp-hero__kicker">
          <Sparkles size={14} />
          AI-first инвестиционный трекер
        </div>
        <h1 className="ia-lp-hero__h1">
          Портфель, который <mark>думает</mark> вместе с тобой
        </h1>
        <p className="ia-lp-hero__sub">
          Аналог Intelinvest, но вместо таблиц — умный аналитик.
          Вводи сделки текстом, получай разборы, риски и рекомендации прямо в чате.
        </p>
        <div className="ia-lp-hero__cta">
          <Button size="lg" rightIcon={<ArrowRight size={18} />} onClick={onStart}>
            Начать бесплатно
          </Button>
          <Button size="lg" variant="secondary" onClick={onStart}>
            Смотреть демо
          </Button>
        </div>
        <p className="ia-lp-hero__hint">Без регистрации · Демо-данные уже загружены</p>

        {/* Mini chat preview */}
        <div className="ia-lp-preview">
          <div className="ia-lp-preview__bar">
            <span className="ia-lp-preview__dot" style={{ background: 'var(--loss-500)' }} />
            <span className="ia-lp-preview__dot" style={{ background: 'var(--amber-500)' }} />
            <span className="ia-lp-preview__dot" style={{ background: 'var(--gain-500)' }} />
          </div>
          <div className="ia-lp-preview__msgs">
            <div className="ia-lp-preview__msg ia-lp-preview__msg--user">
              Купил сегодня 10 лотов SBER по 285,50, комиссия 0,06%
            </div>
            <div className="ia-lp-preview__msg ia-lp-preview__msg--ai">
              Записал: <strong>SBER × 1 000 акций</strong> по 285,50 ₽, комиссия 171,30 ₽.
              Средняя по позиции стала <strong>283,70 ₽</strong>, нереализованный P&L: <strong>+1 800 ₽ (+0,63%)</strong>.
              <br /><br />
              ⚠️ SBER занял <strong>14,2%</strong> портфеля — выше целевых 12%.
              <div>
                <span className="chip">Посмотреть ребалансировку</span>
                <span className="chip">История по SBER</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <div className="ia-lp-feats">
        {FEATURES.map((f) => (
          <div key={f.title} className="ia-lp-feat">
            <div className="ia-lp-feat__icon" style={{ background: f.bg }}>{f.icon}</div>
            <p className="ia-lp-feat__title">{f.title}</p>
            <p className="ia-lp-feat__desc">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Compare */}
      <section className="ia-lp-compare">
        <h2>Intelinvest vs InvestAnalitic</h2>
        <p>Те же данные — другой уровень работы с ними</p>
        <div className="ia-lp-compare__grid">
          <div className="ia-lp-compare__col ia-lp-compare__col--them">
            <p className="ia-lp-compare__head ia-lp-compare__head--them">Классические трекеры</p>
            {THEM.map((t) => (
              <div key={t} className="ia-lp-compare__item">
                <span style={{ color: 'var(--text-4)', fontSize: 16 }}>—</span>
                {t}
              </div>
            ))}
          </div>
          <div className="ia-lp-compare__col ia-lp-compare__col--us">
            <p className="ia-lp-compare__head ia-lp-compare__head--us">InvestAnalitic</p>
            {US.map((u) => (
              <div key={u} className="ia-lp-compare__item">
                <span style={{ color: 'var(--positive)', fontSize: 16 }}>✓</span>
                {u}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="ia-lp-cta">
        <h2>Попробуй прямо сейчас</h2>
        <p>Демо-портфель загружен — аналитик уже знает позиции и готов отвечать на вопросы.</p>
        <Button size="lg" rightIcon={<ArrowRight size={18} />} onClick={onStart}>
          Открыть портфель
        </Button>
      </section>

      {/* Footer */}
      <footer className="ia-lp-footer">
        <span>© 2026 InvestAnalitic</span>
        <span>Не является индивидуальной инвестиционной рекомендацией</span>
      </footer>
    </div>
  )
}

import React from 'react';

const cardConfig = [
  {
    key: 'power',
    label: 'Total Power',
    iconClass: 'stat-card__icon--power',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
      </svg>
    ),
    getValue: (tp) => tp?.total_power_w ?? '0',
    unit: 'w',
    sub: 'Live consumption',
  },
  {
    key: 'activeDevices',
    label: 'Active Devices',
    iconClass: 'stat-card__icon--devices',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
      </svg>
    ),
    getValue: (tp) => tp?.devices_total ?? '15',
    sub: (tp) => `Across 3 rooms`,
  },
  {
    key: 'devicesOn',
    label: 'Devices ON',
    iconClass: 'stat-card__icon--on',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22,4 12,14.01 9,11.01" />
      </svg>
    ),
    getValue: (tp) => tp?.devices_on ?? '0',
    valueSuffix: (tp) => `/ ${tp?.devices_total ?? '15'}`,
    sub: 'Currently running',
  },
  {
    key: 'alerts',
    label: 'Alerts',
    iconClass: 'stat-card__icon--alerts',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    getValue: (_tp, alerts) => alerts?.length ?? 0,
    sub: 'Needs attention',
  },
  {
    key: 'saved',
    label: 'Energy Saved',
    iconClass: 'stat-card__icon--saved',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10" />
        <path d="M18 20V4" />
        <path d="M6 20v-4" />
      </svg>
    ),
    getValue: (tp) => {
      // Calculate energy saved based on some baseline if possible, e.g. baseline - current
      // Using 420W baseline or typical
      const current = Number(tp?.total_power_w ?? 0);
      const total = Number(tp?.devices_total ?? 15);
      const maxPossible = total * 60; // if all are fans (60W)
      const diff = maxPossible - current;
      return Math.round(Math.max(0, diff));
    },
    unit: 'W',
    sub: 'Vs. peak baseline',
  },
];

export default function StatsCards({ totalPower, alerts }) {
  return (
    <div className="stats-row">
      {cardConfig.map((card) => {
        const value = card.getValue(totalPower, alerts);
        return (
          <div key={card.key} className="stat-card">
            <div className="stat-card__header">
              <div className={`stat-card__icon ${card.iconClass}`}>
                {card.icon}
              </div>
              <span className="stat-card__label">{card.label}</span>
            </div>
            <div className="stat-card__value">
              {value}
              {card.unit && <span>{card.unit}</span>}
              {card.valueSuffix && <span>{card.valueSuffix(totalPower)}</span>}
            </div>
            <div className="stat-card__sub">
              {typeof card.sub === 'function' ? card.sub(totalPower) : card.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
}

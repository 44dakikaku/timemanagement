'use client';

import { useEffect, useState } from 'react';

// ===== 設定 =====
const STAFFS = ['北川', '小池'];

const PROPERTIES = [
  { key: '今魚店の家', short: '今' },
  { key: '樹々庵', short: '樹' },
  { key: 'はぎうみ', short: 'は' },
];

const PROPERTY_COLORS = {
  '今魚店の家': '#8B5A2B',
  '樹々庵': '#F4C430',
  'はぎうみ': '#4DB6E6',
};

const PROPERTY_COLORS_LIGHT = {
  '今魚店の家': '#EFE6DB',
  '樹々庵': '#FFF3CC',
  'はぎうみ': '#E6F6FB',
};

const CLOCK_IN_COLOR = '#BFE6A8';
const CLOCK_IN_ACTIVE = '#8FCF6A';
const CLOCK_OUT_COLOR = '#F7C1D3';
const CLOCK_OUT_ACTIVE = '#E38AA8';

const STORAGE_KEY = 'timecard_logs';
const STAFF_KEY = 'timecard_staff';

const GAS_URL =
  'https://script.google.com/macros/s/AKfycbxTz79fIWEdXCCvzR2jxMq9Rsbbm_lkhaLAYOSor1dPXyijg1eht4rJTQuSe48jQUMc/exec';

export default function Page() {
  const [staff, setStaff] = useState('');
  const [staffFixed, setStaffFixed] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [logs, setLogs] = useState([]);
  const [lastType, setLastType] = useState(null);
  const [now, setNow] = useState(new Date());

  // 時計更新
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // 初回読み込み
  useEffect(() => {
    const savedStaff = localStorage.getItem(STAFF_KEY);
    if (savedStaff) {
      setStaff(savedStaff);
      setStaffFixed(true);
    }
    const savedLogs = localStorage.getItem(STORAGE_KEY);
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  const confirmStaff = () => {
    if (!staff) return alert('名前を選んでください');
    localStorage.setItem(STAFF_KEY, staff);
    setStaffFixed(true);
  };

  const resetStaff = () => {
    localStorage.removeItem(STAFF_KEY);
    setStaff('');
    setStaffFixed(false);
  };

  const handleClock = async (type) => {
    if (!staffFixed) return alert('名前を確定してください');
    if (!selectedProperty) return alert('宿を選んでください');
    if (lastType === type) return alert('同じ操作は続けてできません');

    const record = {
      staff,
      property: selectedProperty,
      type,
      time: new Date().toISOString(),
    };

    setLogs((prev) => [record, ...prev]);
    setLastType(type);

    try {
      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
    } catch {
      alert('通信エラー');
    }
  };

  // 今日の履歴
  const today = new Date().toISOString().slice(0, 10);
  const todayPairs = [];
  let temp = null;

  logs
    .filter((l) => l.staff === staff && l.time.startsWith(today))
    .slice()
    .reverse()
    .forEach((l) => {
      if (l.type === '出勤') temp = l;
      if (l.type === '退勤' && temp) {
        todayPairs.push({
          property: l.property,
          start: temp.time,
          end: l.time,
        });
        temp = null;
      }
    });

  return (
    <main style={{ padding: 24, fontSize: 18 }}>

      {/* 現在時刻 */}
      <div style={{ fontSize: 40, fontWeight: 'bold', marginBottom: 24 }}>
        {now.toLocaleTimeString('ja-JP')}
      </div>

      {/* スタッフ選択 */}
      <section style={{ marginBottom: 24 }}>
        {!staffFixed ? (
          <>
            {STAFFS.map((s) => (
              <button
                key={s}
                onClick={() => setStaff(s)}
                style={{
                  width: '100%',
                  padding: 16,
                  marginBottom: 8,
                  fontSize: 22,
                  fontWeight: staff === s ? 'bold' : 'normal',
                }}
              >
                {s}
              </button>
            ))}
            <button onClick={confirmStaff} style={{ width: '100%', padding: 14 }}>
              確定
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{staff}</div>
            <button onClick={resetStaff} style={{ marginTop: 8, padding: 12 }}>
              変更
            </button>
          </>
        )}
      </section>

      {/* 宿選択 */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {PROPERTIES.map((p) => {
            const active = selectedProperty === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setSelectedProperty(p.key)}
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: 16,
                  border: 'none',
                  background: active
                    ? PROPERTY_COLORS[p.key]
                    : PROPERTY_COLORS_LIGHT[p.key],
                  color: active ? '#fff' : '#333',
                }}
              >
                <div style={{ fontSize: 40, fontWeight: 'bold' }}>{p.short}</div>
                <div style={{ fontSize: 14 }}>{p.key}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 出勤・退勤 */}
      <section style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
        <button
          onClick={() => handleClock('出勤')}
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            fontSize: 22,
            background: lastType === '出勤' ? CLOCK_IN_ACTIVE : CLOCK_IN_COLOR,
            border: 'none',
          }}
        >
          出勤
        </button>

        <button
          onClick={() => handleClock('退勤')}
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            fontSize: 22,
            background: lastType === '退勤' ? CLOCK_OUT_ACTIVE : CLOCK_OUT_COLOR,
            border: 'none',
          }}
        >
          退勤
        </button>
      </section>

      {/* 今日の履歴 */}
      <section>
        {todayPairs.map((p, i) => (
          <div
            key={i}
            style={{
              marginBottom: 12,
              padding: 12,
              borderRadius: 12,
              background: '#f5f5f5',
              color: PROPERTY_COLORS[p.property],
            }}
          >
            <strong>{p.property}</strong><br />
            {new Date(p.start).toLocaleTimeString('ja-JP')} 〜{' '}
            {new Date(p.end).toLocaleTimeString('ja-JP')}
          </div>
        ))}
      </section>
    </main>
  );
}

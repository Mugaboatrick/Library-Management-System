import React, { useEffect, useRef, useState } from 'react';

const CountUp = ({ value, duration = 800 }) => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const target = Number(value) || 0;
    if (typeof value !== 'number' && !/^-?\d+$/.test(String(value))) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <>{display}</>;
};

const StatCard = ({ label, value, icon, color = 'bg-primary-600', delay = 0, animate = false, glass = false }) => {
  return (
    <div
      className={`card-hover ${glass ? 'glass-card border border-white/60 rounded-2xl shadow-md' : 'bg-white rounded-lg shadow-sm border border-gray-200'} p-5`}
      style={{ animationDelay: delay ? `${delay}ms` : undefined }}
    >
      <div className="flex items-center">
        <div className={`flex items-center justify-center w-12 h-12 text-white text-xl mr-4 ${glass ? `${color} rounded-xl shadow-lg` : `${color} rounded-lg`}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold">
            {animate ? <CountUp value={value} /> : value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
import React from 'react';

const subjectStyles = {
  english: { background: '#7c2d12', accent: '#fed7aa' },
  default: { background: '#334155', accent: '#cbd5e1' }
};

const SubjectCover = ({ subject, grade, title }) => {
  const label = subject || 'General';
  const style = subjectStyles[label.toLowerCase()] || subjectStyles.default;
  const gradeLabel = grade || 'Library Edition';

  return (
    <div
      className="h-40 flex items-center justify-center p-3"
      style={{ backgroundColor: style.background }}
      aria-label={`${label} cover`}
    >
      <div
        className="h-full w-full border-2 rounded-lg flex flex-col items-center justify-center text-center px-3"
        style={{ borderColor: style.accent, color: '#ffffff' }}
      >
        <div className="text-2xl sm:text-3xl font-serif font-bold leading-tight">{label}</div>
        <div className="flex items-center gap-3 mt-2 font-serif text-xl font-bold">
          <span className="w-10 border-t-2" style={{ borderColor: style.accent }} />
          <span>{gradeLabel}</span>
          <span className="w-10 border-t-2" style={{ borderColor: style.accent }} />
        </div>
        <div className="mt-2 text-sm font-serif font-bold">By {title || 'Hope Haven Library'}</div>
        <div className="absolute sr-only">{label} {gradeLabel}</div>
        <div className="mt-auto text-[10px] tracking-wide" style={{ color: style.accent }}>HOPE HAVEN SCHOOL LIBRARY</div>
      </div>
    </div>
  );
};

export default SubjectCover;

// Access-mode helpers shared by admin + user ebook pages.
// READ_ONLY   -> read online, borrow/download disabled
// READ_BORROW -> read online AND borrow (download once borrowed)
// BORROW_ONLY -> must borrow before reading online

export const ACCESS_MODES = [
  { value: 'READ_ONLY', label: 'Read only', emoji: '', hint: 'Read online — borrowing & download disabled in the system' },
  { value: 'READ_BORROW', label: 'Read & borrow', emoji: '', hint: 'Read online and you can borrow it' },
  { value: 'BORROW_ONLY', label: 'Borrow only', emoji: '', hint: 'Borrow it first — reading online is locked until you borrow' }
];

export const accessModeInfo = (mode) =>
  ACCESS_MODES.find(m => m.value === mode) || ACCESS_MODES[0];

export const accessModeBadge = (mode) => {
  const info = accessModeInfo(mode);
  const styles = {
    READ_ONLY: 'bg-amber-100 text-amber-700',
    READ_BORROW: 'bg-indigo-100 text-indigo-700',
    BORROW_ONLY: 'bg-blue-100 text-blue-700'
  };
  return { ...info, className: styles[info.value] || styles.READ_ONLY };
};

// canReadOnline: BORROW_ONLY books can only be read while borrowed
export const canReadNow = (ebook, isBorrowed) =>
  ebook?.access_mode !== 'BORROW_ONLY' || !!isBorrowed;

// canBorrow: READ_ONLY books can never be borrowed
export const canBorrowEbook = (ebook) => ebook?.access_mode !== 'READ_ONLY';
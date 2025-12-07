'use client';

import { useState, useEffect } from 'react';
import { gregorianToPersian, persianToGregorian } from '@/lib/dateUtils';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';

const toPersianDigits = (str) =>
  str.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

const toEnglishDigits = (str) =>
  str.replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)]);

export default function PersianDatePicker({
  value,
  onChange,
  label,
  required = false,
  dir = 'ltr',
  placeholder = 'مثال: 01-01-1403',
}) {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);

  // When parent updates Gregorian value → convert to Persian digits
  useEffect(() => {
    if (!value) {
      setInputValue('');
      return;
    }
    const persian = gregorianToPersian(value);
    if (persian) setInputValue(toPersianDigits(persian));
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value;

    // Always store Persian digits in UI
    const persianDisplay = toPersianDigits(raw);
    setInputValue(persianDisplay);

    // Convert Persian digits → English before parsing
    const english = toEnglishDigits(raw);

    // Trigger conversion only when complete YYYY-MM-DD
    const full = /^\d{4}-\d{2}-\d{2}$/;
    if (!full.test(english)) return;

    const g = persianToGregorian(english);
    if (g) onChange(g);
  };

  const handleCalendarSelect = (dateObj) => {
    if (!dateObj) return;

    const formatted = dateObj.format("YYYY-MM-DD"); // Persian with English digits
    const persianDigits = toPersianDigits(formatted);

    handleChange({ target: { value: persianDigits } });

    setOpen(false);
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm text-gray-300 mb-2">
          {label}
          {required && ' *'}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          required={required}
          dir={dir}
          placeholder={toPersianDigits(placeholder)}
          inputMode="numeric"
          className="
form-input w-full pr-9
          "
        />

        {/* Tiny calendar button */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          style={{ fontSize: '16px', padding: 0, lineHeight: 1 }}
        >
          📅
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-2 shadow-md rounded bg-[#222]">
          <DatePicker
            calendar={persian}
            locale={persian_fa}
            value={toEnglishDigits(inputValue) || null}
            onChange={handleCalendarSelect}
            calendarPosition="bottom"
            containerStyle={{
              backgroundColor: "#222",
            }}  
            style={{
              backgroundColor: "#222",
              color: "#fff",
              border: "1px solid #444",
            }}
          />
        </div>
      )}

      <p className="text-xs text-gray-400 mt-1">
        فرمت: YYYY-MM-DD
      </p>
    </div>
  );
}
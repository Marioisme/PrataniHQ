import React from 'react';
import type { PilarItem, TodoContentItem } from '../types';

export const DEFAULT_PILARS: PilarItem[] = [
  { nama: 'Educational', bg: 'rgba(77,158,247,0.15)', color: '#4d9ef7' },
  { nama: 'Promotional', bg: 'rgba(247,164,77,0.15)', color: '#f7a44d' },
  { nama: 'Entertainment', bg: 'rgba(155,130,245,0.15)', color: '#9b82f5' },
  { nama: 'Inspirational', bg: 'rgba(76,201,160,0.15)', color: '#4cc9a0' },
  { nama: 'Behind Scene', bg: 'rgba(247,109,109,0.15)', color: '#f76d6d' },
  { nama: 'Testimonial', bg: 'rgba(200,200,200,0.12)', color: '#9dbdd8' }
];

export const HARI_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function getHari(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return isNaN(d.getTime()) ? '—' : HARI_NAMES[d.getDay()];
}

export function fmtTanggal(str?: string): string {
  if (!str) return '—';
  const parts = str.split('-');
  if (parts.length < 3) return str;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function hexToRgba(hex: string, alpha = 0.15): string {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(100, 100, 100, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getPilarStyle(nama: string, pilars: PilarItem[]): React.CSSProperties {
  const p = pilars.find((x) => (x.nama || '').toLowerCase() === (nama || '').toLowerCase());
  if (p) {
    return {
      backgroundColor: p.bg,
      color: p.color
    };
  }
  return {
    backgroundColor: 'rgba(90, 122, 154, 0.15)',
    color: 'var(--text2)'
  };
}

export const BRAND_LABEL: Record<string, string> = {
  dikopi: 'Dikopi',
  kolektiva: 'Kolektiva',
  imagineer: 'Imagineer',
  evercraft: 'Evercraft',
  snm: 'SNM',
  studio: 'Studio',
  pratani: 'Pratani'
};

export const BRAND_ICONS: Record<string, string> = {
  dikopi: '☕',
  kolektiva: '🛍️',
  imagineer: '✨',
  evercraft: '📦',
  snm: '🎨',
  studio: '🎙️',
  pratani: '🌾'
};

export const SAMPLE_TEMPLATE_JSON: Partial<TodoContentItem>[] = [
  {
    brand: 'dikopi',
    bulan: '2026-10',
    tanggalPosting: '2026-10-15',
    pilar: 'Educational',
    format: 'Carousel',
    judul: '5 Cara Menikmati Kopi Cold Brew di Cuaca Panas',
    hook: 'Sering merasa cold brew kurang nendang? Coba 5 cara ini!',
    cta: 'Save postingan ini untuk inspirasi ngopi siang nanti!',
    hashtag: '#dikopi #coldbrew #manualbrew #kopilokal',
    notes: 'Slide 1: Cover menarik, Slide 2-4: Tips, Slide 5: CTA promo weekend',
    done: false,
    boardStatus: 'not_started'
  },
  {
    brand: 'kolektiva',
    bulan: '2026-10',
    tanggalPosting: '2026-10-18',
    pilar: 'Promotional',
    format: 'Reels',
    judul: 'Behind The Stitch: Proses Pembuatan Totebag Kanvas',
    hook: 'Bukan sekadar totebag, ini proses 10 jam di balik layarnya.',
    cta: 'Cek katalog link di bio untuk order batch terbatas.',
    hashtag: '#kolektiva #canvascraft #totebaghandmade #localbrand',
    notes: 'Video durasi 30 detik dengan transisi beat musik cepat.',
    done: false,
    boardStatus: 'in_progress'
  }
];

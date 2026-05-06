export interface Collection {
  id: string;
  name: string;
  name_ro: string;
  name_en: string;
  name_ja: string;
  description: string | null;
  collection_type: 'subject' | 'provenance' | 'other';
  created_at: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  publisher: string | null;
  year: number | null;
  language: string;
  genre: string | null;
  volumes: number;
  location: string;
  collection_id: string | null;
  collection?: Collection;
  is_available: boolean;
  description: string | null;
  created_at: string;
}

export interface Loan {
  id: string;
  book_id: string;
  book?: Book;
  borrower_name: string;
  borrower_email: string;
  borrower_phone: string | null;
  borrower_faculty: string | null;
  borrower_year: number | null;
  loan_date: string;
  due_date: string | null;
  return_date: string | null;
  condition_on_return: string | null;
  notes: string | null;
  created_at: string;
}

export type Language = 'ro' | 'en' | 'ja';

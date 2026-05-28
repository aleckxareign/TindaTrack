-- Run this in your Supabase SQL Editor to set up the database

CREATE TABLE IF NOT EXISTS paninda (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  stock INTEGER DEFAULT 0,
  img TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id BIGSERIAL PRIMARY KEY,
  total NUMERIC NOT NULL,
  payment TEXT NOT NULL DEFAULT 'cash',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT REFERENCES sales(id) ON DELETE CASCADE,
  paninda_id BIGINT REFERENCES paninda(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  qty INTEGER NOT NULL,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utangs (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  paid NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utang_history (
  id BIGSERIAL PRIMARY KEY,
  utang_id BIGINT REFERENCES utangs(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to safely decrement stock
CREATE OR REPLACE FUNCTION decrement_stock(item_id BIGINT, qty INTEGER)
RETURNS void AS $$
  UPDATE paninda SET stock = GREATEST(0, stock - qty) WHERE id = item_id;
$$ LANGUAGE SQL;

-- Enable Realtime on all tables
ALTER PUBLICATION supabase_realtime ADD TABLE paninda;
ALTER PUBLICATION supabase_realtime ADD TABLE sales;
ALTER PUBLICATION supabase_realtime ADD TABLE sale_items;
ALTER PUBLICATION supabase_realtime ADD TABLE utangs;
ALTER PUBLICATION supabase_realtime ADD TABLE utang_history;



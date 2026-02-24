-- 玩家回合額度表
-- 在 Supabase SQL Editor 中執行此腳本

create table if not exists user_quotas (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  turns_remaining integer not null default 0,
  updated_at      timestamptz not null default now()
);

alter table user_quotas enable row level security;

-- 使用者只能讀取自己的額度
create policy "quota_select"
  on user_quotas for select
  using (auth.uid() = user_id);

-- 使用者只能新增自己的額度列
create policy "quota_insert"
  on user_quotas for insert
  with check (auth.uid() = user_id);

-- 使用者只能更新自己的額度
create policy "quota_update"
  on user_quotas for update
  using (auth.uid() = user_id);

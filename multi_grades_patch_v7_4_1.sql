-- مدرسك v7.4.1 - Multi Grades Patch
alter table public.ads add column if not exists grades jsonb default '[]'::jsonb;
alter table public.ads add column if not exists grade_section text;

create or replace function public.modaresk_grade_section(g text)
returns text
language sql
immutable
as $$
  select case
    when g is null or trim(g) = '' then null
    when g like '%ابتدائي%' then 'primary'
    when g like '%إعدادي%' or g like '%اعدادي%' then 'prep'
    when g like '%ثانوي%' then 'secondary'
    else null
  end
$$;

update public.ads
set
  grades = case
    when grades is null or jsonb_array_length(grades) = 0 then to_jsonb(array[grade])
    else grades
  end,
  grade_section = coalesce(grade_section, public.modaresk_grade_section(grade))
where grade is not null;

create index if not exists ads_grades_gin_idx on public.ads using gin (grades);
create index if not exists ads_grade_section_idx on public.ads (grade_section);

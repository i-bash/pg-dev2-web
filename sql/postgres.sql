create or replace function trace(enable boolean) returns void
security definer
language sql
as $$
	select set_config('log_min_duration_statement',case when enable then '0' else '-1' end,true);
$$;
grant execute on function trace to web,emp;

alter role emp login;
alter role web login;

grant usage on schema empapi to emp;
grant usage on schema webapi to web;

alter function empapi.get_catalog security definer;

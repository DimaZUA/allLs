const sql = require("C:/Dem/Kvplat/kvplat2024/Files/OUT/AllLS/SITE_UT/db.js");

async function main() {
  const tables = await sql`
    select
      n.nspname as schema,
      c.relname as table,
      c.relrowsecurity as rls,
      coalesce(
        array_agg(distinct p.grantee || ':' || p.privilege_type)
          filter (where p.grantee in ('anon', 'authenticated', 'service_role')),
        array[]::text[]
      ) as api_grants
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    left join information_schema.role_table_grants p
      on p.table_schema = n.nspname
     and p.table_name = c.relname
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and c.relname in ('resident_access_tokens', 'resident_visits', 'homes', 'corrections')
    group by 1, 2, 3
    order by 2
  `;

  const functions = await sql`
    select
      p.proname,
      coalesce(
        array_agg(distinct r.rolname)
          filter (where r.rolname in ('anon', 'authenticated', 'service_role', 'public')),
        array[]::name[]
      ) as execute_roles
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    left join aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a on true
    left join pg_roles r on r.oid = a.grantee
    where n.nspname = 'public'
      and p.proname in ('resident_get_ls', 'resident_visit_log', 'resident_token_make')
      and a.privilege_type = 'EXECUTE'
    group by p.proname
    order by p.proname
  `;

  console.log(JSON.stringify({ tables, functions }, null, 2));
}

main()
  .catch((error) => {
    console.error(JSON.stringify({ code: error.code, message: error.message }));
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });

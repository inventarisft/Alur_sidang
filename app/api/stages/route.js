import { pool, initDb, DEFAULT_PRODI, DEFAULT_CARDS } from '@/lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const id = parseInt(searchParams.get('id'));

  try {
    await initDb();
    if (type === 'prodi') {
      const { rows } = await pool.query('SELECT * FROM prodi_list ORDER BY id ASC');
      return Response.json(rows);
    }
    const { rows } = await pool.query('SELECT * FROM flow_cards ORDER BY step_number ASC, id ASC');
    return Response.json(rows);
  } catch (err) { return Response.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const action = searchParams.get('action');

  try {
    await initDb();
    const body = await req.json();

    if (type === 'prodi') {
      const { code, name, icon, color } = body;
      const { rows } = await pool.query('INSERT INTO prodi_list (code, name, icon, color) VALUES ($1,$2,$3,$4) ON CONFLICT (code) DO NOTHING RETURNING *', [code, name, icon || 'fa-graduation-cap', color || '#0f172a']);
      return Response.json(rows[0] || {}, { status: 201 });
    }

    if (action === 'reset') {
      await pool.query('DELETE FROM flow_cards');
      await pool.query('DELETE FROM prodi_list');
      for (const p of DEFAULT_PRODI) await pool.query('INSERT INTO prodi_list (code, name, icon, color) VALUES ($1,$2,$3,$4)', [p.code, p.name, p.icon, p.color]);
      for (const c of DEFAULT_CARDS) await pool.query('INSERT INTO flow_cards (step_number, title, description, note, te_term, tind_term, tb_term, skip_tind, shape, docs_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [c.step_number, c.title, c.description, c.note, c.te_term, c.tind_term, c.tb_term, c.skip_tind, c.shape, c.docs_json]);
      const { rows } = await pool.query('SELECT * FROM flow_cards ORDER BY step_number ASC, id ASC');
      return Response.json(rows);
    }

    const { step_number, title, description, note, te_term, tind_term, tb_term, skip_tind, shape, docs_json } = body;
    const { rows } = await pool.query(
      'INSERT INTO flow_cards (step_number, title, description, note, te_term, tind_term, tb_term, skip_tind, shape, docs_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [parseInt(step_number) || 1, title, description, note || '', te_term || '', tind_term || '', tb_term || '', !!skip_tind, shape || 'process', docs_json || '[]']
    );
    return Response.json(rows[0], { status: 201 });
  } catch (err) { return Response.json({ error: err.message }, { status: 500 }); }
}

export async function PUT(req) {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get('id'));

  try {
    await initDb();
    const body = await req.json();
    const { step_number, title, description, note, te_term, tind_term, tb_term, skip_tind, shape, docs_json } = body;
    const { rows } = await pool.query(
      'UPDATE flow_cards SET step_number=$1, title=$2, description=$3, note=$4, te_term=$5, tind_term=$6, tb_term=$7, skip_tind=$8, shape=$9, docs_json=$10 WHERE id=$11 RETURNING *',
      [parseInt(step_number) || 1, title, description, note || '', te_term || '', tind_term || '', tb_term || '', !!skip_tind, shape || 'process', docs_json || '[]', id]
    );
    return Response.json(rows[0] || {});
  } catch (err) { return Response.json({ error: err.message }, { status: 500 }); }
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const id = parseInt(searchParams.get('id'));

  try {
    await initDb();
    if (type === 'prodi') {
      await pool.query('DELETE FROM prodi_list WHERE id=$1', [id]);
    } else {
      await pool.query('DELETE FROM flow_cards WHERE id=$1', [id]);
    }
    return Response.json({ success: true });
  } catch (err) { return Response.json({ error: err.message }, { status: 500 }); }
}

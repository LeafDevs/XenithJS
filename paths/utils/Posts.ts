import * as SQL from './SQL'

const accept_post = async (id: Number) => {
    const connection = await SQL.getConnection();
    await connection.run('UPDATE jobs SET accepted = ? WHERE id = ?', [true, id]);
}

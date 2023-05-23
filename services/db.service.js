import pg from 'pg';

const dbPool = new pg.Pool();

export {
    dbPool
};
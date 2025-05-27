CREATE TABLE IF NOT EXISTS participant (
    id SERIAL PRIMARY KEY,
    name VARCHAR
    -- Future columns, first_name, last_name, email
);

COMMENT ON COLUMN participant.name IS 'Name of the bill participant';

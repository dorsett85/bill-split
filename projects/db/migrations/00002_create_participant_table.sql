CREATE TABLE IF NOT EXISTS participant (
    id SERIAL PRIMARY KEY,
    bill_id INT,
    name VARCHAR,
    FOREIGN KEY (bill_id) REFERENCES bill(id) ON DELETE CASCADE
    -- Future columns, first_name, last_name, email
);

COMMENT ON COLUMN participant.name IS 'Name of the bill participant';

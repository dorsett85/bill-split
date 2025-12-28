CREATE TABLE IF NOT EXISTS participant_line_item (
    id SERIAL PRIMARY KEY,
    line_item_id INT NOT NULL,
    participant_id INT NOT NULL,
    pct_owes REAL,
    FOREIGN KEY (line_item_id) REFERENCES line_item(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participant(id) ON DELETE CASCADE,
    CONSTRAINT participant_line_item_unique_ids UNIQUE(line_item_id, participant_id)
);

COMMENT ON COLUMN participant_line_item.pct_owes IS 'The percent of the item a participant owes';

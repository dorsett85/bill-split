CREATE TABLE IF NOT EXISTS line_item_participant (
    id SERIAL PRIMARY KEY,
    line_item_id INT,
    participant_id INT,
    pct_owes REAL,
    FOREIGN KEY (line_item_id) REFERENCES line_item(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participant(id) ON DELETE CASCADE,
    CONSTRAINT line_item_participant_unique_ids UNIQUE(line_item_id, participant_id)
);

COMMENT ON COLUMN line_item_participant.pct_owes IS 'The percent of the item a participant owes';

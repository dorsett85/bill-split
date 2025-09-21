CREATE TABLE IF NOT EXISTS line_item_participant (
    id SERIAL PRIMARY KEY,
    line_item_id INT,
    participant_id INT,
    FOREIGN KEY (line_item_id) REFERENCES line_item(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participant(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bill_participant (
    id SERIAL PRIMARY KEY,
    bill_id INT,
    participant_id INT,
    FOREIGN KEY (bill_id) REFERENCES bill(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participant(id)
);

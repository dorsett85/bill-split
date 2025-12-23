CREATE TABLE IF NOT EXISTS bill (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR,
    business_location VARCHAR,
    gratuity NUMERIC,
    tip NUMERIC,
    image_path VARCHAR,
    image_status VARCHAR CHECK (image_status IN ('parsing', 'ready', 'error')),
    name VARCHAR,
    tax NUMERIC,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN bill.business_name IS 'Name of the business';
COMMENT ON COLUMN bill.business_location IS 'Location of the business, may split up or make it a geolocation';
COMMENT ON COLUMN bill.gratuity IS 'Gratuity expressed as a total amount';
COMMENT ON COLUMN bill.tip IS 'Tip expressed as a percent';
COMMENT ON COLUMN bill.image_path IS 'Storage path of the receipt';
COMMENT ON COLUMN bill.name IS 'Name of the bill';
COMMENT ON COLUMN bill.image_status IS 'State of extracting and parsing image text data';
COMMENT ON COLUMN bill.tax IS 'Tax expressed as a percent';
COMMENT ON COLUMN bill.created_at IS 'When the record was created';

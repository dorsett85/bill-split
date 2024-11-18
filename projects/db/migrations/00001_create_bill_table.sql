CREATE TABLE IF NOT EXISTS bill (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR,
    business_location VARCHAR,
    gratuity numeric,
    image_path varchar,
    name varchar,
    tax numeric
);

COMMENT ON COLUMN bill.business_name IS 'Name of the business';
COMMENT ON COLUMN bill.business_location IS 'Location of the business, may split up or make it a geolocation';
COMMENT ON COLUMN bill.gratuity IS 'Gratuity expressed as a percent';
COMMENT ON COLUMN bill.image_path IS 'Storage path of the receipt';
COMMENT ON COLUMN bill.name IS 'Name of the bill';
COMMENT ON COLUMN bill.tax IS 'Tax expressed as a percent';

ALTER TABLE bill
ADD discount NUMERIC;

COMMENT ON COLUMN bill.discount IS 'The total discount applied before tax';

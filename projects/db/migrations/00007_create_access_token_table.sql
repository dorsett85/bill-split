CREATE TABLE IF NOT EXISTS access_token (
  id SERIAL PRIMARY KEY,
  hashed_token VARCHAR UNIQUE NOT NULL,
  encrypted_token VARCHAR NOT NULL,
  initialization_vector VARCHAR NOT NULL,
  active BOOLEAN NOT NULL,
  no_of_uses NUMERIC NOT NULL
);

COMMENT ON COLUMN access_token.hashed_token IS 'Hashed access token for lookup';
COMMENT ON COLUMN access_token.encrypted_token IS 'Encrypted access token';
COMMENT ON COLUMN access_token.initialization_vector IS 'Initialization vector for the token';
COMMENT ON COLUMN access_token.active IS 'Whether the token can be used';
COMMENT ON COLUMN access_token.no_of_uses IS 'How many times users have used the token';

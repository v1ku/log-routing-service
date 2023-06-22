CREATE TABLE IF NOT EXISTS log (
    id INT PRIMARY KEY,
    unix_ts BIGINT,
    user_id INT,
    event_name VARCHAR(255)
);

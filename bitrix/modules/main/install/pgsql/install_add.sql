ALTER TABLE b_group ALTER COLUMN id RESTART WITH 10;

CREATE OR REPLACE FUNCTION UNIX_TIMESTAMP(date_field timestamp with time zone) RETURNS integer 
AS $$
BEGIN
    RETURN extract(epoch FROM date_field);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION bx_lastval()
   RETURNS bigint AS $$
BEGIN
    RETURN lastval();
    EXCEPTION WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION bx_get_lock(p_key bigint, p_timeout numeric)
RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
    t0 timestamptz := clock_timestamp();
BEGIN
    LOOP
        IF pg_try_advisory_lock(p_key) THEN
            RETURN 0;
        ELSIF (p_timeout >= 0) and (clock_timestamp() > t0 + (p_timeout||' seconds')::interval) THEN
            RETURN 1;
        ELSE
            PERFORM pg_sleep(0.01); /* 10 ms */
        END IF;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION bx_release_lock(p_key bigint)
RETURNS integer
LANGUAGE plpgsql AS $$
BEGIN
    IF pg_advisory_unlock(p_key) THEN
        RETURN 0;
    ELSE
        RETURN 1;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION substring_index(
  str text,
  delim text,
  count integer = 1,
  out substring_index text
)
RETURNS text AS $$
BEGIN
  IF count > 0 THEN
    substring_index = array_to_string((string_to_array(str, delim))[:count], delim);
  ELSE
    DECLARE
      _array TEXT[];
    BEGIN
      _array = string_to_array(str, delim);
      substring_index = array_to_string(_array[array_length(_array, 1) + count + 1:], delim);
    END;
  END IF;
END;
$$
LANGUAGE 'plpgsql'
IMMUTABLE
CALLED ON NULL INPUT;

CREATE OR REPLACE FUNCTION safe_text_for_tsvector(text_content text, config regconfig DEFAULT 'english')
RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
    test TEXT;
    search_position INTEGER;
    step INTEGER;
    direction INTEGER;
BEGIN
    IF text_content IS NULL THEN
        RETURN NULL;
    END IF;

    BEGIN
        PERFORM to_tsvector(config, text_content);
        RETURN text_content;
    EXCEPTION
        WHEN program_limit_exceeded THEN
        BEGIN
            search_position := least(length(text_content), 1000000);
            step := search_position / 2;
            direction := -1;
            LOOP
                search_position := search_position + (step * direction);
                BEGIN
                    test := substring(text_content, 1, search_position);
                    PERFORM to_tsvector(config, test);
                    IF step < 32 THEN
                        RETURN test;
                    END IF;
                    direction := 1;
                EXCEPTION
                    WHEN program_limit_exceeded THEN
                        direction := -1;
                END;
                step := step / 2;
            END LOOP;
        END;
    END;

    RETURN '';
END;
$$;

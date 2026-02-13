-- ============================================
-- Database Functions for Authentication
-- ============================================

-- Enable pgcrypto extension for bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to verify login using username or email
CREATE OR REPLACE FUNCTION verify_login(
    p_username_or_email TEXT,
    p_password TEXT
)
RETURNS TABLE (
    user_id TEXT,
    username TEXT,
    email TEXT,
    full_name TEXT,
    is_active BOOLEAN,
    department_id TEXT
) AS $$
DECLARE
    v_user RECORD;
    v_password_hash TEXT;
BEGIN
    -- Find user by username or email
    SELECT 
        u.id,
        u.username,
        u.email,
        u."fullName",
        u.password_hash,
        u.is_active,
        u.department_id
    INTO v_user
    FROM users u
    WHERE (u.username = p_username_or_email OR u.email = p_username_or_email)
      AND u.is_active = true;

    -- If user not found, return empty
    IF v_user IS NULL THEN
        RETURN;
    END IF;

    -- Verify password using bcrypt
    IF crypt(p_password, v_user.password_hash) = v_user.password_hash THEN
        RETURN QUERY SELECT
            v_user.id::TEXT,
            v_user.username,
            v_user.email,
            v_user."fullName",
            v_user.is_active,
            v_user.department_id::TEXT;
    END IF;

    -- Password doesn't match, return empty
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to hash password using bcrypt
CREATE OR REPLACE FUNCTION hash_password(p_password TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN crypt(p_password, gen_salt('bf', 12));
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_login(TEXT, TEXT) TO research_app;
GRANT EXECUTE ON FUNCTION hash_password(TEXT) TO research_app;
